import React from "react";

export default function TrustEvidence({ trust }) {
  if (!trust || trust.score == null || trust.clientCount == null) return null;
  return <p className="trust-evidence">{trust.clientCount} client {trust.clientCount === 1 ? "account" : "accounts"} approved work. {trust.scoredMilestones} of {trust.approvedMilestones} approved milestones count toward the score (up to 3 per client account).</p>;
}
