import { CheckCircle2, Coins, Sparkles, Flame, X } from "lucide-react";

export default function QuestCompletePopup({ result, questTitle, onClose }) {
  if (!result) return null;

  return (
    <div className="quest-complete-popup" role="status" aria-live="polite">
      <div className="quest-complete-icon" aria-hidden="true">
        <CheckCircle2 size={22} />
      </div>
      <div className="quest-complete-content">
        <div className="quest-complete-title-row">
          <strong>Quest Complete!</strong>
          <button className="quest-complete-close" onClick={onClose} aria-label="Close quest completion message">
            <X size={15} />
          </button>
        </div>
        <p className="quest-complete-quest">{questTitle || "Your quest"}</p>
        <div className="quest-complete-rewards">
          <span className="reward-chip xp-chip"><Sparkles size={13} /> +{result.xp_gained || 0} XP</span>
          <span className="reward-chip gold-chip"><Coins size={13} /> +{result.gold_gained || 0} Gold</span>
          <span className="reward-chip streak-chip"><Flame size={13} /> {result.streak || 0} day streak</span>
        </div>
        {result.focus_minutes > 0 && (
          <div className="quest-complete-focus">Focus time: {result.focus_minutes} min</div>
        )}
      </div>
    </div>
  );
}
