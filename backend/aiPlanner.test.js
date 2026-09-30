const test = require("node:test");
const assert = require("node:assert/strict");
const { generateAiMilestones, validateGeneratedPlan } = require("./aiPlanner");

const input = { title: "Build a dashboard", description: "Build a responsive dashboard for service managers with clear weekly metrics.", requiredSkills: ["React", "Node.js"], budget: 100.01, deadline: "2030-12-31" };
const milestones = [
  { title: "Scope", description: "Agree on screen and data requirements.", weight: 25, dependsOn: [] },
  { title: "Build", description: "Implement dashboard screens and API.", weight: 50, dependsOn: [0] },
  { title: "Handoff", description: "Test and deliver working files.", weight: 25, dependsOn: [1] },
];

test("explicit AI request uses private structured output and returns a validated, cent-exact editable draft", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ status: "completed", output: [{ type: "reasoning" }, { type: "message", content: [{ type: "output_text", text: JSON.stringify({ milestones }) }] }] }) };
  };
  const result = await generateAiMilestones(input, { fetchImpl, apiKey: "test-only-key" });
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.strict, true);
  assert.equal(request.body.text.format.type, "json_schema");
  assert.equal(request.body.input.includes(input.description), true);
  assert.equal(request.options.headers.Authorization, "Bearer test-only-key");
  assert.equal(result.method, "ai_assisted");
  assert.equal(Math.round(result.suggestions.reduce((sum, step) => sum + step.payment, 0) * 100), 10001);
  assert.deepEqual(result.suggestions.map(step => step.dependsOn), [[], [0], [1]]);
});

test("rejects unsafe model output and refusal instead of publishing a fallback", async () => {
  assert.throws(() => validateGeneratedPlan({ milestones: [{ ...milestones[0], dependsOn: [0] }, milestones[1]] }, 100), /invalid milestone plan/);
  assert.throws(() => validateGeneratedPlan({ milestones: [milestones[0], { ...milestones[1], weight: -1 }] }, 100), /invalid milestone plan/);
  await assert.rejects(() => generateAiMilestones(input, { apiKey: "test-only-key", fetchImpl: async () => ({ ok: true, json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "Cannot comply" }] }] }) }) }), /could not produce/);
  await assert.rejects(() => generateAiMilestones(input, { fetchImpl: () => { throw new Error("should not call"); }, apiKey: "" }), /not configured/);
});
