import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import useDialogAccessibility from "../useDialogAccessibility";

const freshStep = index => ({ title: "", description: "", payment: "", dependsOn: index ? [index - 1] : [] });
const initial = () => ({ title: "", description: "", category: "Other", requiredSkills: "", budget: "", deadline: "", milestones: [freshStep(0)] });
const parseSkills = value => [...new Set(value.split(",").map(skill => skill.trim()).filter(Boolean))];
const planSignature = form => JSON.stringify([form.title.trim(), form.description.trim(), parseSkills(form.requiredSkills), Number(form.budget), form.deadline]);

export default function ProjectForm({ onClose, onCreated }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    api("/projects/ai-planning-status").then(result => { if (active) setAiAvailable(Boolean(result.available)); }).catch(() => {});
    return () => { active = false; requestVersion.current += 1; };
  }, []);

  function updateProject(key, value) {
    requestVersion.current += 1;
    setForm(current => ({ ...current, [key]: value }));
    setPreview(null);
    setSuggesting(false);
  }

  async function suggestPlan(method = "guided") {
    setError("");
    setSuggesting(true);
    const signature = planSignature(form);
    const version = ++requestVersion.current;
    try {
      const result = await api(method === "ai" ? "/projects/ai-suggest-milestones" : "/projects/suggest-milestones", { method: "POST", body: JSON.stringify({
        title: form.title.trim(), description: form.description.trim(), requiredSkills: parseSkills(form.requiredSkills), budget: Number(form.budget), deadline: form.deadline,
      }) });
      if (requestVersion.current === version) setPreview({ ...result, signature });
    } catch (err) { if (requestVersion.current === version) setError(err.message); }
    finally { if (requestVersion.current === version) setSuggesting(false); }
  }

  function useSuggestedPlan() {
    if (!preview || preview.signature !== planSignature(form)) return;
    setForm(current => ({ ...current, milestones: preview.suggestions.map(step => ({
      title: step.title, description: step.description, payment: String(step.payment), dependsOn: step.dependsOn,
    })) }));
    setPreview(null);
  }

  function updateStep(index, changes) {
    setForm(current => ({ ...current, milestones: current.milestones.map((step, i) => i === index ? { ...step, ...changes } : step) }));
  }

  function removeStep(index) {
    setForm(current => ({ ...current, milestones: current.milestones.filter((_, i) => i !== index).map(step => ({
      ...step,
      dependsOn: step.dependsOn.filter(value => value !== index).map(value => value > index ? value - 1 : value),
    })) }));
  }

  function toggleDependency(index, priorIndex) {
    const selected = form.milestones[index].dependsOn;
    updateStep(index, { dependsOn: selected.includes(priorIndex) ? selected.filter(value => value !== priorIndex) : [...selected, priorIndex].sort((a, b) => a - b) });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const skills = parseSkills(form.requiredSkills);
    if (skills.length < 1 || skills.length > 10) { setError("Add between 1 and 10 required skills, separated by commas."); return; }
    const budget = Number(form.budget);
    const milestones = form.milestones.map(step => ({ title: step.title.trim(), description: step.description.trim(), payment: Number(step.payment || 0), dependsOn: step.dependsOn }));
    if (milestones.reduce((sum, step) => sum + step.payment, 0) > budget) { setError("Milestone amounts exceed the project budget."); return; }
    setBusy(true);
    try {
      await api("/projects/create", { method: "POST", body: JSON.stringify({ title: form.title.trim(), description: form.description.trim(), category: form.category, requiredSkills: skills, budget, deadline: form.deadline, milestones }) });
      onCreated();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-project-title" ref={dialogRef} tabIndex={-1}>
      <div className="dialog-heading"><div><p className="eyebrow">NEW PROJECT</p><h2 id="create-project-title">Start with a clear brief</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button></div>
      {error && <p className="message error" role="alert">{error}</p>}
      <form className="stack-form" onSubmit={submit}>
        <label>Project title<input required maxLength="120" value={form.title} onChange={event => updateProject("title", event.target.value)} placeholder="e.g. Brand identity refresh" /></label>
        <label>Category<select value={form.category} onChange={event => updateProject("category", event.target.value)}><option>Web Development</option><option>Design &amp; Creative</option><option>Writing &amp; Translation</option><option>Marketing</option><option>Data &amp; Analytics</option><option>Video &amp; Animation</option><option>Admin &amp; Support</option><option>Other</option></select></label>
        <label>Project brief <small>What needs to be done and what will a successful result look like?</small><textarea required minLength="30" maxLength="3000" rows="5" value={form.description} onChange={event => updateProject("description", event.target.value)} placeholder="Describe the goals, deliverables and any important context…" /></label>
        <label>Required skills <small>Separate each skill with a comma</small><input required value={form.requiredSkills} onChange={event => updateProject("requiredSkills", event.target.value)} placeholder="React, UI design, Node.js" /></label>
        <div className="form-row"><label>Budget (₹)<input required type="number" min="1" value={form.budget} onChange={event => updateProject("budget", event.target.value)} /></label><label>Deadline<input required type="date" value={form.deadline} onChange={event => updateProject("deadline", event.target.value)} /></label></div>
        <div className="milestone-form-header"><div><strong>Milestones</strong><small>Choose which earlier steps must be approved before a step unlocks.</small></div><div className="plan-actions"><button className="text-button" type="button" disabled={suggesting || form.description.trim().length < 30 || !parseSkills(form.requiredSkills).length || Number(form.budget) <= 0} onClick={() => suggestPlan("guided")}>{suggesting ? "Planning…" : "Suggest a plan"}</button><button className="text-button" type="button" disabled={suggesting || !aiAvailable || !form.title.trim() || form.description.trim().length < 30 || !parseSkills(form.requiredSkills).length || Number(form.budget) < 1} onClick={() => suggestPlan("ai")}>Draft with AI</button><button className="text-button" type="button" disabled={form.milestones.length >= 20} onClick={() => setForm(current => ({ ...current, milestones: [...current.milestones, freshStep(current.milestones.length)] }))}>+ Add step</button></div></div>
        <p className="ai-plan-note">{aiAvailable ? "Optional: Draft with AI sends your project title, brief, skills, budget and deadline to OpenAI only when you click. Remove personal information first. Review the draft before using it." : "AI draft is unavailable in this demo. The guided draft works without an AI key."}</p>
        {preview && preview.signature === planSignature(form) && <div className="plan-preview" role="region" aria-label="Suggested milestone plan"><div><strong>{preview.method === "ai_assisted" ? "AI-assisted draft" : "Guided draft"}</strong><p>{preview.explanation}</p></div><ol>{preview.suggestions.map((step, index) => <li key={index}><strong>{step.title}</strong><span>₹{Number(step.payment).toLocaleString("en-IN")} planned</span><small>{step.description}</small><small>{step.dependsOn.length ? `After step${step.dependsOn.length > 1 ? "s" : ""} ${step.dependsOn.map(number => number + 1).join(" and ")}` : "Available from the start"}</small></li>)}</ol><button className="button button-outline" type="button" onClick={useSuggestedPlan}>Use this draft for milestones</button><p>This replaces the current milestone plan. You can edit every step before publishing.</p></div>}
        {form.milestones.map((step, index) => <div className="milestone-input" key={index}>
          <div className="milestone-input-head"><strong>Step {index + 1}</strong>{form.milestones.length > 1 && <button className="text-button danger" type="button" onClick={() => removeStep(index)}>Remove</button>}</div>
          <label>Title<input required value={step.title} onChange={event => updateStep(index, { title: event.target.value })} placeholder="e.g. Initial concepts" /></label>
          <div className="form-row"><label>Description<input value={step.description} onChange={event => updateStep(index, { description: event.target.value })} placeholder="What should be delivered?" /></label><label>Planned amount (₹)<input type="number" min="0" value={step.payment} onChange={event => updateStep(index, { payment: event.target.value })} /></label></div>
          {index > 0 && <fieldset className="dependency-picker"><legend>Unlock after</legend><div>{form.milestones.slice(0, index).map((prior, priorIndex) => <label key={priorIndex}><input type="checkbox" checked={step.dependsOn.includes(priorIndex)} onChange={() => toggleDependency(index, priorIndex)} />Step {priorIndex + 1}{prior.title ? ` · ${prior.title}` : ""}</label>)}</div><small>Leave all unchecked to make this step available from the start.</small></fieldset>}
        </div>)}
        <p className="form-help">Amounts are for planning only. Payments are not processed by this app.</p>
        <div className="dialog-actions"><button className="button button-outline" type="button" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy}>{busy ? "Creating…" : "Publish project ↗"}</button></div>
      </form>
    </div>
  </div>;
}
