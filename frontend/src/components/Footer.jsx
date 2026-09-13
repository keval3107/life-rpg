import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-row">
          <Link to="/" className="footer-brand">
            <span className="footer-brand-mark">L</span>
            <span>Life<span>RPG</span></span>
          </Link>
          <p>Turn meaningful goals into consistent progress.</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/quests">Quests</Link>
          <Link to="/character">Character</Link>
          <Link to="/rewards">Rewards</Link>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LifeRPG. Built for better days.</span>
          <span className="footer-status"><i /> Personal progress, simplified <ArrowUpRight size={13} /></span>
        </div>
      </div>
    </footer>
  );
}
