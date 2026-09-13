import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import Footer from "../components/Footer";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const data = isLogin ? await api.login({ email: form.email, password: form.password }) : await api.register(form);
      login(data.token, data.user);
      navigate(location.state?.from || "/dashboard");
    } catch (err) { setError(err.message || "Unable to continue."); } finally { setBusy(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-topbar"><Link className="brand" to="/"><span className="brand-mark">L</span><span className="brand-name">Life<span>RPG</span></span></Link><ThemeToggle /></div>
      <main className="auth-layout">
        <section className="auth-aside"><div className="auth-aside-badge"><Sparkles size={15} /> A better way to stay consistent</div><h1>{isLogin ? "Welcome back to your progress." : "Build a life you are proud of."}</h1><p>LifeRPG gives your goals a simple structure: choose a quest, focus with a timer, earn progress, repeat.</p><div className="auth-benefits"><span><Check size={15} /> Clear daily quests</span><span><Check size={15} /> Timer-based XP & Gold</span><span><Check size={15} /> Personal reward economy</span></div></section>
        <section className="auth-card-wrap"><form onSubmit={submit} className="auth-card">
          <div className="auth-card-header"><div className="auth-icon"><LockKeyhole size={19} /></div><div><span className="section-label">{isLogin ? "WELCOME BACK" : "GET STARTED"}</span><h2>{isLogin ? "Sign in" : "Create your account"}</h2></div></div>
          <p className="auth-subtitle">{isLogin ? "Continue where you left off." : "Start building momentum in a few seconds."}</p>
          <div className="auth-fields">
            {!isLogin && <Field label="Username"><input required minLength={3} maxLength={50} placeholder="Your username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></Field>}
            <Field label="Email"><input required type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Password"><div className="password-wrap"><input required minLength={6} type={showPassword ? "text" : "password"} placeholder="6+ characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></Field>
          </div>
          {isLogin && <div className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></div>}
          {error && <div className="form-error">{error}</div>}
          <button disabled={busy} className="auth-submit">{busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}<ArrowRight size={17} /></button>
          <p className="auth-switch">{isLogin ? "New to LifeRPG?" : "Already have an account?"} <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create one" : "Sign in"}</Link></p>
        </form></section>
      </main>
      <Footer />
    </div>
  );
}
function Field({ label, children }) { return <div className="auth-field"><label>{label}</label>{children}</div>; }
