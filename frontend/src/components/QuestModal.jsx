import { Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";

const empty = { title: "", description: "", category: "Other", difficulty: "Easy" };
const categoryReward = { Study: "Intellect", Coding: "Intellect", Fitness: "Strength", Reading: "Wisdom", Focus: "Focus", Other: "Focus" };

export default function QuestModal({ open, quest, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(quest ? { title: quest.title, description: quest.description || "", category: quest.category || "Other", difficulty: quest.difficulty || "Easy" } : empty), [quest, open]);
  if (!open) return null;
  function change(e) { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })); }
  function submit(e) { e.preventDefault(); if (form.title.trim()) onSave(form); }
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="quest-modal" role="dialog" aria-modal="true" aria-labelledby="quest-modal-title">
        <div className="modal-header">
          <div><span className="modal-eyebrow">{quest ? "UPDATE QUEST" : "NEW QUEST"}</span><h2 id="quest-modal-title">{quest ? "Edit quest" : "Create a quest"}</h2></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="form-group"><label htmlFor="quest-title">Quest title</label><input id="quest-title" name="title" value={form.title} onChange={change} required maxLength={150} placeholder="e.g. Finish Python project" autoFocus /></div>
        <div className="form-group"><label htmlFor="quest-description">Description</label><textarea id="quest-description" name="description" value={form.description} onChange={change} maxLength={1000} placeholder="What needs to be completed?" rows="4" /></div>
        <div className="form-grid"><div className="form-group"><label htmlFor="quest-category">Category</label><select id="quest-category" name="category" value={form.category} onChange={change}><option>Other</option><option>Study</option><option>Coding</option><option>Fitness</option><option>Reading</option><option>Focus</option></select></div><div className="form-group"><label htmlFor="quest-difficulty">Difficulty</label><select id="quest-difficulty" name="difficulty" value={form.difficulty} onChange={change}><option>Easy</option><option>Medium</option><option>Hard</option><option>Epic</option></select></div></div>
        <div className="timer-info-card"><Clock3 size={18} /><div><strong>Rewards come from focus time</strong><span>{categoryReward[form.category]} improves as you complete the quest. No manual XP or Gold entry needed.</span></div></div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">{quest ? "Save changes" : "Create quest"}</button></div>
      </form>
    </div>
  );
}
