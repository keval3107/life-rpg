import { ArchiveRestore, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../services/api";

export default function RecycleBin() {
  const [quests, setQuests] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() { try { setLoading(true); setError(""); setQuests((await api.getRecycleBin()).quests || []); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function restore(id) { try { await api.restoreQuest(id); await load(); } catch (e) { setError(e.message); } }
  async function destroy(id) { if (!window.confirm("Permanently delete this quest? This cannot be undone.")) return; try { await api.permanentlyDeleteQuest(id); await load(); } catch (e) { setError(e.message); } }
  return <div className="app-shell"><Navbar /><main className="page-container"><section className="page-header"><div><div className="eyebrow"><span className="eyebrow-dot" />RECYCLE BIN</div><h1>Recovered memories</h1><p>Deleted quests stay here until you restore them or permanently remove them.</p></div></section>
    {error && <div className="dashboard-message error-message">{error}</div>}
    {loading ? <div className="page-loading"><div className="loading-spinner" /><p>Loading Recycle Bin...</p></div> : quests.length ? <div className="recycle-grid">{quests.map(q => <article className="recycle-card" key={q.id}><div className="recycle-icon"><ArchiveRestore size={20} /></div><div className="recycle-copy"><div className="recycle-title-row"><h3>{q.title}</h3><span>{q.completed ? "Completed quest" : "Pending quest"}</span></div><p>{q.description || "No description."}</p><small>Deleted {q.deleted_at ? new Date(q.deleted_at).toLocaleString() : "recently"}</small></div><div className="recycle-actions"><button className="secondary-button" onClick={() => restore(q.id)}><RotateCcw size={15} /> Restore</button><button className="icon-button danger-outline" onClick={() => destroy(q.id)} title="Permanently delete" aria-label={`Permanently delete ${q.title}`}><Trash2 size={16} /></button></div></article>)}</div> : <div className="empty-state"><div className="empty-icon"><CheckCircle2 size={22} /></div><h3>Recycle Bin is empty</h3><p>Your deleted quests will appear here.</p></div>}
  </main><Footer /></div>;
}
