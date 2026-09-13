import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../services/api";

export default function ResetPassword() {
  const location = useLocation(); const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setError(""); setMessage(""); if (!token) return setError("This reset link is missing its token."); if (password.length < 6) return setError("Use at least 6 characters."); if (password !== confirm) return setError("Passwords do not match."); setBusy(true); try { const r = await api.resetPassword(token, password); setMessage(r.message); setTimeout(() => navigate("/login"), 1400); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <div className="auth-shell"><div className="auth-topbar"><Link className="brand" to="/"><span className="brand-mark">L</span><span className="brand-name">Life<span>RPG</span></span></Link><ThemeToggle /></div>
    <main className="auth-center"><form className="auth-card narrow" onSubmit={submit}>
      <div className="auth-card-header"><div className="auth-icon"><KeyRound size={19} /></div><div><span className="section-label">SECURE RESET</span><h2>Create a new password</h2></div></div>
      <p className="auth-subtitle">Choose a new password for your LifeRPG account.</p>
      <div className="security-note"><ShieldCheck size={17} /><span>Your reset link is single-use and expires after 30 minutes.</span></div>
      <div className="auth-fields"><div className="auth-field"><label htmlFor="new-password">New password</label><div className="password-wrap"><input id="new-password" type={show ? "text" : "password"} minLength={6} required placeholder="6+ characters" value={password} onChange={e => setPassword(e.target.value)} autoFocus /><button type="button" className="password-toggle" onClick={() => setShow(v => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><div className="auth-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type={show ? "text" : "password"} minLength={6} required placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div></div>
      {error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
      <button disabled={busy} className="auth-submit">{busy ? "Saving..." : "Update password"}<ArrowRight size={17} /></button>
      <Link className="auth-back" to="/login">Back to sign in</Link>
    </form></main></div>;
}
