export default function StatCard({ icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top"><div className="stat-icon">{icon}</div><span className="stat-arrow">↗</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
