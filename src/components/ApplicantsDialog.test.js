import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ApplicantsDialog from "./ApplicantsDialog";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), subscribeUpdates: jest.fn(() => () => {}) }));
beforeEach(() => api.mockReset());

test("client can compare, shortlist and start a structured offer for a pending applicant", async () => {
  api.mockImplementation((path, options) => {
    if (path === "/applications/project/project-1") return Promise.resolve([{ _id: "application-1", createdAt: "2026-09-27T00:00:00Z", proposal: "I will deliver the design in two stages.", proposedPrice: 8200, deliveryEstimateDays: 16, portfolioLinks: ["https://example.test/nina"], status: "PENDING", shortlisted: false, currentOfferState: "NONE", offers: [], freelancer: { name: "Nina", profile: { headline: "Brand designer", skills: ["Figma", "Branding"], experienceYears: 4, bio: "I design identity systems." } }, match: { score: 90, matchedSkills: ["Figma", "Branding"], missingSkills: [], yearsExperience: 4, trustIncluded: true }, trust: { score: 78, label: "Verified history", approvedMilestones: 4, completedProjects: 1, revisionRequests: 1, scoredMilestones: 3, clientCount: 1 } }]);
    if (path === "/applications/application-1/shortlist") return Promise.resolve({ _id: "application-1", shortlisted: JSON.parse(options.body).shortlisted });
    return Promise.reject(new Error("Unexpected request"));
  });
  const onClose = jest.fn();
  const onDecision = jest.fn();
  render(<ApplicantsDialog project={{ _id: "project-1", title: "Identity design", status: "Open" }} onClose={onClose} onDecision={onDecision} />);
  await screen.findByText("Nina");
  expect(screen.getByText(/Brand designer · Applied/)).toBeInTheDocument();
  expect(screen.getByText("Figma")).toBeInTheDocument();
  expect(screen.getByText("Fit estimate: 90/100")).toBeInTheDocument();
  expect(screen.getByText("78/100")).toBeInTheDocument();
  expect(screen.getByText(/1 client account approved work/)).toHaveTextContent("3 of 4 approved milestones count");
  expect(screen.getByText(/₹8,200/)).toBeInTheDocument();
  expect(screen.getByText(/16 days/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "★ Shortlist" }));
  await screen.findByRole("button", { name: /remove from shortlist/i });
  expect(api).toHaveBeenCalledWith("/applications/application-1/shortlist", { method: "PATCH", body: JSON.stringify({ shortlisted: true }) });
  expect(screen.getByRole("button", { name: "Propose terms" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /assign freelancer/i })).not.toBeInTheDocument();
  expect(onDecision).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

test("AI comparison is explicit and displays both ranking components", async () => {
  api.mockImplementation(path => {
    if (path === "/applications/ai-status") return Promise.resolve({ available: true, maxCandidates: 20 });
    if (path === "/applications/project/project-2") return Promise.resolve([{ _id: "a-2", createdAt: "2026-09-27T00:00:00Z", proposal: "Build the dashboard", status: "PENDING", freelancer: { name: "Mina", profile: { skills: ["React"], experienceYears: 2 } }, match: { score: 70, matchedSkills: ["React"], missingSkills: [], yearsExperience: 2, trustIncluded: false }, trust: { score: null, label: "New", approvedMilestones: 0, completedProjects: 0, revisionRequests: 0 } }]);
    if (path === "/applications/project/project-2/ai-rank") return Promise.resolve({ explanation: "Ranking aid, not hiring probabilities.", ranking: [{ applicationId: "a-2", rank: 1, score: 88, semanticScore: 100, ruleScore: 70, matchedSkills: ["React"], missingSkills: [], evidence: { score: null, approvedMilestones: 0 } }] });
    return Promise.reject(new Error("Unexpected request"));
  });
  render(<ApplicantsDialog project={{ _id: "project-2", title: "Dashboard", status: "Open" }} onClose={() => {}} onDecision={() => {}} />);
  await screen.findByText("Mina");
  expect(api).not.toHaveBeenCalledWith("/applications/project/project-2/ai-rank", expect.anything());
  fireEvent.click(await screen.findByRole("button", { name: /compare with AI/i }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/applications/project/project-2/ai-rank", { method: "POST" }));
  expect(await screen.findByText(/AI-assisted rank #1/)).toHaveTextContent("88/100");
  expect(screen.getByText(/Text similarity 100\/100/)).toBeInTheDocument();
});

test("client can create a structured offer without directly assigning the freelancer", async () => {
  const application = { _id: "application-3", createdAt: "2026-09-27T00:00:00Z", proposal: "I can deliver and review this dashboard.", proposedPrice: 9800, deliveryEstimateDays: 20, status: "PENDING", shortlisted: true, offers: [], currentOfferState: "NONE", freelancer: { name: "Ravi", profile: { skills: ["React"] } }, match: { score: 70, matchedSkills: ["React"], missingSkills: [], yearsExperience: 2, trustIncluded: false }, trust: { score: null, label: "New", approvedMilestones: 0, completedProjects: 0, revisionRequests: 0 } };
  api.mockImplementation((path, options) => {
    if (path === "/applications/project/project-3") return Promise.resolve([application]);
    if (path === "/applications/ai-status") return Promise.resolve({ available: false });
    if (path === "/applications/application-3/offer" && options?.method === "POST") return Promise.resolve({ message: "Offer version created", application: { ...application, currentOfferState: "OPEN", currentOfferId: "offer-1", offers: [{ _id: "offer-1", version: 1, status: "OPEN", createdBy: "client-1", createdAt: "2030-10-01T12:00:00.000Z", terms: { scope: "Build, test, and review the responsive dashboard work.", amount: 9800, deliveryDate: "2030-11-20", milestones: [{ title: "Delivery", description: "Complete and review the agreed deliverable.", payment: 9800, dueDate: "2030-11-20" }] }, acceptances: [{ actor: "client-1", acceptedAt: "2030-10-01T12:00:00.000Z" }] }] } });
    return Promise.reject(new Error(`Unexpected request ${path}`));
  });
  render(<ApplicantsDialog project={{ _id: "project-3", title: "Dashboard", description: "Build the requested dashboard and support responsive review.", budget: 12000, deadline: "2030-11-20", status: "Open" }} onClose={() => {}} onDecision={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "Propose terms" }));
  fireEvent.change(screen.getByLabelText("Final scope"), { target: { value: "Build, test, and review the responsive dashboard work." } });
  fireEvent.click(screen.getByRole("button", { name: "Send offer" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/applications/application-3/offer", {
    method: "POST",
    body: JSON.stringify({ terms: { scope: "Build, test, and review the responsive dashboard work.", amount: 9800, deliveryDate: "2030-11-20", milestones: [{ title: "Delivery", description: "Complete and review the agreed deliverable.", payment: 9800, dueDate: "2030-11-20" }] } }),
  }));
  expect(await screen.findByText("Offer version 1 sent.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /assign freelancer/i })).not.toBeInTheDocument();
});
