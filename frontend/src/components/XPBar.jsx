export default function XPBar({ level, xp }) {
  const current = Math.floor(100 * Math.pow(level, 1.35));
  const next = Math.floor(100 * Math.pow(level + 1, 1.35));
  const progress = Math.min(100, Math.max(0, ((xp - current) / Math.max(1, next - current)) * 100));

  return (
    <div className="xp-bar-wrapper">
      <div className="xp-bar-header"><span>Level {level}</span><span>{xp} XP / {next} XP</span></div>
      <div className="xp-track"><div className="xp-fill" style={{ width: `${progress}%` }} /></div>
      <div className="xp-bar-footer"><span>{Math.round(progress)}% complete</span><span>{Math.max(0, next - xp)} XP remaining</span></div>
    </div>
  );
}
