const DAY = 24 * 60 * 60 * 1000;

function validTime(value) {
  if (value === null || value === undefined || value === "") return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function dateOnly(time) {
  return new Date(time).toISOString().slice(0, 10);
}

function projectOutlook(project, now = new Date()) {
  const milestones = project.milestones || [];
  const total = milestones.length;
  const approved = milestones.filter(step => step.status === "completed").length;
  const remaining = total - approved;
  const base = { method: "observed_milestone_pace", approved, total, paceDays: null, projectedDate: null, daysBeyondDeadline: null, signals: [], nextAction: null };

  if (project.status === "Completed" || (total > 0 && remaining === 0)) {
    return { ...base, status: "complete", headline: "All milestones approved" };
  }
  if (project.status === "Open") {
    return { ...base, status: "not_started", headline: "Forecast starts after work is underway" };
  }

  const nowTime = validTime(now);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(project.deadline || "") ? Date.parse(`${project.deadline}T00:00:00.000Z`) : NaN;
  const signals = [];
  const repeated = milestones.filter(step => step.status !== "completed" && Number(step.revisionCount || 0) >= 2);
  if (repeated.length) signals.push(`${repeated.length} unfinished milestone${repeated.length === 1 ? " has" : "s have"} needed multiple revisions.`);

  const activityTimes = [
    ...(project.activity || []).map(item => validTime(item.createdAt)),
    ...milestones.flatMap(step => [validTime(step.submittedAt), validTime(step.approvedAt), validTime(step.revisionRequestedAt)]),
  ].filter(time => time !== null && time <= nowTime);
  const latestActivity = activityTimes.length ? Math.max(...activityTimes) : null;
  if (latestActivity !== null && (nowTime - latestActivity) >= 7 * DAY && !milestones.some(step => ["submitted", "revision_requested"].includes(step.status))) {
    signals.push(`No recorded project activity for ${Math.floor((nowTime - latestActivity) / DAY)} days.`);
  }

  const approvalTimes = milestones.filter(step => step.status === "completed").map(step => validTime(step.approvedAt)).filter(time => time !== null && time <= nowTime).sort((a, b) => a - b);
  let paceDays = null;
  let projectedDate = null;
  let daysBeyondDeadline = null;
  if (approvalTimes.length >= 2 && approvalTimes.at(-1) - approvalTimes[0] >= DAY) {
    paceDays = Math.max(1, Math.ceil((approvalTimes.at(-1) - approvalTimes[0]) / (approvalTimes.length - 1) / DAY));
    const projectedTime = today + paceDays * remaining * DAY;
    projectedDate = dateOnly(projectedTime);
    if (Number.isFinite(deadline)) daysBeyondDeadline = Math.max(0, Math.round((projectedTime - deadline) / DAY));
  }

  const waitingForClient = milestones.some(step => step.status === "submitted");
  const waitingForFreelancer = milestones.some(step => step.status === "revision_requested");
  const nextAction = waitingForClient ? "Review submitted work to keep the plan moving."
    : waitingForFreelancer ? "Discuss the requested changes and agree on the next submission."
      : signals.some(signal => signal.startsWith("No recorded")) ? "Check in and record the next milestone update."
        : repeated.length ? "Review repeated feedback and agree on clear acceptance criteria."
        : daysBeyondDeadline > 0 ? "Revisit scope or the deadline with the freelancer."
          : "Keep milestone updates and approvals current.";

  if (Number.isFinite(deadline) && deadline < today) {
    return { ...base, status: "overdue", headline: "Deadline has passed", paceDays, projectedDate, daysBeyondDeadline, signals, nextAction };
  }
  if (daysBeyondDeadline > 0) {
    return { ...base, status: "forecast_late", headline: "Current pace points past the deadline", paceDays, projectedDate, daysBeyondDeadline, signals, nextAction };
  }
  if (signals.length) {
    return { ...base, status: "needs_review", headline: "A delivery signal needs review", paceDays, projectedDate, daysBeyondDeadline, signals, nextAction };
  }
  if (paceDays === null) {
    return { ...base, status: "insufficient_data", headline: "More approved milestones needed", signals, nextAction };
  }
  return { ...base, status: "on_pace", headline: "Current pace fits the deadline", paceDays, projectedDate, daysBeyondDeadline, signals, nextAction };
}

module.exports = { projectOutlook };
