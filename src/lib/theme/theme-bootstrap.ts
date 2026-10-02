import { STORAGE_KEY } from "@/lib/storage/adapter";

/**
 * Inline script source that applies the saved theme before paint to avoid FOUC.
 * Only trusts a theme when the persisted settings shape looks valid — matching
 * migrateAppState fallback to `system` when AppSettingsSchema would reject.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var preference="system";if(raw){var parsed=JSON.parse(raw);var settings=parsed&&parsed.settings;var theme=settings&&settings.theme;var looksValid=settings&&typeof settings==="object"&&(theme==="light"||theme==="dark"||theme==="system")&&settings.chatProvider&&typeof settings.chatProvider==="object"&&settings.transcriptionProvider&&typeof settings.transcriptionProvider==="object";if(looksValid)preference=theme;}var dark=preference==="dark"||(preference!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
