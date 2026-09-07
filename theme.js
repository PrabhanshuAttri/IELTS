(function () {
  "use strict";

  const THEME_KEY = "ielts_theme";
  // Kept in sync with the --canvas token values in style.css.
  const CANVAS_LIGHT = "#ffffff";
  const CANVAS_DARK = "#001e2b";

  function effectiveTheme() {
    let stored;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { stored = null; }
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // The <meta name="theme-color"> tag has no `media` attribute, so it always
  // applies — this function is what actually keeps browser chrome (address
  // bar, task switcher card) matched to the theme actually in effect,
  // instead of only ever reflecting the OS's light/dark preference and
  // ignoring an explicit in-page override.
  function updateThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", effectiveTheme() === "dark" ? CANVAS_DARK : CANVAS_LIGHT);
  }

  function updateThemeButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = effectiveTheme() === "dark";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }

  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      document.documentElement.setAttribute("data-theme", next);
      updateThemeButton();
      updateThemeColorMeta();
    });
  }

  // Keep chrome color in sync if the OS preference changes while a page is
  // open and no explicit in-page choice has been made yet.
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      updateThemeButton();
      updateThemeColorMeta();
    });
  } catch (e) {}

  updateThemeButton();
  updateThemeColorMeta();
})();
