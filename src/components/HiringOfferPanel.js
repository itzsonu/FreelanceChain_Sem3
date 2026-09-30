import React, { useEffect, useState } from "react";
import { api, currentUser } from "../api";

const today = () => new Date().toISOString().slice(0, 10);
const money = value => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function termsDraft(application, project) {
  const current = application.offers?.find(item => String(item._id) === String(application.currentOfferId));
  const terms = current?.terms;
  const amount = terms?.amount ?? application.proposedPrice ?? project.budget ?? 0;
  return {
    scope: terms?.scope || project.description || application.proposal || "",
    amount: String(amount),
    deliveryDate: terms?.deliveryDate || project.deadline || today(),
    milestones: terms?.milestones?.map(item => ({ title: item.title, description: item.description || "", payment: String(item.payment), dueDate: item.dueDate || "" })) || [{ title: "Delivery", description: "Complete and review the agreed deliverable.", payment: String(amount), dueDate: project.deadline || "" }],
  };
}

export default function HiringOfferPanel({ application: initialApplication, project, role, onChange, onAssigned }) {
  const [application, setApplication] = useState(initialApplication);
  const [draft, setDraft] = useState(() => termsDraft(initialApplication, project));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const userId = typeof currentUser === "function" ? currentUser()?.id : null;

  useEffect(() => {
    setApplication(initialApplication);
  }, [initialApplication]);

  const currentOffer = application.offers?.find(item => String(item._id) === String(application.currentOfferId));
  const openOffer = currentOffer?.status === "OPEN" && application.currentOfferState === "OPEN";
  const isRecipient = openOffer && String(currentOffer.createdBy) !== String(userId);
  const milestoneTotal = draft.milestones.reduce((sum, milestone) => sum + (Number(milestone.payment) || 0), 0);
  const matchesAmount = Math.abs(milestoneTotal - (Number(draft.amount) || 0)) < 0.009;

  function replaceApplication(updated) {
    setApplication(updated);
    onChange?.(updated);
  }

  async function sendOffer(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const terms = { ...draft, amount: Number(draft.amount), milestones: draft.milestones.map(item => ({ ...item, payment: Number(item.payment) })) };
    try {
      const result = await api(`/applications/${application._id}/offer`, { method: "POST", body: JSON.stringify({ ...(openOffer ? { replacesOfferId: currentOffer._id } : {}), terms }) });
      replaceApplication(result.application);
      setDraft(termsDraft(result.application, project));
      setEditing(false);
      setNotice(`Offer version ${result.application.offers.at(-1).version} sent.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function respond(action) {
    if (!currentOffer) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api(`/applications/${application._id}/offer/${currentOffer._id}/${action}`, { method: "POST", body: JSON.stringify({}) });
      if (result.application) replaceApplication(result.application);
      if (result.project) {
        setNotice("Both participants agreed to these terms. The freelancer is assigned.");
        onAssigned?.(result);
      } else setNotice(action === "decline" ? "Offer declined. This proposal is closed." : "Offer accepted and assigned.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function editTerms() {
    setDraft(termsDraft(application, project));
    setEditing(true);
    setError("");
  }

  return <section className="hiring-offer-panel" aria-label="Project offer and agreement">
    <div className="hiring-offer-heading"><div><strong>Terms and agreement</strong><small>Proposed amounts are not payments.</small></div>{application.status === "ACCEPTED" && <span className="status status-completed">Agreed</span>}</div>
    {application.offers?.length > 0 && <div className="offer-version-list"><h4>Offer history</h4>{[...application.offers].reverse().map(offer => <article className="offer-version" key={offer._id}><div><strong>Version {offer.version}</strong><span className={`offer-state ${offer.status.toLowerCase()}`}>{offer.status === "OPEN" ? "Awaiting response" : offer.status.toLowerCase()}</span></div><p>{String(offer.createdBy) === String(userId) ? "Proposed by you" : `Proposed by ${role === "client" ? "freelancer" : "client"}`} · {new Date(offer.createdAt).toLocaleString()} · {money(offer.terms.amount)} planned · due {offer.terms.deliveryDate}</p><p className="offer-scope">{offer.terms.scope}</p><ul>{offer.terms.milestones.map((milestone, index) => <li key={`${offer._id}-${index}`}>{milestone.title} · {money(milestone.payment)} planned{milestone.dueDate ? ` · ${milestone.dueDate}` : ""}</li>)}</ul><small>Agreed by {offer.acceptances.map(acceptance => String(acceptance.actor) === String(userId) ? "you" : role === "client" ? "freelancer" : "client").join(" and ")}</small></article>)}</div>}
    {application.status === "ACCEPTED" && application.offers?.length === 0 && <p className="form-help">Legacy accepted application. The original agreement terms were not recorded.</p>}
    {openOffer && isRecipient && <div className="offer-response-actions"><p>Review version {currentOffer.version}. Accepting assigns the freelancer and opens the shared workroom.</p><button className="button button-dark" disabled={busy} onClick={() => respond("accept")}>Accept version {currentOffer.version}</button><button className="button button-outline" disabled={busy} onClick={() => respond("decline")}>Decline offer</button><button className="text-button" disabled={busy} onClick={editTerms}>Counter with terms</button></div>}
    {openOffer && role === "freelancer" && !isRecipient && <p className="offer-waiting">Your version {currentOffer.version} is waiting for the client.</p>}
    {application.status === "PENDING" && role === "client" && !editing && <button className="button button-outline" type="button" onClick={editTerms}>{openOffer ? "Update or counter terms" : "Propose terms"}</button>}
    {application.status === "PENDING" && role === "freelancer" && !openOffer && !editing && <p className="offer-waiting">Waiting for the client to propose terms.</p>}
    {editing && <form className="offer-editor" onSubmit={sendOffer}>
      <label>Final scope<textarea required minLength="10" maxLength="5000" rows="4" value={draft.scope} onChange={event => setDraft(current => ({ ...current, scope: event.target.value }))} /></label>
      <div className="offer-editor-grid"><label>Proposed amount<input type="number" min="0.01" step="0.01" required value={draft.amount} onChange={event => setDraft(current => ({ ...current, amount: event.target.value }))} /></label><label>Delivery date<input type="date" required min={today()} value={draft.deliveryDate} onChange={event => setDraft(current => ({ ...current, deliveryDate: event.target.value }))} /></label></div>
      <div className="offer-milestone-editor"><div><strong>Milestones</strong><small>{matchesAmount ? "Planned amounts match the offer total." : `Planned amounts: ${money(milestoneTotal)} · offer total: ${money(draft.amount)}`}</small></div>{draft.milestones.map((milestone, index) => <fieldset key={index}><legend>Milestone {index + 1}</legend><label>Title<input required maxLength="120" value={milestone.title} onChange={event => setDraft(current => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} /></label><label>Details<input maxLength="1000" value={milestone.description} onChange={event => setDraft(current => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))} /></label><div className="offer-editor-grid"><label>Planned amount<input type="number" min="0" step="0.01" required value={milestone.payment} onChange={event => setDraft(current => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, payment: event.target.value } : item) }))} /></label><label>Target date<input type="date" max={draft.deliveryDate} value={milestone.dueDate} onChange={event => setDraft(current => ({ ...current, milestones: current.milestones.map((item, itemIndex) => itemIndex === index ? { ...item, dueDate: event.target.value } : item) }))} /></label></div>{draft.milestones.length > 1 && <button className="text-button" type="button" onClick={() => setDraft(current => ({ ...current, milestones: current.milestones.filter((_, itemIndex) => itemIndex !== index) }))}>Remove milestone</button>}</fieldset>)}{draft.milestones.length < 20 && <button className="button button-outline" type="button" onClick={() => setDraft(current => ({ ...current, milestones: [...current.milestones, { title: "", description: "", payment: "0", dueDate: "" }] }))}>Add milestone</button>}</div>
      {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
      <div className="dialog-actions"><button className="button button-outline" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button button-dark" disabled={busy || !matchesAmount || draft.milestones.length < 1}>{busy ? "Sending…" : openOffer ? "Send new version" : "Send offer"}</button></div>
    </form>}
    {error && !editing && <p className="message error" role="alert">{error}</p>}{notice && !editing && <p className="message success" role="status">{notice}</p>}
  </section>;
}