const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Add your free OpenWeatherMap API key here:
// https://home.openweathermap.org/api_keys
export const API_KEY = "454480a927971ec1ef07095cffe72754";

function ensureConfigured() {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    throw new Error("Add your OpenWeatherMap API key in js/api.js before searching for weather.");
  }
}

async function requestWeather(endpoint, params) {
  ensureConfigured();
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries({ ...params, appid: API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Network connection failed. Check your internet and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error("City not found. Check the spelling and try again.");
    if (response.status === 401) throw new Error("API key is invalid or not active yet. Check js/api.js.");
    if (response.status === 429) throw new Error("Weather API request limit reached. Please wait and try again.");
    throw new Error(data.message || `Weather request failed (${response.status}).`);
  }
  return data;
}

export async function getCurrentWeather(city, units = "metric") {
  return requestWeather("weather", { q: city, units });
}

export async function getCurrentWeatherByCoords(lat, lon, units = "metric") {
  return requestWeather("weather", { lat, lon, units });
}

export async function getFiveDayForecast(city, units = "metric") {
  return requestWeather("forecast", { q: city, units });
}

export async function getFiveDayForecastByCoords(lat, lon, units = "metric") {
  return requestWeather("forecast", { lat, lon, units });
}

// OpenWeather returns data every 3 hours. Group entries by local calendar date,
// then select a record nearest to midday to represent each day.
export function summarizeForecast(forecastData) {
  const grouped = new Map();
  for (const item of forecastData.list || []) {
    const date = item.dt_txt.split(" ")[0];
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(item);
  }
  return [...grouped.entries()].slice(0, 5).map(([date, entries]) => {
    const representative = entries.reduce((best, item) => {
      const hour = Number(item.dt_txt.slice(11, 13));
      const bestHour = Number(best.dt_txt.slice(11, 13));
      return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? item : best;
    }, entries[0]);
    return {
      date,
      temp: representative.main.temp,
      min: Math.min(...entries.map(item => item.main.temp_min)),
      max: Math.max(...entries.map(item => item.main.temp_max)),
      description: representative.weather?.[0]?.description || "conditions unavailable",
      icon: representative.weather?.[0]?.icon || "01d",
      pop: Math.round(Math.max(...entries.map(item => item.pop || 0)) * 100)
    };
  });
}
