"use client";

import { useEffect, useState } from "react";

const storageKey = "portfolioTheme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) || "dark";
    document.documentElement.dataset.theme = savedTheme;
    setTheme(savedTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Passer au theme sombre" : "Passer au theme clair"}
    >
      {theme === "light" ? "Sombre" : "Clair"}
    </button>
  );
}
