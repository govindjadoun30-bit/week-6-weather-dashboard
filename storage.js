const STORAGE_KEY = "atmosWeatherPreferences";

const DEFAULTS = {
  defaultCity: "Delhi",
  units: "metric",
  theme: "light",
  favorites: []
};

export function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULTS };
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULTS,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : []
    };
  } catch (error) {
    console.warn("Could not read saved weather preferences:", error);
    return { ...DEFAULTS };
  }
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.warn("Could not save weather preferences:", error);
    return false;
  }
}

export function toggleFavorite(city, favorites) {
  const normalized = city.trim();
  const exists = favorites.some(item => item.toLowerCase() === normalized.toLowerCase());
  return exists
    ? favorites.filter(item => item.toLowerCase() !== normalized.toLowerCase())
    : [...favorites, normalized];
}
