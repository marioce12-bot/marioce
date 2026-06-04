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
      title={theme === "light" ? "Theme sombre" : "Theme clair"}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21.64 13.02A8.5 8.5 0 0 1 10.98 2.36a.9.9 0 0 0-1.08-1.13A10.5 10.5 0 1 0 22.77 14.1a.9.9 0 0 0-1.13-1.08ZM12 20.7a8.7 8.7 0 0 1-4.05-16.4 10.31 10.31 0 0 0 11.75 11.75A8.72 8.72 0 0 1 12 20.7Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 5.3A6.7 6.7 0 1 0 12 18.7 6.7 6.7 0 0 0 12 5.3Zm0 11.4A4.7 4.7 0 1 1 12 7.3a4.7 4.7 0 0 1 0 9.4ZM12 1.5a1 1 0 0 1 1 1v1.1a1 1 0 1 1-2 0V2.5a1 1 0 0 1 1-1Zm0 18.9a1 1 0 0 1 1 1v1.1a1 1 0 1 1-2 0v-1.1a1 1 0 0 1 1-1ZM22.5 11a1 1 0 1 1 0 2h-1.1a1 1 0 1 1 0-2h1.1ZM3.6 11a1 1 0 1 1 0 2H2.5a1 1 0 1 1 0-2h1.1Zm15.32-6.34a1 1 0 0 1 0 1.42l-.78.78a1 1 0 1 1-1.42-1.42l.78-.78a1 1 0 0 1 1.42 0ZM7.28 16.72a1 1 0 0 1 0 1.42l-.78.78a1 1 0 1 1-1.42-1.42l.78-.78a1 1 0 0 1 1.42 0Zm11.64 2.2a1 1 0 0 1-1.42 0l-.78-.78a1 1 0 1 1 1.42-1.42l.78.78a1 1 0 0 1 0 1.42ZM7.28 7.28a1 1 0 0 1-1.42 0l-.78-.78A1 1 0 1 1 6.5 5.08l.78.78a1 1 0 0 1 0 1.42Z" />
        </svg>
      )}
    </button>
  );
}
