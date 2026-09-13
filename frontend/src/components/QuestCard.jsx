import { Check, Pencil, Trash2 } from "lucide-react";
import FocusTimer from "./FocusTimer";

const categoryIcon = { Study: "🧠", Coding: "💻", Fitness: "💪", Reading: "📚", Focus: "🎯", Other: "✨" };
const difficultyMeta = { Easy: 1, Medium: 1.25, Hard: 1.5, Epic: 2 };

export default function QuestCard({ quest, onComplete, onEdit, onDelete }) {
  const icon = categoryIcon[quest.category] || "✨";
  const focusMinutes = Math.floor((quest.focus_seconds || 0) / 60);
  const multiplier = difficultyMeta[quest.difficulty] || 1;
  return (
    <article className={`quest-card ${quest.completed ? "quest-completed" : ""}`}>
      <div className="quest-main"><div className="quest-icon">{icon}</div><div className="quest-content">
        <div className="quest-title-row"><h3 className={`quest-title ${quest.completed ? "completed" : ""}`}>{quest.title}</h3><span className="quest-category">{quest.category}</span></div>
        <p className="quest-description">{quest.description || "Complete this quest to keep progressing."}</p>
      </div></div>
      <div className="quest-meta"><span className="quest-meta-item xp">{quest.difficulty || "Easy"} · {multiplier}× XP</span><span className="quest-meta-item gold">⏱ Timer-based Gold</span><span className="quest-meta-item attribute">{quest.attribute || "focus"}</span></div>
      {!quest.completed && <FocusTimer quest={quest} compact />}
      {quest.completed && <div className="quest-focus-summary">⏱ {focusMinutes} focused min · rewards claimed from your timer</div>}
      <div className="quest-actions">
        {!quest.completed ? <button className="complete-button" onClick={() => onComplete(quest.id)}><Check size={16} />Complete & claim</button> : <div className="completed-label"><Check size={16} />Completed</div>}
        {!quest.completed && <button className="quest-icon-button" onClick={() => onEdit(quest)} title="Edit quest" aria-label="Edit quest"><Pencil size={16} /></button>}
        <button className="quest-icon-button delete" onClick={() => onDelete(quest.id)} title="Move to Recycle Bin" aria-label="Move to Recycle Bin"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}
