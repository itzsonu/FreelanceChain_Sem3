const test = require("node:test");
const assert = require("node:assert/strict");
const { trustFromProjects, matchApplicant } = require("./scoring");

test("cold-start freelancer is unscored, not assigned a made-up trust value", () => {
  assert.deepEqual(trustFromProjects([]), {
    score: null, label: "New on FreelanceChain", approvedMilestones: 0, completedProjects: 0, revisionRequests: 0, scoredMilestones: 0, clientCount: 0,
  });
});

test("trust uses approved work and limits repeated revision impact", () => {
  const clean = trustFromProjects([{ status: "Completed", milestones: [{ status: "completed", revisionCount: 0 }, { status: "completed", revisionCount: 0 }] }]);
  const revised = trustFromProjects([{ status: "Completed", milestones: [{ status: "completed", revisionCount: 1 }, { status: "completed", revisionCount: 0 }] }]);
  const repeated = trustFromProjects([{ status: "Completed", milestones: [{ status: "completed", revisionCount: 8 }, { status: "completed", revisionCount: 0 }] }]);
  assert.equal(clean.approvedMilestones, 2);
  assert.equal(clean.completedProjects, 1);
  assert.ok(clean.score > revised.score);
  assert.equal(revised.score, repeated.score);
  assert.equal(repeated.revisionRequests, 8);
});

test("pending or active milestones do not affect the verified score", () => {
  assert.deepEqual(trustFromProjects([{ status: "In Progress", milestones: [{ status: "active", revisionCount: 5 }, { status: "submitted", revisionCount: 1 }] }]).score, null);
});

test("many approvals from one client cannot inflate scored evidence indefinitely", () => {
  const project = count => ({ client: "client-one", status: "Completed", milestones: Array.from({ length: count }, () => ({ status: "completed", revisionCount: 0 })) });
  const three = trustFromProjects([project(3)]);
  const twenty = trustFromProjects([project(10), project(10)]);
  assert.equal(three.score, twenty.score);
  assert.equal(twenty.approvedMilestones, 20);
  assert.equal(twenty.scoredMilestones, 3);
  assert.equal(twenty.clientCount, 1);
  assert.equal(twenty.label, "Limited client history");
  const revisedThree = trustFromProjects([{ client: "client-one", status: "Completed", milestones: [0, 0, 1].map(revisionCount => ({ status: "completed", revisionCount })) }]);
  const revisedTwenty = trustFromProjects([{ client: "client-one", status: "Completed", milestones: [1, ...Array(19).fill(0)].map(revisionCount => ({ status: "completed", revisionCount })) }]);
  assert.equal(revisedThree.score, revisedTwenty.score);
});

test("different client accounts add evidence, while revised approvals keep priority under the cap", () => {
  const work = (client, revisionCounts) => ({ client, status: "Completed", milestones: revisionCounts.map(revisionCount => ({ status: "completed", revisionCount })) });
  const oneClient = trustFromProjects([work("client-one", [0, 0, 0, 0])]);
  const twoClients = trustFromProjects([work("client-one", [0, 0, 0, 0]), work("client-two", [0, 0, 0, 0])]);
  const revised = trustFromProjects([work("client-one", [0, 0, 0, 0]), work("client-two", [1, 1, 1, 1])]);
  assert.equal(twoClients.scoredMilestones, 6);
  assert.equal(twoClients.clientCount, 2);
  assert.equal(twoClients.label, "Multiple client accounts");
  assert.ok(twoClients.score > oneClient.score);
  assert.ok(revised.score < twoClients.score);
});

test("matching explains skills and does not invent a trust score for new freelancers", () => {
  const match = matchApplicant(["Figma", "Branding"], { skills: ["figma"], experienceYears: 4 }, { score: null });
  assert.deepEqual(match.matchedSkills, ["Figma"]);
  assert.deepEqual(match.missingSkills, ["Branding"]);
  assert.equal(match.trustIncluded, false);
  assert.equal(match.score, 55);
});

test("common framework spellings match without treating distinct skills as equivalent", () => {
  const match = matchApplicant(["React", "Node.js", "React Native"], { skills: ["ReactJS", "NodeJS"], experienceYears: 2 }, { score: null });
  assert.deepEqual(match.matchedSkills, ["React", "Node.js"]);
  assert.deepEqual(match.missingSkills, ["React Native"]);
});
