import { Clock3, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const PAD = (n) => String(n).padStart(2, "0");
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${PAD(h)}:${PAD(m)}:${PAD(sec)}`;
}

export default function FocusTimer({ quest, compact = false, onChanged }) {
  const [timer, setTimer] = useState({ elapsed_seconds: quest?.focus_seconds || 0, status: "idle", started_at: null });
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.getTimer(quest.id).then((data) => active && setTimer(data.timer)).catch(() => {});
    return () => { active = false; };
  }, [quest.id]);

  useEffect(() => {
    if (timer.status !== "running") return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer.status]);

  const displaySeconds = useMemo(() => {
    if (timer.status !== "running" || !timer.started_at) return timer.elapsed_seconds || 0;
    const started = new Date(timer.started_at).getTime();
    return (timer.elapsed_seconds || 0) + Math.max(0, Math.floor((now - started) / 1000));
  }, [timer, now]);

  async function action(name) {
    try {
      setBusy(true); setError("");
      const data = await api.timerAction(quest.id, name);
      setTimer(data.timer);
      onChanged?.(data.timer);
    } catch (e) {
      setError(e.message || "Timer could not be updated.");
    } finally { setBusy(false); }
  }

  const minutes = Math.floor(displaySeconds / 60);
  const multiplier = { Easy: 1, Medium: 1.25, Hard: 1.5, Epic: 2 }[quest.difficulty || "Easy"] || 1;
  const xpPreview = Math.max(0, Math.floor(minutes * 10 * multiplier));
  const goldPreview = Math.max(0, Math.floor(minutes * 3 * multiplier));

  return (
    <div className={`focus-timer ${compact ? "focus-timer-compact" : ""}`}>
      <div className="focus-timer-top">
        <div className="focus-timer-title"><Clock3 size={16} /><span>FOCUS TIMER</span></div>
        <strong>{formatTime(displaySeconds)}</strong>
      </div>
      <div className="focus-timer-track"><span style={{ width: `${Math.min(100, (displaySeconds / 3600) * 100)}%` }} /></div>
      <div className="focus-timer-reward">
        <span>Earn as you focus</span>
        <b>+{xpPreview || 0} XP · +{goldPreview || 0} Gold</b>
      </div>
      <div className="focus-timer-actions">
        {timer.status === "running" ? (
          <button className="timer-action secondary-button" disabled={busy} onClick={() => action("pause")}><Pause size={14} />Pause</button>
        ) : (
          <button className="timer-action primary-button" disabled={busy || quest.completed} onClick={() => action(timer.elapsed_seconds > 0 ? "resume" : "start")}>
            <Play size={14} />{timer.elapsed_seconds > 0 ? "Resume" : "Start focus"}
          </button>
        )}
        <button className="timer-reset icon-button" disabled={busy || displaySeconds === 0 || quest.completed} onClick={() => action("reset")} title="Reset timer" aria-label="Reset timer"><RotateCcw size={14} /></button>
      </div>
      {error && <small className="timer-error">{error}</small>}
    </div>
  );
}
