const skillAliases = new Map([
  ["reactjs", "react"], ["react.js", "react"], ["react js", "react"],
  ["node", "node.js"], ["nodejs", "node.js"], ["node js", "node.js"],
  ["vuejs", "vue"], ["vue.js", "vue"], ["vue js", "vue"],
]);
const normalizeSkill = value => {
  const skill = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return skillAliases.get(skill) || skill;
};

// Only platform-verified approvals and revision requests affect this score.
// No history is shown as unscored, and a small sample is pulled toward 60.
function trustFromProjects(projects = []) {
  let approvedMilestones = 0;
  let revisionRequests = 0;
  let completedProjects = 0;
  const evidenceByClient = new Map();
  const knownClients = new Set();

  for (const [index, project] of projects.entries()) {
    if (project.status === "Completed") completedProjects += 1;
    const clientId = project.client?.toString();
    const key = clientId || `unknown-project-${project._id || index}`;
    const evidence = evidenceByClient.get(key) || { approved: 0, revised: 0 };
    for (const milestone of project.milestones || []) {
      if (milestone.status !== "completed") continue;
      approvedMilestones += 1;
      evidence.approved += 1;
      const revisions = Math.max(0, Number(milestone.revisionCount) || 0);
      revisionRequests += revisions;
      if (revisions) evidence.revised += 1;
    }
    if (evidence.approved) {
      evidenceByClient.set(key, evidence);
      if (clientId) knownClients.add(clientId);
    }
  }

  if (!approvedMilestones) {
    return { score: null, label: "New on FreelanceChain", approvedMilestones: 0, completedProjects, revisionRequests: 0, scoredMilestones: 0, clientCount: 0 };
  }

  // Each client can contribute at most three approval-equivalents, even across
  // projects. Revised approvals fill those slots first, so extra clean steps
  // cannot dilute an existing revision within the same client account.
  let scoredMilestones = 0;
  let scoredRevisions = 0;
  for (const evidence of evidenceByClient.values()) {
    const weight = Math.min(3, evidence.approved);
    scoredMilestones += weight;
    scoredRevisions += Math.min(weight, evidence.revised);
  }
  const revisionRate = scoredRevisions / scoredMilestones;
  const observedScore = 100 - 60 * revisionRate;
  const evidenceWeight = scoredMilestones / (scoredMilestones + 4);
  const score = Math.round(60 + evidenceWeight * (observedScore - 60));
  return {
    score,
    label: knownClients.size < 2 ? "Limited client history" : "Multiple client accounts",
    approvedMilestones,
    completedProjects,
    revisionRequests,
    scoredMilestones,
    clientCount: knownClients.size,
  };
}

function matchApplicant(requiredSkills = [], profile = {}, trust = { score: null }) {
  const required = [...new Map(requiredSkills.map(skill => [normalizeSkill(skill), String(skill).trim()]).filter(([key]) => key)).values()];
  const freelancerSkills = new Set((profile.skills || []).map(normalizeSkill));
  const matchedSkills = required.filter(skill => freelancerSkills.has(normalizeSkill(skill)));
  const missingSkills = required.filter(skill => !freelancerSkills.has(normalizeSkill(skill)));
  const years = Math.max(0, Number(profile.experienceYears) || 0);

  const factors = [];
  if (required.length) factors.push({ weight: 70, value: matchedSkills.length / required.length });
  factors.push({ weight: 15, value: Math.min(1, years / 5) });
  if (trust.score !== null && Number.isFinite(trust.score)) factors.push({ weight: 15, value: trust.score / 100 });
  const weighted = factors.reduce((sum, factor) => sum + factor.weight * factor.value, 0);
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);

  return {
    score: Math.round((weighted / totalWeight) * 100 / 5) * 5,
    matchedSkills,
    missingSkills,
    yearsExperience: years,
    trustIncluded: trust.score !== null,
    method: "Rule-based fit estimate; listed skills include common spelling variants, experience is self-reported, and trust comes from approved work with a per-client evidence cap.",
  };
}

module.exports = { trustFromProjects, matchApplicant };
