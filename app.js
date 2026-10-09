import {
  getCurrentWeather, getFiveDayForecast, getCurrentWeatherByCoords,
  getFiveDayForecastByCoords, summarizeForecast
} from "./api.js";
import { loadPreferences, savePreferences, toggleFavorite } from "./storage.js";

const $ = selector => document.querySelector(selector);
const els = {
  form: $("#search-form"), input: $("#city-input"), searchButton: $("#search-button"),
  locationButton: $("#location-button"), status: $("#status-message"), currentCity: $("#current-city"),
  date: $("#current-date"), temp: $("#current-temp"), description: $("#current-description"),
  feels: $("#feels-like"), emoji: $("#current-emoji"), highLow: $("#high-low"),
  timezone: $("#current-timezone"), humidity: $("#humidity-value"), wind: $("#wind-value"),
  pressure: $("#pressure-value"), visibility: $("#visibility-value"), forecast: $("#forecast-list"),
  favorite: $("#favorite-button"), savedCities: $("#saved-cities"), favoriteCount: $("#favorite-count"),
  units: $("#units-select"), theme: $("#theme-toggle"), defaultCity: $("#default-city-label"),
  unitsLabel: $("#units-label"), themeLabel: $("#theme-label"), favoritesNav: $("#favorites-nav")
};

let preferences = loadPreferences();
let activeCity = "";
let currentData = null;
let requestId = 0;
const unitSymbol = () => preferences.units === "metric" ? "°C" : "°F";
const speedUnit = () => preferences.units === "metric" ? "m/s" : "mph";
const weatherEmoji = icon => {
  const code = String(icon || "");
  if (code.startsWith("01")) return "☀";
  if (code.startsWith("02")) return "🌤";
  if (code.startsWith("03") || code.startsWith("04")) return "☁";
  if (code.startsWith("09") || code.startsWith("10")) return "🌧";
  if (code.startsWith("11")) return "⛈";
  if (code.startsWith("13")) return "❄";
  if (code.startsWith("50")) return "🌫";
  return "☀";
};
const formatTemp = value => `${Math.round(value)}${unitSymbol()}`;
const dayName = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const fullDate = () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

function setStatus(message = "", type = "") {
  els.status.textContent = message;
  els.status.className = `status-message ${type}`.trim();
}
function setLoading(isLoading) {
  document.body.classList.toggle("loading", isLoading);
  els.searchButton.disabled = isLoading;
  els.searchButton.textContent = isLoading ? "Loading…" : "Search ↗";
  els.locationButton.disabled = isLoading;
}
function persist() {
  savePreferences(preferences);
  renderPreferences();
}
function renderPreferences() {
  els.units.value = preferences.units;
  els.defaultCity.textContent = preferences.defaultCity || "Not set";
  els.unitsLabel.textContent = preferences.units === "metric" ? "Celsius (°C)" : "Fahrenheit (°F)";
  els.themeLabel.textContent = preferences.theme === "dark" ? "Dark" : "Light";
  document.body.classList.toggle("dark-mode", preferences.theme === "dark");
  els.theme.textContent = preferences.theme === "dark" ? "☾" : "☼";
  els.favoriteCount.textContent = preferences.favorites.length;
  renderFavorites();
  updateFavoriteButton();
}
function renderFavorites() {
  els.savedCities.replaceChildren();
  if (!preferences.favorites.length) {
    const empty = document.createElement("p");
    empty.className = "empty-saved";
    empty.textContent = "Save a city with the heart icon to find it here.";
    els.savedCities.append(empty);
    return;
  }
  preferences.favorites.forEach(city => {
    const card = document.createElement("div");
    card.className = "saved-city";
    const main = document.createElement("button");
    main.className = "saved-city-main";
    main.type = "button";
    const title = document.createElement("strong");
    title.textContent = city;
    const sub = document.createElement("span");
    sub.textContent = "View weather ↗";
    main.append(title, sub);
    main.addEventListener("click", () => loadCity(city));
    const remove = document.createElement("button");
    remove.className = "remove-city";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${city} from saved cities`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      preferences.favorites = toggleFavorite(city, preferences.favorites);
      persist();
      setStatus(`${city} removed from saved cities.`, "success");
    });
    card.append(main, remove);
    els.savedCities.append(card);
  });
}
function updateFavoriteButton() {
  const saved = activeCity && preferences.favorites.some(city => city.toLowerCase() === activeCity.toLowerCase());
  els.favorite.classList.toggle("is-favorite", Boolean(saved));
  els.favorite.textContent = saved ? "♥" : "♡";
  els.favorite.setAttribute("aria-pressed", String(Boolean(saved)));
  els.favorite.setAttribute("aria-label", saved ? "Remove current city from saved cities" : "Save current city");
}
function renderCurrent(data) {
  currentData = data;
  activeCity = data.name;
  els.currentCity.textContent = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ""}`;
  els.date.textContent = fullDate();
  els.temp.textContent = formatTemp(data.main.temp);
  els.description.textContent = data.weather?.[0]?.description || "Weather unavailable";
  els.feels.textContent = `Feels like ${formatTemp(data.main.feels_like)}`;
  els.emoji.textContent = weatherEmoji(data.weather?.[0]?.icon);
  els.highLow.textContent = `H: ${formatTemp(data.main.temp_max)} · L: ${formatTemp(data.main.temp_min)}`;
  els.timezone.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  els.humidity.textContent = `${data.main.humidity}%`;
  els.wind.textContent = `${data.wind.speed} ${speedUnit()}`;
  els.pressure.textContent = `${data.main.pressure} hPa`;
  els.visibility.textContent = `${data.visibility != null ? (data.visibility / 1000).toFixed(1) : "—"} km`;
  updateFavoriteButton();
}
function renderForecast(data) {
  const days = summarizeForecast(data);
  els.forecast.replaceChildren();
  if (!days.length) {
    els.forecast.innerHTML = '<div class="empty-forecast"><span>☁</span><p>Forecast unavailable</p><small>Please try again later.</small></div>';
    return;
  }
  days.forEach((day, index) => {
    const card = document.createElement("article");
    card.className = "forecast-day";
    const name = document.createElement("p"); name.className = "day-name"; name.textContent = index === 0 ? "Today" : dayName(day.date);
    const icon = document.createElement("div"); icon.className = "forecast-icon"; icon.textContent = weatherEmoji(day.icon);
    const desc = document.createElement("p"); desc.className = "forecast-desc"; desc.textContent = day.description;
    const temps = document.createElement("div"); temps.className = "forecast-temps";
    const high = document.createElement("span"); high.textContent = formatTemp(day.max);
    const low = document.createElement("span"); low.className = "low"; low.textContent = formatTemp(day.min);
    temps.append(high, low);
    const rain = document.createElement("div"); rain.className = "forecast-rain"; rain.textContent = `☂ ${day.pop}% chance`;
    card.append(name, icon, desc, temps, rain);
    els.forecast.append(card);
  });
}
async function loadCity(city, options = {}) {
  const trimmed = city.trim();
  if (!trimmed) { setStatus("Enter a city name to search.", "error"); return; }
  const thisRequest = ++requestId;
  setLoading(true);
  setStatus("Fetching the latest weather…");
  try {
    const [current, forecast] = options.coords
      ? await Promise.all([
          getCurrentWeatherByCoords(options.coords.lat, options.coords.lon, preferences.units),
          getFiveDayForecastByCoords(options.coords.lat, options.coords.lon, preferences.units)
        ])
      : await Promise.all([getCurrentWeather(trimmed, preferences.units), getFiveDayForecast(trimmed, preferences.units)]);
    if (thisRequest !== requestId) return;
    renderCurrent(current);
    renderForecast(forecast);
    els.input.value = current.name;
    preferences.defaultCity = current.name;
    persist();
    setStatus(`Weather updated for ${current.name}.`, "success");
  } catch (error) {
    if (thisRequest !== requestId) return;
    setStatus(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    if (thisRequest === requestId) setLoading(false);
  }
}

els.form.addEventListener("submit", event => {
  event.preventDefault();
  loadCity(els.input.value);
});
els.favorite.addEventListener("click", () => {
  if (!activeCity) { setStatus("Search for a city before saving it.", "error"); return; }
  preferences.favorites = toggleFavorite(activeCity, preferences.favorites);
  persist();
  updateFavoriteButton();
  setStatus(preferences.favorites.some(city => city.toLowerCase() === activeCity.toLowerCase())
    ? `${activeCity} added to saved cities.` : `${activeCity} removed from saved cities.`, "success");
});
els.units.addEventListener("change", () => {
  preferences.units = els.units.value;
  persist();
  if (activeCity) loadCity(activeCity);
});
els.theme.addEventListener("click", () => {
  preferences.theme = preferences.theme === "dark" ? "light" : "dark";
  persist();
});
els.locationButton.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    setStatus("Geolocation is not supported by this browser.", "error");
    return;
  }
  setStatus("Requesting your location…");
  navigator.geolocation.getCurrentPosition(
    position => loadCity("", { coords: { lat: position.coords.latitude, lon: position.coords.longitude } }),
    error => {
      const message = error.code === 1 ? "Location permission was denied. You can search for a city instead."
        : error.code === 2 ? "Your location could not be determined. Try searching for a city."
        : "Location request timed out. Please try again.";
      setStatus(message, "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});
els.favoritesNav.addEventListener("click", () => {
  $("#saved-cities").scrollIntoView({ behavior: "smooth", block: "center" });
});
renderPreferences();
els.date.textContent = fullDate();
// Load the saved default city on startup. A missing API key is explained in the status area.
loadCity(preferences.defaultCity || "Delhi");

function updateTimeBasedAnimation() {
  const hour = new Date().getHours();

  let scene;

  if (hour >= 5 && hour < 10) {
    scene = "morning";
  } else if (hour >= 10 && hour < 17) {
    scene = "day";
  } else if (hour >= 17 && hour < 20) {
    scene = "sunset";
  } else {
    scene = "night";
  }

  document.body.dataset.timeScene = scene;

  const label = document.querySelector("#time-scene-label");

  if (label) {
    const names = {
      morning: "🌅 Morning Glow",
      day: "☀️ Daytime Sky",
      sunset: "🌇 Sunset Vibes",
      night: "🌙 Night Sky"
    };

    label.textContent = names[scene];
  }
}

updateTimeBasedAnimation();

// Automatically check the time every minute
setInterval(updateTimeBasedAnimation, 60000);