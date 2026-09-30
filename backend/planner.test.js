const test = require("node:test");
const assert = require("node:assert/strict");
const { suggestMilestones } = require("./planner");

const brief = "Build a responsive client dashboard with account data and clear approval flows.";

test("full-stack brief gets parallel work followed by integration", () => {
  const plan = suggestMilestones({ title: "Client portal", description: brief, requiredSkills: ["React", "Node.js"], budget: 10001 });
  assert.equal(plan.method, "guided_template");
  assert.deepEqual(plan.suggestions.map(step => step.dependsOn), [[], [0], [0], [1, 2]]);
  assert.equal(plan.suggestions.reduce((sum, step) => sum + step.payment, 0), 10001);
  assert.match(plan.explanation, /Review every step/);
});

test("content brief gets an editable sequential draft", () => {
  const plan = suggestMilestones({ title: "Blog launch", description: "Research and write articles for a new public blog, including an editorial review.", requiredSkills: ["Copywriting"], budget: 999.99 });
  assert.deepEqual(plan.suggestions.map(step => step.dependsOn), [[], [0], [1]]);
  assert.equal(plan.suggestions[0].title, "Outline and research");
  assert.equal(plan.suggestions.reduce((sum, step) => sum + step.payment, 0), 999.99);
});

test("invalid project inputs are rejected before planning", () => {
  assert.throws(() => suggestMilestones({ title: "x", description: "short", requiredSkills: ["React"], budget: 100 }), /brief/);
  assert.throws(() => suggestMilestones({ title: "x", description: brief, requiredSkills: [], budget: 100 }), /skills/);
  assert.throws(() => suggestMilestones({ title: "x", description: brief, requiredSkills: ["React"], budget: 0 }), /budget/);
});
