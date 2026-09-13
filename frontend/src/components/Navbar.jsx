import { Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const active = (path) => location.pathname === path;

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-mark">L</span>
          <span className="brand-name">Life<span>RPG</span></span>
        </Link>

        <div className="navbar-actions">
          <nav className={`nav-menu ${open ? "nav-menu-open" : ""}`}>
            {user ? (
              <>
                <Link className={`nav-link ${active("/dashboard") ? "active" : ""}`} to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link className={`nav-link ${active("/quests") ? "active" : ""}`} to="/quests" onClick={() => setOpen(false)}>Quests</Link>
                <Link className={`nav-link ${active("/character") ? "active" : ""}`} to="/character" onClick={() => setOpen(false)}>Character</Link>
                <Link className={`nav-link ${active("/rewards") ? "active" : ""}`} to="/rewards" onClick={() => setOpen(false)}>Rewards</Link>
                <Link className={`nav-link ${active("/recycle-bin") ? "active" : ""}`} to="/recycle-bin" onClick={() => setOpen(false)}>Recycle Bin</Link>
                <button className="nav-logout" onClick={() => { logout(); setOpen(false); }}>
                  <Shield size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login" onClick={() => setOpen(false)}>Login</Link>
                <Link className="nav-start" to="/register" onClick={() => setOpen(false)}>Get started</Link>
              </>
            )}
          </nav>

          <ThemeToggle />

          <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
