import { Plus, RefreshCw, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuestCard from "../components/QuestCard";
import QuestModal from "../components/QuestModal";
import LevelUpModal from "../components/LevelUpModal";
import QuestCompletePopup from "../components/QuestCompletePopup";
import { api } from "../services/api";

export default function Quests() {
  const [quests, setQuests] = useState([]); const [levelUp, setLevelUp] = useState(null); const [completionPopup, setCompletionPopup] = useState(null); const [modal, setModal] = useState({ open: false, quest: null }); const [filter, setFilter] = useState("All"); const [search, setSearch] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const categories = ["All", "Study", "Coding", "Fitness", "Reading", "Focus", "Other"];

  async function load() { try { setLoading(true); setError(""); setQuests((await api.getQuests()).quests || []); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function save(form) { try { if (modal.quest) await api.updateQuest(modal.quest.id, form); else await api.createQuest(form); setModal({ open: false, quest: null }); await load(); } catch (e) { setError(e.message); } }
  async function complete(id) { try { const result = await api.completeQuest(id); const completedQuest = quests.find((q) => q.id === id); setCompletionPopup({ result, questTitle: completedQuest?.title }); if (result.level_up) setLevelUp(result.level); await load(); window.setTimeout(() => setCompletionPopup(null), 4500); } catch (e) { setError(e.message); } }
  async function remove(id) { if (!window.confirm("Delete this quest?")) return; try { await api.deleteQuest(id); await load(); } catch (e) { setError(e.message); } }

  const shown = useMemo(() => quests.filter(q => (filter === "All" || q.category === filter) && (`${q.title} ${q.description || ""}`.toLowerCase().includes(search.toLowerCase()))), [quests, filter, search]);
  const completed = quests.filter(q => q.completed).length;

  return <div className="app-shell"><Navbar /><main className="page-container">
    <section className="page-header"><div><div className="eyebrow"><span className="eyebrow-dot" />MISSION CONTROL</div><h1>Your quests</h1><p>Turn today's priorities into clear actions and keep your momentum moving.</p></div><div className="page-header-actions"><button className="icon-button" onClick={load} title="Refresh"><RefreshCw size={17} /></button><button className="primary-button" onClick={() => setModal({ open: true, quest: null })}><Plus size={17} /> New quest</button></div></section>
    <section className="quest-overview"><div className="quest-overview-main"><div className="overview-icon"><Target size={19} /></div><div><span className="section-label">QUEST OVERVIEW</span><strong>{quests.length - completed} active quests</strong><p>{completed} completed · {quests.length ? Math.round(completed / quests.length * 100) : 0}% completion rate</p></div></div><div className="quest-search"><Search size={17} /><input placeholder="Search quests..." value={search} onChange={e => setSearch(e.target.value)} /></div></section>
    {error && <div className="dashboard-message error-message">{error}</div>}
    <div className="filter-row">{categories.map(c => <button key={c} className={`filter-button ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}</div>
    {loading ? <div className="page-loading"><div className="loading-spinner" /><p>Loading quests...</p></div> : shown.length ? <div className="quest-grid">{shown.map(q => <QuestCard key={q.id} quest={q} onComplete={complete} onEdit={q => setModal({ open: true, quest: q })} onDelete={remove} />)}</div> : <div className="empty-state"><div className="empty-icon"><Target size={22} /></div><h3>No quests found</h3><p>Create a quest or change your filters.</p><button className="primary-button" onClick={() => setModal({ open: true, quest: null })}><Plus size={17} /> Create quest</button></div>}
  </main><Footer /><LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} /><QuestCompletePopup result={completionPopup?.result} questTitle={completionPopup?.questTitle} onClose={() => setCompletionPopup(null)} /><QuestModal open={modal.open} quest={modal.quest} onClose={() => setModal({ open: false, quest: null })} onSave={save} /></div>;
}
