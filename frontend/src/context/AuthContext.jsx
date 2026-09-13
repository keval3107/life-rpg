import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem("life_rpg_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("life_rpg_token")) refreshUser();
    else setLoading(false);
  }, []);

  function login(token, userData) {
    localStorage.setItem("life_rpg_token", token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("life_rpg_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
