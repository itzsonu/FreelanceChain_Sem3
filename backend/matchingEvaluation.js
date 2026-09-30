const { matchApplicant } = require("./scoring");
const { rankApplicants, aiMatchingAvailable } = require("./semanticMatching");

// Fictional examples check the evaluation pipeline. They are not real hiring labels.
const cases = [
  {
    name: "Dashboard framework wording", relevantId: "a",
    project: { title: "React dashboard", description: "Build an accessible React dashboard with charts and account views.", requiredSkills: ["React"] },
    candidates: [
      { id: "a", profile: { skills: ["ReactJS"], experienceYears: 3, bio: "Built accessible analytics dashboards." }, proposal: "I will build the dashboard and chart views." },
      { id: "b", profile: { skills: ["React"], experienceYears: 1, bio: "I make simple landing pages." }, proposal: "I can make a landing page." },
    ],
  },
  {
    name: "Mobile research context", relevantId: "a",
    project: { title: "Mobile UX study", description: "Research the mobile checkout journey and design testable Figma flows.", requiredSkills: ["Figma"] },
    candidates: [
      { id: "a", profile: { skills: ["Figma"], experienceYears: 2, bio: "Mobile usability studies and checkout prototypes." }, proposal: "I will test checkout flows with users." },
      { id: "b", profile: { skills: ["Figma"], experienceYears: 6, bio: "I create brand logos and social graphics." }, proposal: "I can design a new logo." },
    ],
  },
  {
    name: "Backend API fit", relevantId: "a",
    project: { title: "Node API", description: "Build a Node.js API for account records and secure data retrieval.", requiredSkills: ["Node.js"] },
    candidates: [
      { id: "a", profile: { skills: ["Node.js"], experienceYears: 3, bio: "Express APIs and MongoDB data models." }, proposal: "I will deliver tested endpoints." },
      { id: "b", profile: { skills: ["Copywriting"], experienceYears: 5, bio: "Editorial content for websites." }, proposal: "I can write documentation." },
    ],
  },
  {
    name: "Editorial writing fit", relevantId: "a",
    project: { title: "Research articles", description: "Write researched articles with an editorial review cycle.", requiredSkills: ["Copywriting"] },
    candidates: [
      { id: "a", profile: { skills: ["Copywriting"], experienceYears: 2, bio: "Long-form articles and editing." }, proposal: "I will deliver sourced drafts." },
      { id: "b", profile: { skills: ["React"], experienceYears: 5, bio: "Frontend development." }, proposal: "I can make a website." },
    ],
  },
  {
    name: "Database migration experience", relevantId: "b",
    project: { title: "Database migration", description: "Migrate production records into MongoDB with validation.", requiredSkills: ["MongoDB"] },
    candidates: [
      { id: "a", profile: { skills: ["MongoDB"], experienceYears: 1, bio: "Personal database projects." }, proposal: "I can try the migration." },
      { id: "b", profile: { skills: ["MongoDB"], experienceYears: 5, bio: "Production database migrations and validation." }, proposal: "I will test data integrity." },
    ],
  },
  {
    name: "Full stack coverage", relevantId: "a",
    project: { title: "Client portal", description: "Build a React portal and Node.js API for clients.", requiredSkills: ["React", "Node.js"] },
    candidates: [
      { id: "a", profile: { skills: ["React", "Node.js"], experienceYears: 2, bio: "Full stack client portals." }, proposal: "I will connect the UI and API." },
      { id: "b", profile: { skills: ["React"], experienceYears: 5, bio: "Static landing pages." }, proposal: "I can build the UI only." },
    ],
  },
];

function prepared(item) {
  return item.candidates.map(candidate => ({
    _id: candidate.id,
    freelancer: { profile: candidate.profile },
    proposal: candidate.proposal,
    trust: { score: null, approvedMilestones: 0, revisionRequests: 0 },
    match: matchApplicant(item.project.requiredSkills, candidate.profile, { score: null }),
  }));
}

function summarize(results) {
  return { correctTop1: results.filter(result => result.correct).length, total: results.length, cases: results };
}

async function evaluate(includeAi = false) {
  const baseline = summarize(cases.map(item => {
    const applications = prepared(item);
    const winner = [...applications].sort((a, b) => b.match.score - a.match.score || a._id.localeCompare(b._id))[0];
    return { name: item.name, correct: winner._id === item.relevantId };
  }));
  if (!includeAi) return { dataset: "six fictional diagnostic cases", baseline, ai: "not run" };
  if (!aiMatchingAvailable()) throw new Error("Set OPENAI_API_KEY to run AI evaluation on the fictional cases");
  const ai = summarize(await Promise.all(cases.map(async item => {
    const result = await rankApplicants(item.project, prepared(item));
    return { name: item.name, correct: result.ranking[0].applicationId === item.relevantId };
  })));
  return { dataset: "six fictional diagnostic cases", baseline, ai };
}

if (require.main === module) {
  evaluate(process.argv.includes("--ai")).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { cases, evaluate };
