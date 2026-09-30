const test = require("node:test");
const assert = require("node:assert/strict");
const { projectOutlook } = require("./outlook");

const now = new Date("2026-09-15T12:00:00Z");
const steps = [
  { status: "completed", approvedAt: "2026-09-10T10:00:00Z" },
  { status: "completed", approvedAt: "2026-09-14T10:00:00Z" },
  { status: "active", approvedAt: null },
  { status: "locked", approvedAt: null },
];
const base = { status: "In Progress", deadline: "2026-09-18", milestones: steps, activity: [{ type: "milestone_approved", createdAt: "2026-09-14T10:00:00Z" }] };

test("estimates completion from observed approvals and explains a likely late finish", () => {
  const result = projectOutlook(base, now);
  assert.equal(result.status, "forecast_late");
  assert.equal(result.method, "observed_milestone_pace");
  assert.equal(result.paceDays, 4);
  assert.equal(result.projectedDate, "2026-09-23");
  assert.equal(result.daysBeyondDeadline, 5);
  assert.match(result.nextAction, /scope or the deadline/);
});

test("does not invent a forecast from a single or missing approval date", () => {
  const result = projectOutlook({ ...base, milestones: [{ status: "completed", approvedAt: null }, { status: "active" }] }, now);
  assert.equal(result.status, "insufficient_data");
  assert.equal(result.projectedDate, null);
  assert.equal(result.paceDays, null);
});

test("separates current revision and inactivity evidence from pace", () => {
  const revised = projectOutlook({ ...base, deadline: "2026-10-20", milestones: [{ ...steps[0] }, { ...steps[1] }, { ...steps[2], revisionCount: 2 }, steps[3]] }, now);
  assert.equal(revised.status, "needs_review");
  assert.ok(revised.signals.some(signal => signal.includes("multiple revisions")));
  assert.match(revised.nextAction, /acceptance criteria/);
  const idle = projectOutlook({ ...base, deadline: "2026-10-20", milestones: [{ status: "active" }], activity: [{ type: "freelancer_assigned", createdAt: "2026-09-01T00:00:00Z" }] }, now);
  assert.equal(idle.status, "needs_review");
  assert.match(idle.signals[0], /14 days/);
});

test("handles on-pace, overdue, open and completed projects without false forecasts", () => {
  assert.equal(projectOutlook({ ...base, deadline: "2026-10-20" }, now).status, "on_pace");
  assert.equal(projectOutlook({ ...base, deadline: "2026-09-14" }, now).status, "overdue");
  assert.equal(projectOutlook({ ...base, status: "Open" }, now).status, "not_started");
  assert.equal(projectOutlook({ ...base, status: "Completed" }, now).status, "complete");
});
