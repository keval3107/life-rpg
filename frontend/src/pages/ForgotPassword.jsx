import { ArrowLeft, ArrowRight, KeyRound, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage(""); setResetUrl("");
    try { const r = await api.forgotPassword(email); setMessage(r.message); if (r.reset_url) setResetUrl(r.reset_url); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="auth-shell"><div className="auth-topbar"><Link className="brand" to="/"><span className="brand-mark">L</span><span className="brand-name">Life<span>RPG</span></span></Link><ThemeToggle /></div>
    <main className="auth-center"><form className="auth-card narrow" onSubmit={submit}>
      <div className="auth-card-header"><div className="auth-icon"><KeyRound size={19} /></div><div><span className="section-label">ACCOUNT RECOVERY</span><h2>Forgot password?</h2></div></div>
      <p className="auth-subtitle">Enter your account email and we’ll create a secure, time-limited reset link.</p>
      <div className="auth-fields"><div className="auth-field"><label htmlFor="forgot-email">Email</label><input id="forgot-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus /></div></div>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success"><MailCheck size={16} />{message}</div>}
      {resetUrl && <div className="dev-reset-box"><span>Local development reset link</span><a href={resetUrl}>{resetUrl}</a><small>This link is shown locally when email delivery is not configured.</small></div>}
      <button disabled={busy} className="auth-submit">{busy ? "Creating link..." : "Send reset link"}<ArrowRight size={17} /></button>
      <Link className="auth-back" to="/login"><ArrowLeft size={15} /> Back to sign in</Link>
    </form></main></div>;
}
