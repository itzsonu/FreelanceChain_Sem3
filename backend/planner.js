function suggestMilestones({ title, description, requiredSkills, budget }) {
  const brief = typeof description === "string" ? description.trim() : "";
  const skills = Array.isArray(requiredSkills) ? requiredSkills.filter(skill => typeof skill === "string" && skill.trim()).map(skill => skill.trim()) : [];
  const amount = Number(budget);
  if (brief.length < 30 || brief.length > 3000) throw new Error("Add a project brief of 30–3000 characters first");
  if (!skills.length || skills.length > 10 || skills.some(skill => skill.length > 40)) throw new Error("Add between 1 and 10 required skills first");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Add a valid budget first");

  const projectName = typeof title === "string" && title.trim() ? title.trim().slice(0, 90) : "this project";
  const signals = `${skills.join(" ")} ${brief}`.toLowerCase();
  const frontend = /\b(react|vue|angular|frontend|front-end|ui|ux|figma|web design|responsive|css)\b/.test(signals);
  const backend = /\b(node|backend|back-end|api|database|mongodb|postgres|server|express)\b/.test(signals);
  const content = /\b(content|copywriting|article|blog|writing|editorial)\b/.test(signals);

  let kind;
  let steps;
  let shares;
  if (frontend && backend) {
    kind = "frontend and backend";
    shares = [15, 35, 35, 15];
    steps = [
      { title: "Scope and interfaces", description: `Confirm requirements, screen flows and acceptance criteria for ${projectName}.`, dependsOn: [] },
      { title: "Frontend experience", description: `Build the responsive interface for ${projectName} and share it for review.`, dependsOn: [0] },
      { title: "Backend and data", description: `Implement the API and data flow needed for ${projectName}.`, dependsOn: [0] },
      { title: "Integration and handoff", description: "Connect both parts, test the main user flows and hand over the final work.", dependsOn: [1, 2] },
    ];
  } else if (frontend) {
    kind = "interface or design";
    shares = [25, 50, 25];
    steps = [
      { title: "Research and wireframes", description: `Agree on the user flow and first visual direction for ${projectName}.`, dependsOn: [] },
      { title: "Design and build", description: `Deliver the main interface for ${projectName} and share it for review.`, dependsOn: [0] },
      { title: "Review and handoff", description: "Address agreed feedback, check responsive behavior and hand over final files.", dependsOn: [1] },
    ];
  } else if (backend) {
    kind = "backend or API";
    shares = [25, 50, 25];
    steps = [
      { title: "Requirements and API plan", description: `Define data, endpoints and acceptance criteria for ${projectName}.`, dependsOn: [] },
      { title: "Core implementation", description: `Build the server-side functionality for ${projectName}.`, dependsOn: [0] },
      { title: "Testing and handoff", description: "Test the key flows, resolve defects and hand over code and setup notes.", dependsOn: [1] },
    ];
  } else if (content) {
    kind = "content";
    shares = [25, 50, 25];
    steps = [
      { title: "Outline and research", description: `Confirm audience, outline and references for ${projectName}.`, dependsOn: [] },
      { title: "Draft deliverables", description: `Write the agreed content for ${projectName} and share a review draft.`, dependsOn: [0] },
      { title: "Edit and handoff", description: "Apply agreed edits, proofread and deliver final content files.", dependsOn: [1] },
    ];
  } else {
    kind = "general project";
    shares = [25, 50, 25];
    steps = [
      { title: "Scope and plan", description: `Agree on deliverables and acceptance criteria for ${projectName}.`, dependsOn: [] },
      { title: "Main deliverable", description: `Complete the main work for ${projectName} and share it for review.`, dependsOn: [0] },
      { title: "Review and handoff", description: "Address agreed feedback and hand over the final deliverables.", dependsOn: [1] },
    ];
  }

  const cents = Math.floor(amount * 100 + 1e-6);
  let allocated = 0;
  const suggestions = steps.map((step, index) => {
    const paymentCents = index === steps.length - 1 ? cents - allocated : Math.floor(cents * shares[index] / 100);
    allocated += paymentCents;
    return { ...step, payment: paymentCents / 100 };
  });

  return {
    method: "guided_template",
    explanation: `Template draft based on ${kind} signals in the brief and skills. Review every step, prerequisite and planned amount before publishing.`,
    suggestions,
  };
}

module.exports = { suggestMilestones };
