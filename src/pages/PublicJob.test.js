import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicJob from "./PublicJob";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), currentUser: () => null }));

test("visitors can inspect the full project before signing in", async () => {
  api.mockResolvedValue({ id: "project-1", title: "Build a dashboard", category: "Web Development", description: "Create a responsive React dashboard.", requiredSkills: ["React"], budget: 12000, deadline: "2030-12-31", createdAt: "2026-09-29T10:00:00Z", company: { name: "Northstar Studio", overview: "A small product team." }, milestones: [{ id: "one", title: "Design", description: "Wireframes and design", payment: 4000 }] });
  render(<MemoryRouter initialEntries={["/jobs/project-1"]}><Routes><Route path="/jobs/:projectId" element={<PublicJob />} /></Routes></MemoryRouter>);
  await screen.findByRole("heading", { name: "Build a dashboard" });
  expect(screen.getByText("Wireframes and design")).toBeInTheDocument();
  expect(screen.getByText("Web Development · OPEN FOR PROPOSALS")).toBeInTheDocument();
  expect(screen.getByText("Northstar Studio")).toBeInTheDocument();
  expect(screen.getByText("A small product team.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in to apply →" })).toHaveAttribute("href", "/login?role=freelancer&project=project-1");
});
