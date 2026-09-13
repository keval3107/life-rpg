import { ArrowRight, CheckCircle2, Gamepad2, LineChart, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="public-shell">
      <Navbar />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-badge"><span className="hero-badge-dot" />Personal productivity, reimagined</div>
            <h1>Make progress visible.<br /><span>Level up your life.</span></h1>
            <p>Turn meaningful goals into simple quests, build consistent habits, earn XP, and see your progress compound over time.</p>
            <div className="hero-actions"><Link to="/register" className="primary-button hero-primary">Start for free <ArrowRight size={17} /></Link><Link to="/login" className="secondary-button hero-secondary">Sign in</Link></div>
            <div className="hero-proof"><span><ShieldCheck size={16} /> Built for real-life goals</span><span><CheckCircle2 size={16} /> Simple & focused</span></div>
          </div>

          <div className="hero-product">
            <div className="product-window">
              <div className="window-top"><div className="window-dots"><i /><i /><i /></div><span>LifeRPG · Dashboard</span><span className="window-status">Live</span></div>
              <div className="product-body">
                <div className="product-greeting"><div><span className="section-label">OVERVIEW</span><h2>Good morning, Alex.</h2><p>Here is what is moving forward today.</p></div><div className="product-avatar">A</div></div>
                <div className="mini-metrics"><MiniMetric label="Level" value="12" note="+240 XP this week" /><MiniMetric label="Streak" value="18 days" note="Best: 21 days" /><MiniMetric label="Completed" value="84%" note="12 of 14 quests" /></div>
                <div className="product-quest"><div className="product-check"><CheckCircle2 size={18} /></div><div><strong>Finish Python project</strong><span>Today · Coding</span></div><b>+120 XP</b></div>
                <div className="product-progress"><div><span>Weekly progress</span><b>72%</b></div><div className="mini-track"><span /></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="section-intro"><span className="section-label">WHY LIFERPG</span><h2>A calmer way to make progress.</h2><p>Every part of the experience is designed to keep you focused on the next useful action.</p></div>
          <div className="feature-grid"><Feature icon={<Gamepad2 />} title="Quest-based focus" text="Turn goals into clear, achievable actions without unnecessary complexity." /><Feature icon={<LineChart />} title="Progress you can see" text="Track XP, streaks, attributes and completion at a glance." /><Feature icon={<Trophy />} title="Rewards that motivate" text="Use your earned Gold to create a reward system that works for you." /></div>
        </section>

        <section className="home-bottom"><div><span className="section-label">READY WHEN YOU ARE</span><h2>One small quest at a time.</h2><p>Build momentum without turning productivity into another source of pressure.</p></div><Link to="/register" className="primary-button">Create your account <ArrowRight size={17} /></Link></section>
      </main>
      <Footer />
    </div>
  );
}

function MiniMetric({ label, value, note }) { return <div className="mini-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Feature({ icon, title, text }) { return <article className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p><span className="feature-link">Learn more <ArrowRight size={14} /></span></article>; }
