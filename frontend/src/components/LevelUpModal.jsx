import { Sparkles, Trophy, X } from "lucide-react";

export default function LevelUpModal({ level, onClose }) {
  if (!level) return null;

  return (
    <div className="level-up-overlay" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="level-up-card">
        <button className="level-up-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="level-up-icon">
          <Trophy size={30} />
        </div>

        <div className="level-up-eyebrow">
          <Sparkles size={14} /> MILESTONE REACHED
        </div>

        <h2 id="level-up-title">Congratulations!</h2>
        <p>You leveled up. Keep the momentum going.</p>

        <div className="level-up-number">Level {level}</div>

        <button className="primary-button level-up-button" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
