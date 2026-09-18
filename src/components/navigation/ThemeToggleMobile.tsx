import { useTheme } from "next-themes";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";

export function ThemeToggleMobile() {
  const { theme, setTheme } = useTheme();

  const isSystem = theme === "system";
  const isLight = theme === "light";
  const isDark = theme === "dark";

  return (
    <div className="flex items-center" role="group" aria-label="Appearance">
      <span className="flex items-center gap-3 p-2">Theme</span>
      <div className="flex gap-2 ml-auto">
        <button
          type="button"
          aria-label="System"
          aria-pressed={isSystem}
          title="System"
          onClick={() => setTheme("system")}
          className={`p-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isSystem ? "bg-accent" : ""
          }`}
        >
          <Desktop className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Light"
          aria-pressed={isLight}
          title="Light"
          onClick={() => setTheme("light")}
          className={`p-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isLight ? "bg-accent" : ""
          }`}
        >
          <Sun className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Dark"
          aria-pressed={isDark}
          title="Dark"
          onClick={() => setTheme("dark")}
          className={`p-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isDark ? "bg-accent" : ""
          }`}
        >
          <Moon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ThemeToggleMobile;
