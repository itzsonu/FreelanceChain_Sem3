import React, { useEffect, useState } from "react";
import { api } from "../api";
import useLiveUpdates from "../useLiveUpdates";
import TrustEvidence from "./TrustEvidence";
import useDialogAccessibility from "../useDialogAccessibility";
import ConversationPanel from "./ConversationPanel";
import HiringOfferPanel from "./HiringOfferPanel";

export default function ApplicantsDialog({ project, onClose, onDecision }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [messageApplication, setMessageApplication] = useState(null);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);

  useEffect(() => {
    api(`/applications/project/${project._id}`).then(setApplications).catch(err => setError(err.message)).finally(() => setLoading(false));
    api("/applications/ai-status").then(setAiStatus).catch(() => setAiStatus({ available: false }));
  }, [project._id]);
  useLiveUpdates(event => {
    if (event.type !== "reconnected" && !(event.type === "applications" && event.projectId === project._id)) return;
    api(`/applications/project/${project._id}`).then(setApplications).then(() => setAiResult(null)).catch(err => setError(err.message));
  });

  async function compareWithAi() {
    setError(""); setAnalyzing(true); setAiResult(null);
    try {
      setAiResult(await api(`/applications/project/${project._id}/ai-rank`, { method: "POST" }));
    } catch (err) { setError(err.message); }
    finally { setAnalyzing(false); }
  }

  async function decide(applicationId, action) {
    setBusy(true); setError("");
    try {
      await api(`/applications/${applicationId}/${action}`, { method: "PATCH" });
      setApplications(await api(`/applications/project/${project._id}`));
      setAiResult(null);
      onDecision(action);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function toggleShortlist(application) {
    setBusy(true); setError("");
    try {
      const updated = await api(`/applications/${application._id}/shortlist`, { method: "PATCH", body: JSON.stringify({ shortlisted: !application.shortlisted }) });
      setApplications(current => current.map(item => item._id === updated._id ? { ...item, ...updated } : item));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const aiRanks = new Map((aiResult?.ranking || []).map(item => [item.applicationId, item]));
  const sorted = [...applications].sort((a, b) => {
    const statusOrder = (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1);
    return statusOrder || Number(Boolean(b.shortlisted)) - Number(Boolean(a.shortlisted)) || (aiRanks.get(a._id)?.rank ?? Infinity) - (aiRanks.get(b._id)?.rank ?? Infinity) || (b.match?.score ?? -1) - (a.match?.score ?? -1);
  });
  const visibleApplications = shortlistedOnly ? sorted.filter(application => application.shortlisted) : sorted;

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="applicants-title" ref={dialogRef} tabIndex={-1}>
      <div className="dialog-heading"><div><p className="eyebrow">APPLICATIONS</p><h2 id="applicants-title">{project.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? <p className="empty-state">Loading proposals…</p> : sorted.length === 0 ? <p className="empty-state">No applications yet. Your project is visible to freelancers.</p> : visibleApplications.length === 0 ? <div className="empty-state"><h3>No shortlisted applicants</h3><p>Shortlist a proposal to compare it here.</p><button className="button button-outline" onClick={() => setShortlistedOnly(false)}>Show all applicants</button></div> : <>
        <div className="shortlist-toolbar"><p className="shortlist-intro">Compare each proposal’s terms, skills and verified work. Match scores are decision aids, never hiring decisions.</p><button className={`button ${shortlistedOnly ? "button-dark" : "button-outline"}`} type="button" aria-pressed={shortlistedOnly} onClick={() => setShortlistedOnly(value => !value)}>★ {shortlistedOnly ? "Show all applicants" : `Shortlisted (${applications.filter(item => item.shortlisted).length})`}</button></div>
        {project.status === "Open" && sorted.some(item => item.status === "PENDING") && <section className="ai-comparison"><div><strong>Optional AI-assisted comparison</strong><p>When you choose Compare, the project brief and pending applicants’ profile and proposal text are sent to OpenAI for text similarity. That text may include personal details. Names and email addresses are not added separately. The result is a ranking aid, not a hiring decision.</p></div>{aiStatus?.available ? <button className="button button-outline" type="button" disabled={analyzing || busy || sorted.filter(item => item.status === "PENDING").length > aiStatus.maxCandidates} onClick={compareWithAi}>{analyzing ? "Comparing…" : "Compare with AI"}</button> : <small>AI comparison is not configured in this demo. The regular shortlist is available below.</small>}{aiResult && <p className="ai-explanation">{aiResult.explanation}</p>}</section>}
        <div className="application-list">{visibleApplications.map(application => {
          const freelancer = application.freelancer || {};
          const profile = freelancer.profile || {};
          const trust = application.trust;
          const match = application.match;
          const ai = aiRanks.get(application._id);
          return <article className="application-card" key={application._id}>
            <div className="application-top"><div className="avatar">{freelancer.name?.[0]?.toUpperCase() || "F"}</div><div><strong>{freelancer.name || "Freelancer"}</strong><small>{profile.headline || "Freelancer"} · Applied {new Date(application.createdAt).toLocaleDateString()}</small></div><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></div>
            {ai && <div className="ai-result"><strong>AI-assisted rank #{ai.rank} · {ai.score}/100</strong><span>Text similarity {ai.semanticScore}/100 · Regular fit {ai.ruleScore}/100</span><small>Listed skills: {ai.matchedSkills?.length ? ai.matchedSkills.join(", ") : "none matched"}. {ai.missingSkills?.length ? `Not listed: ${ai.missingSkills.join(", ")}.` : ""} Trust: {ai.evidence?.score == null ? "new account" : `${ai.evidence.scoredMilestones ?? ai.evidence.approvedMilestones} of ${ai.evidence.approvedMilestones} approvals counted`}.</small></div>}
            {match && <div className="match-summary"><div><strong>Fit estimate: {match.score}/100</strong><span>{match.matchedSkills?.length || 0} of {(match.matchedSkills?.length || 0) + (match.missingSkills?.length || 0)} listed skills</span></div><div className="match-track"><span style={{ width: `${match.score}%` }} /></div><p>{match.matchedSkills?.length ? `Matches: ${match.matchedSkills.join(", ")}.` : "No listed skills match yet."} {match.missingSkills?.length ? `Not listed: ${match.missingSkills.join(", ")}.` : ""}</p><small>{match.yearsExperience || 0} years self-reported experience · {match.trustIncluded ? "Verified work included" : "No work history penalty"}</small></div>}
            <div className="applicant-profile"><div><span>EXPERIENCE</span><strong>{profile.experienceYears || 0} years</strong></div><div><span>SKILLS</span><div className="skill-list">{profile.skills?.length ? profile.skills.map(skill => <span className="skill-chip" key={skill}>{skill}</span>) : <small>Not added yet</small>}</div></div>{profile.bio && <p>{profile.bio}</p>}{profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer">View portfolio ↗</a>}</div>
            {trust && <div className="trust-summary"><div><span>TRUST SCORE</span><strong>{trust.score === null ? trust.label : `${trust.score}/100`}</strong></div><p>{trust.approvedMilestones} approved milestones · {trust.completedProjects} completed projects · {trust.revisionRequests} revision requests</p><TrustEvidence trust={trust} /><small>{trust.score === null ? "No verified work yet; this does not lower the fit estimate." : `${trust.label}. Based only on approved milestones and revision history.`}</small></div>}
            <div className="proposal-box"><span>PROPOSAL{application.proposalRevision > 1 ? ` · REVISION ${application.proposalRevision}` : ""}</span><p>{application.proposal || "Legacy text-only proposal"}</p><div className="proposal-terms"><span>Proposed price <strong>{application.proposedPrice == null ? "Not provided" : `₹${Number(application.proposedPrice).toLocaleString("en-IN")}`}</strong></span><span>Delivery estimate <strong>{application.deliveryEstimateDays == null ? "Not provided" : `${application.deliveryEstimateDays} days`}</strong></span></div>{application.portfolioLinks?.map(link => <a key={link} href={link} target="_blank" rel="noreferrer">Relevant work ↗</a>)}{application.answers?.map((item, index) => <p className="proposal-answer" key={index}><strong>{item.question}</strong><br />{item.answer}</p>)}</div>
            <HiringOfferPanel application={application} project={project} role="client" onChange={updated => setApplications(current => current.map(item => item._id === updated._id ? { ...item, ...updated } : item))} onAssigned={() => { onDecision("agreed"); onClose(); }} />
            <button type="button" className="text-button conversation-toggle" onClick={() => setMessageApplication(current => current === application._id ? null : application._id)}>{messageApplication === application._id ? "Hide messages" : `Message ${freelancer.name || "freelancer"} →`}</button>
            {messageApplication === application._id && <ConversationPanel applicationId={application._id} projectId={project._id} otherLabel={freelancer.name || "Freelancer"} />}
            {application.status === "PENDING" && project.status === "Open" && <div className="application-actions"><button className="button button-outline" disabled={busy} onClick={() => toggleShortlist(application)}>{application.shortlisted ? "Remove from shortlist" : "★ Shortlist"}</button><button className="button button-outline" disabled={busy} onClick={() => decide(application._id, "reject")}>Decline proposal</button></div>}
          </article>;
        })}</div>
      </>}
    </div>
  </div>;
}
