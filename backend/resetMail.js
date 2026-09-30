const RESET_MESSAGE = "If an account exists for that email, a reset link will arrive shortly.";
const LOCAL_RESET_MESSAGE = "If an account exists for that email, its reset link was printed in the local backend terminal. No email was sent.";
const gmailUser = () => (process.env.GMAIL_USER || "").trim();
const gmailAppPassword = () => (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

function resetOrigin() {
  try {
    const origin = new URL(process.env.APP_ORIGIN);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (origin.protocol !== "https:" && !(local && origin.protocol === "http:")) return null;
    if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) return null;
    return { origin: origin.origin, local };
  } catch { return null; }
}

function resetDeliveryMode() {
  const target = resetOrigin();
  if (!target) return "unavailable";
  if (process.env.RESET_DELIVERY === "console") return target.local ? "local-console" : "unavailable";
  if (process.env.RESET_DELIVERY === "gmail") {
    return /^\S+@\S+\.\S+$/.test(gmailUser()) && /^[A-Za-z0-9]{16}$/.test(gmailAppPassword()) ? "email" : "unavailable";
  }
  if (process.env.RESET_DELIVERY) return "unavailable";
  return process.env.RESEND_API_KEY && process.env.RESET_FROM_EMAIL ? "email" : "unavailable";
}

const resetDeliveryReady = () => resetDeliveryMode() !== "unavailable";

async function sendResetEmail(email, token, { createTransport } = {}) {
  const target = resetOrigin();
  if (!target || !resetDeliveryReady()) throw new Error("Password reset email is not configured");
  const link = new URL("/reset-password", target.origin);
  link.searchParams.set("token", token);

  if (process.env.RESET_DELIVERY === "console") {
    console.log(`Local password reset link for ${email}: ${link}`);
    return;
  }

  if (process.env.RESET_DELIVERY === "gmail") {
    const transport = (createTransport || require("nodemailer").createTransport)({
      service: "gmail",
      auth: { user: gmailUser(), pass: gmailAppPassword() },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    try {
      await transport.sendMail({
        from: `FreelanceChain <${gmailUser()}>`,
        to: email,
        subject: "Reset your FreelanceChain password",
        text: `Use this link to reset your password within 15 minutes:\n${link}\n\nIf you did not request this, ignore this email.`,
      });
    } finally {
      transport.close?.();
    }
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESET_FROM_EMAIL,
      to: [email],
      subject: "Reset your FreelanceChain password",
      text: `Use this link to reset your password within 15 minutes:\n${link}\n\nIf you did not request this, ignore this email.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Password reset email failed with status ${response.status}`);
}

module.exports = { RESET_MESSAGE, LOCAL_RESET_MESSAGE, resetDeliveryMode, resetDeliveryReady, sendResetEmail };
