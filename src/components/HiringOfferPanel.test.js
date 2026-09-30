import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HiringOfferPanel from "./HiringOfferPanel";
import { api } from "../api";

jest.mock("../api", () => ({ api: jest.fn(), currentUser: () => ({ id: "freelancer-1" }) }));

const project = { _id: "project-1", title: "Dashboard", budget: 12000, deadline: "2030-11-20" };
const offer = { _id: "offer-1", version: 1, createdBy: "client-1", createdAt: "2030-10-01T12:00:00.000Z", status: "OPEN", terms: { scope: "Build and review the agreed responsive dashboard.", amount: 12000, deliveryDate: "2030-11-20", milestones: [{ title: "Delivery", description: "Implement dashboard.", payment: 12000, dueDate: "2030-11-20" }] }, acceptances: [{ actor: "client-1", acceptedAt: "2030-10-01T12:00:00.000Z" }] };
const application = { _id: "application-1", status: "PENDING", currentOfferId: "offer-1", currentOfferState: "OPEN", offers: [offer] };

beforeEach(() => api.mockReset());

test("freelancer can accept the exact current offer and assignment callback runs", async () => {
  api.mockResolvedValue({ application: { ...application, status: "ACCEPTED" }, project: { _id: "project-1", status: "In Progress" } });
  const onAssigned = jest.fn();
  render(<HiringOfferPanel application={application} project={project} role="freelancer" onAssigned={onAssigned} />);
  fireEvent.click(screen.getByRole("button", { name: "Accept version 1" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/applications/application-1/offer/offer-1/accept", { method: "POST", body: "{}" }));
  expect(await screen.findByText("Both participants agreed to these terms. The freelancer is assigned.")).toBeInTheDocument();
  expect(onAssigned).toHaveBeenCalledTimes(1);
});

test("freelancer can counter by creating a new version that replaces the current offer", async () => {
  const countered = { ...application, currentOfferId: "offer-2", offers: [offer, { ...offer, _id: "offer-2", version: 2, createdBy: "freelancer-1", status: "OPEN", terms: { ...offer.terms, amount: 11000, milestones: [{ ...offer.terms.milestones[0], payment: 11000 }] }, acceptances: [{ actor: "freelancer-1", acceptedAt: "2030-10-02T12:00:00.000Z" }] }] };
  api.mockResolvedValue({ application: countered });
  render(<HiringOfferPanel application={application} project={project} role="freelancer" />);
  fireEvent.click(screen.getByRole("button", { name: "Counter with terms" }));
  fireEvent.change(screen.getByLabelText("Final scope"), { target: { value: "Build, test, and review the responsive dashboard delivery." } });
  fireEvent.change(screen.getByLabelText("Proposed amount"), { target: { value: "11000" } });
  fireEvent.change(screen.getByLabelText("Delivery date"), { target: { value: "2030-11-21" } });
  fireEvent.change(screen.getByLabelText("Planned amount"), { target: { value: "11000" } });
  fireEvent.click(screen.getByRole("button", { name: "Send new version" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/applications/application-1/offer", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ replacesOfferId: "offer-1", terms: { scope: "Build, test, and review the responsive dashboard delivery.", amount: 11000, deliveryDate: "2030-11-21", milestones: [{ title: "Delivery", description: "Implement dashboard.", payment: 11000, dueDate: "2030-11-20" }] } }),
  })));
  expect(await screen.findByText("Offer version 2 sent.")).toBeInTheDocument();
});
