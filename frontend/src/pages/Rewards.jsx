import { Coins, Gift, ShoppingBag, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../services/api";

export default function Rewards() {
  const [data, setData] = useState({ rewards: [], owned_rewards: [], character: null });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const result = await api.getRewards();
      setData(result);
    } catch (e) {
      setError(e.message || "Unable to load rewards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function buy(id) {
    try {
      setBuyingId(id);
      setMessage("");
      const r = await api.buyReward(id);
      setMessage(r.message);
      await load();
    } catch (e) {
      setMessage(e.message || "Unable to redeem reward.");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-container rewards-page">
        <section className="page-header">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" />REWARD ECONOMY</div>
            <h1>Rewards</h1>
            <p>Use the Gold you earn to create meaningful moments worth working toward.</p>
          </div>

          {data.character && (
            <div className="gold-balance">
              <Coins size={18} />
              <div><span>Available Gold</span><strong>{data.character.gold}</strong></div>
            </div>
          )}
        </section>

        {message && <div className="dashboard-message"><Sparkles size={18} />{message}</div>}
        {error && <div className="dashboard-message error-message">{error}</div>}

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /><p>Loading rewards...</p></div>
        ) : (
          <>
            <section className="reward-shop-section">
              <div className="section-header">
                <div>
                  <span className="section-label">REWARD SHOP</span>
                  <h2>Available rewards</h2>
                  <p>Redeem a reward with your earned Gold.</p>
                </div>
              </div>

              {data.rewards.length ? (
                <div className="reward-grid">
                  {data.rewards.map((r) => (
                    <article className="reward-card" key={r.id}>
                      <div className="reward-icon">{r.icon || "🎁"}</div>
                      <div className="reward-copy">
                        <span className="reward-type"><Gift size={13} /> PERSONAL REWARD</span>
                        <h2>{r.name}</h2>
                        <p>{r.description}</p>
                      </div>
                      <div className="reward-footer">
                        <span><Coins size={15} /> {r.cost} Gold</span>
                        <button
                          className="reward-buy"
                          disabled={buyingId === r.id}
                          onClick={() => buy(r.id)}
                        >
                          <ShoppingBag size={15} />
                          {buyingId === r.id ? "Redeeming..." : "Redeem"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><div className="empty-icon"><Gift size={22} /></div><h3>No rewards available</h3><p>Add rewards to your shop from the database.</p></div>
              )}
            </section>

            <section className="owned-rewards-section">
              <div className="section-header">
                <div>
                  <span className="section-label">YOUR REWARDS</span>
                  <h2>Redeemed rewards</h2>
                  <p>Every reward you redeem is saved here permanently.</p>
                </div>
                <div className="owned-count">{data.owned_rewards.length} redeemed</div>
              </div>

              {data.owned_rewards.length ? (
                <div className="owned-rewards-list">
                  {data.owned_rewards.map((r) => (
                    <article className="owned-reward-card" key={r.inventory_id}>
                      <div className="owned-reward-icon">{r.icon || "🎁"}</div>
                      <div className="owned-reward-copy">
                        <strong>{r.name}</strong>
                        <span>{r.description}</span>
                      </div>
                      <div className="owned-reward-status"><CheckCircle2 size={16} /> Redeemed</div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="owned-empty">
                  <Gift size={18} />
                  <span>You haven't redeemed any rewards yet.</span>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
