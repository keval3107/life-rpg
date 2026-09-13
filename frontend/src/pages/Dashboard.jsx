import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import XPBar from "../components/XPBar";
import StatCard from "../components/StatCard";
import QuestCard from "../components/QuestCard";
import FocusTimer from "../components/FocusTimer";
import QuestModal from "../components/QuestModal";
import LevelUpModal from "../components/LevelUpModal";
import QuestCompletePopup from "../components/QuestCompletePopup";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();

  const [data, setData] = useState(null);
  const [modal, setModal] = useState({
    open: false,
    quest: null,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);
  const [completionPopup, setCompletionPopup] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const dashboard = await api.getDashboard();
      setData(dashboard);
    } catch (error) {
      setMessage(error.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function complete(id) {
    try {
      const result = await api.completeQuest(id);
      const completedQuest = data?.quests?.find((quest) => quest.id === id);
      setCompletionPopup({ result, questTitle: completedQuest?.title });

      setMessage(`Quest conquered! +${result.xp_gained} XP · +${result.gold_gained} Gold · Keep going!`);
      if (result.level_up) setLevelUp(result.level);

      await load();
      await refreshUser();
      window.setTimeout(() => setCompletionPopup(null), 4500);
    } catch (error) {
      setMessage(error.message || "Unable to complete quest.");
    }
  }

  async function save(form) {
    try {
      if (modal.quest) {
        await api.updateQuest(modal.quest.id, form);
        setMessage("Quest updated successfully.");
      } else {
        await api.createQuest(form);
        setMessage("New quest created successfully.");
      }

      setModal({
        open: false,
        quest: null,
      });

      await load();
    } catch (error) {
      setMessage(error.message || "Unable to save quest.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this quest?")) return;

    try {
      await api.deleteQuest(id);
      setMessage("Quest deleted.");
      await load();
    } catch (error) {
      setMessage(error.message || "Unable to delete quest.");
    }
  }

  const stats = useMemo(() => {
    if (!data) return null;

    const total = data.quests?.length || 0;
    const completed =
      data.quests?.filter((quest) => quest.completed).length || 0;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      remaining: total - completed,
      completionRate,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{message || "Something went wrong."}</p>

          <button className="primary-button" onClick={load}>
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { character, quests, recent } = data;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="dashboard-container">
        {/* Header */}
        <section className="dashboard-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              YOUR PERSONAL DASHBOARD
            </div>

            <h1>
              Welcome back,{" "}
              <span>{user?.username || "there"}</span>
            </h1>

            <p>
              Stay consistent, complete meaningful work, and keep moving
              forward.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <div className="user-detail-card">
              <div className="user-detail-avatar">
                {(user?.username || "U").charAt(0).toUpperCase()}
              </div>
              <div className="user-detail-content">
                <span className="user-detail-label">SIGNED IN AS</span>
                <strong>{user?.username || "User"}</strong>
                <span>{user?.email || "Account details"}</span>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={() =>
                setModal({
                  open: true,
                  quest: null,
                })
              }
            >
              <Plus size={18} />
              New quest
            </button>
          </div>
        </section>

        {/* Message */}
        {message && (
          <div className="dashboard-message">
            <CheckCircle2 size={18} />
            <span>{message}</span>

            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {/* Main overview */}
        <section className="overview-grid">
          {/* Level card */}
          <div className="level-card">
            <div className="level-card-top">
              <div>
                <div className="section-label">CURRENT LEVEL</div>

                <div className="level-number">
                  {character.level}
                </div>

                <p className="level-description">
                  Keep completing quests to reach your next milestone.
                </p>
              </div>

              <div className="level-icon">
                <Trophy size={24} />
              </div>
            </div>

            <div className="level-progress">
              <XPBar
                level={character.level}
                xp={character.xp}
              />
            </div>

            <div className="level-footer">
              <span>{character.xp} total XP</span>
              <span>Level {character.level + 1} next</span>
            </div>
          </div>

          {/* Streak */}
          <div className="streak-card">
            <div className="card-heading">
              <div className="icon-box orange">
                <Flame size={19} />
              </div>

              <div>
                <span className="section-label">CURRENT STREAK</span>
                <h3>Consistency</h3>
              </div>
            </div>

            <div className="streak-value">
              {character.streak}
              <span>days</span>
            </div>

            <p>
              Keep your momentum going by completing at least one quest
              today.
            </p>
          </div>
        </section>

        {/* Focus + quick rewards */}
        <section className="dashboard-focus-grid">
          <div className="dashboard-focus-card">
            <div className="dashboard-focus-copy">
              <div className="eyebrow"><span className="eyebrow-dot" />FOCUS MODE</div>
              <h2>Work first. Earn after.</h2>
              <p>Start a timer on any quest. Your focused minutes turn into XP, Gold and attribute growth when you claim the quest.</p>
            </div>
            <div className="focus-pill"><Clock3 size={15} /> Timer-based rewards</div>
          </div>
          {data.active_timer ? (
            <div className="dashboard-active-timer"><FocusTimer quest={data.active_timer} /></div>
          ) : (
            <div className="dashboard-active-timer idle">
              <Clock3 size={20} />
              <div><strong>No active focus session</strong><span>Start a timer from one of your quests below.</span></div>
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="stats-section">
          <div className="section-header">
            <div>
              <span className="section-label">YOUR ATTRIBUTES</span>
              <h2>Personal growth</h2>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              icon="🧠"
              label="Intellect"
              value={character.intellect}
              hint="Study & coding"
            />

            <StatCard
              icon="💪"
              label="Strength"
              value={character.strength}
              hint="Fitness"
            />

            <StatCard
              icon="🎯"
              label="Focus"
              value={character.focus}
              hint="Deep work"
            />

            <StatCard
              icon="📚"
              label="Wisdom"
              value={character.wisdom}
              hint="Reading"
            />
          </div>
        </section>

        {/* Productivity summary */}
        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">
              <Target size={19} />
            </div>

            <div>
              <span>Active quests</span>
              <strong>{stats.remaining}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon purple">
              <Trophy size={19} />
            </div>

            <div>
              <span>Completion rate</span>
              <strong>{stats.completionRate}%</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon gold">
              <Wallet size={19} />
            </div>

            <div>
              <span>Gold balance</span>
              <strong>{character.gold}</strong>
            </div>
          </div>
        </section>

        {/* Quests */}
        <section className="quests-section">
          <div className="section-header">
            <div>
              <span className="section-label">TODAY</span>
              <h2>Your quests</h2>
              <p>Focus on what matters most right now.</p>
            </div>

            <div className="section-actions">
              <button
                className="icon-button"
                onClick={load}
                title="Refresh quests"
              >
                <RefreshCw size={17} />
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  setModal({
                    open: true,
                    quest: null,
                  })
                }
              >
                <Plus size={16} />
                Add quest
              </button>
            </div>
          </div>

          {quests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Sparkles size={22} />
              </div>

              <h3>No quests yet</h3>

              <p>
                Create your first quest and start building momentum.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setModal({
                    open: true,
                    quest: null,
                  })
                }
              >
                <Plus size={17} />
                Create your first quest
              </button>
            </div>
          ) : (
            <div className="quest-grid">
              {quests.slice(0, 6).map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={complete}
                  onEdit={(selectedQuest) =>
                    setModal({
                      open: true,
                      quest: selectedQuest,
                    })
                  }
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        {recent.length > 0 && (
          <section className="activity-section">
            <div className="section-header">
              <div>
                <span className="section-label">ACTIVITY</span>
                <h2>Recent victories</h2>
              </div>
            </div>

            <div className="activity-list">
              {recent.map((item) => (
                <div
                  className="activity-item"
                  key={item.id}
                >
                  <div className="activity-left">
                    <div className="activity-check">
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <strong>{item.title}</strong>

                      <span>
                        <Clock3 size={13} />
                        Quest completed
                      </span>
                    </div>
                  </div>

                  <div className="activity-xp">
                    +{item.xp_reward || 0} XP
                    {item.gold_reward > 0 && <small> +{item.gold_reward} Gold</small>}
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />
      <QuestCompletePopup result={completionPopup?.result} questTitle={completionPopup?.questTitle} onClose={() => setCompletionPopup(null)} />

      <QuestModal
        open={modal.open}
        quest={modal.quest}
        onClose={() =>
          setModal({
            open: false,
            quest: null,
          })
        }
        onSave={save}
      />
    </div>
  );
}