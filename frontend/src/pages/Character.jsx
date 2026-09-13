import { useEffect, useState } from "react";
import { Flame, Shield, Sparkles, Trophy } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import XPBar from "../components/XPBar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Character() {
  const { user } = useAuth();
  const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => { api.getDashboard().then(setData).catch(e => setError(e.message)); }, []);
  if (error) return <div className="page-loading"><p>{error}</p></div>;
  if (!data) return <div className="page-loading"><div className="loading-spinner" /><p>Loading character...</p></div>;
  const c = data.character;
  const stats = [["🧠", "Intellect", c.intellect, "Study & coding"], ["💪", "Strength", c.strength, "Fitness"], ["🎯", "Focus", c.focus, "Deep work"], ["📚", "Wisdom", c.wisdom, "Reading"]];
  return <div className="app-shell"><Navbar /><main className="page-container character-page">
    <section className="page-header"><div><div className="eyebrow"><span className="eyebrow-dot" />CHARACTER PROFILE</div><h1>Your character</h1><p>Your real-life progress, represented as useful signals you can improve.</p></div></section>
    <div className="character-layout">
      <section className="character-card"><div className="character-hero"><div className="character-avatar">L</div><div><span className="section-label">CURRENT HERO</span><h2>{user?.username || "Your Hero"}</h2><p>Level {c.level} adventurer</p></div></div><div className="character-xp"><XPBar level={c.level} xp={c.xp} /></div><div className="character-highlights"><div><Trophy size={17} /><span>Level</span><b>{c.level}</b></div><div><Flame size={17} /><span>Streak</span><b>{c.streak} days</b></div><div><Sparkles size={17} /><span>XP</span><b>{c.xp}</b></div><div><Shield size={17} /><span>Gold</span><b>{c.gold}</b></div></div></section>
      <section><div className="section-header"><div><span className="section-label">ATTRIBUTES</span><h2>Personal growth</h2><p>Keep improving the areas that matter to you.</p></div></div><div className="stats-grid">{stats.map(([icon, name, value, hint]) => <div className="character-stat" key={name}><div className="character-stat-icon">{icon}</div><div><span>{name}</span><strong>{value}</strong><small>{hint}</small></div><div className="character-stat-line"><i style={{ width: `${Math.min(100, value)}%` }} /></div></div>)}</div></section>
    </div>
  </main><Footer /></div>;
}
