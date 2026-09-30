import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProjectForm from "./ProjectForm";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn() }));

test("project dialog keeps keyboard focus and returns it after closing", () => {
  api.mockResolvedValue({});
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const onClose = jest.fn();
  const { unmount } = render(<ProjectForm onClose={onClose} onCreated={() => {}} />);
  expect(screen.getByRole("dialog")).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
  unmount();
  expect(trigger).toHaveFocus();
  trigger.remove();
});

test("publishes the brief, required skills and milestone plan", async () => {
  api.mockResolvedValue({});
  const onCreated = jest.fn();
  render(<ProjectForm onClose={() => {}} onCreated={onCreated} />);
  fireEvent.change(screen.getByPlaceholderText(/brand identity refresh/i), { target: { value: "Brand identity refresh" } });
  fireEvent.change(screen.getByPlaceholderText(/goals, deliverables/i), { target: { value: "Create a complete visual identity and deliver editable design files." } });
  fireEvent.change(screen.getByPlaceholderText(/React, UI design/i), { target: { value: "Figma, Branding" } });
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Design & Creative" } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2026-12-01" } });
  fireEvent.change(screen.getByPlaceholderText(/initial concepts/i), { target: { value: "First concepts" } });
  fireEvent.click(screen.getByRole("button", { name: /publish project/i }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/projects/create", expect.objectContaining({ method: "POST" })));
  const body = JSON.parse(api.mock.calls.find(([path]) => path === "/projects/create")[1].body);
  expect(body.category).toBe("Design & Creative");
  expect(body.requiredSkills).toEqual(["Figma", "Branding"]);
  expect(body.description).toMatch(/complete visual identity/);
  expect(body.milestones[0].title).toBe("First concepts");
  expect(onCreated).toHaveBeenCalled();
});

test("sends selected prerequisite indexes for a later milestone", async () => {
  api.mockResolvedValue({});
  render(<ProjectForm onClose={() => {}} onCreated={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText(/brand identity refresh/i), { target: { value: "Brand identity refresh" } });
  fireEvent.change(screen.getByPlaceholderText(/goals, deliverables/i), { target: { value: "Create a complete visual identity and deliver editable design files." } });
  fireEvent.change(screen.getByPlaceholderText(/React, UI design/i), { target: { value: "Branding" } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2026-12-01" } });
  fireEvent.change(screen.getByPlaceholderText(/initial concepts/i), { target: { value: "Concepts" } });
  fireEvent.click(screen.getByRole("button", { name: /add step/i }));
  fireEvent.change(screen.getAllByPlaceholderText(/initial concepts/i)[1], { target: { value: "Delivery" } });
  fireEvent.click(screen.getByRole("button", { name: /publish project/i }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/projects/create", expect.objectContaining({ method: "POST" })));
  const body = JSON.parse(api.mock.calls[api.mock.calls.length - 1][1].body);
  expect(body.milestones[1].dependsOn).toEqual([0]);
});

test("previews a guided plan and applies it only after the client chooses it", async () => {
  const suggestions = [
    { title: "Scope", description: "Agree on requirements", payment: 2500, dependsOn: [] },
    { title: "Build", description: "Implement the work", payment: 5000, dependsOn: [0] },
    { title: "Handoff", description: "Deliver final files", payment: 2500, dependsOn: [1] },
  ];
  api.mockImplementation(path => Promise.resolve(path === "/projects/suggest-milestones" ? { method: "guided_template", explanation: "Review each step before publishing.", suggestions } : {}));
  render(<ProjectForm onClose={() => {}} onCreated={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText(/brand identity refresh/i), { target: { value: "Brand identity refresh" } });
  fireEvent.change(screen.getByPlaceholderText(/goals, deliverables/i), { target: { value: "Create a complete visual identity and deliver editable design files." } });
  fireEvent.change(screen.getByPlaceholderText(/React, UI design/i), { target: { value: "Figma, Branding" } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: "10000" } });
  fireEvent.click(screen.getByRole("button", { name: /suggest a plan/i }));
  await screen.findByRole("region", { name: /suggested milestone plan/i });
  expect(screen.getAllByPlaceholderText(/initial concepts/i)).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /use this draft/i }));
  expect(screen.getAllByPlaceholderText(/initial concepts/i)).toHaveLength(3);
  expect(screen.getByDisplayValue("Build")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2026-12-01" } });
  fireEvent.click(screen.getByRole("button", { name: /publish project/i }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/projects/create", expect.objectContaining({ method: "POST" })));
  const body = JSON.parse(api.mock.calls[api.mock.calls.length - 1][1].body);
  expect(body.milestones).toEqual(suggestions);
});

test("AI planning sends the brief only after an explicit click and leaves the result editable", async () => {
  api.mockReset();
  const suggestions = [
    { title: "Scope", description: "Agree on deliverables", payment: 3000, dependsOn: [] },
    { title: "Delivery", description: "Build and test", payment: 7000, dependsOn: [0] },
  ];
  api.mockImplementation(path => Promise.resolve(path === "/projects/ai-planning-status" ? { available: true } : path === "/projects/ai-suggest-milestones" ? { method: "ai_assisted", explanation: "Review all steps.", suggestions } : {}));
  render(<ProjectForm onClose={() => {}} onCreated={() => {}} />);
  await screen.findByText(/sends your project title/i);
  fireEvent.change(screen.getByPlaceholderText(/brand identity refresh/i), { target: { value: "Brand identity refresh" } });
  fireEvent.change(screen.getByPlaceholderText(/goals, deliverables/i), { target: { value: "Create a complete visual identity and deliver editable design files." } });
  fireEvent.change(screen.getByPlaceholderText(/React, UI design/i), { target: { value: "Figma, Branding" } });
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: "2030-12-01" } });
  expect(api.mock.calls.some(([path]) => path === "/projects/ai-suggest-milestones")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: /draft with ai/i }));
  await screen.findByText("AI-assisted draft");
  expect(screen.getAllByPlaceholderText(/initial concepts/i)).toHaveLength(1);
  expect(api).toHaveBeenCalledWith("/projects/ai-suggest-milestones", expect.objectContaining({ method: "POST" }));
  fireEvent.click(screen.getByRole("button", { name: /use this draft/i }));
  fireEvent.change(screen.getByDisplayValue("Delivery"), { target: { value: "Final delivery" } });
  fireEvent.click(screen.getByRole("button", { name: /publish project/i }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/projects/create", expect.objectContaining({ method: "POST" })));
  const body = JSON.parse(api.mock.calls.find(([path]) => path === "/projects/create")[1].body);
  expect(body.milestones[1].title).toBe("Final delivery");
});
