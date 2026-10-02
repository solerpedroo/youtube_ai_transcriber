import { STORAGE_KEY } from "@/lib/storage/adapter";

/**
 * Inline script source that applies the saved theme before paint to avoid FOUC.
 * Keep this dependency-free and safe if localStorage is unavailable.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var preference="system";if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.settings&&typeof parsed.settings.theme==="string"){preference=parsed.settings.theme;}}var dark=preference==="dark"||(preference!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
