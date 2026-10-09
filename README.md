# Atmos — Weather Dashboard (Week 6)

A responsive weather dashboard built with HTML, CSS, and vanilla JavaScript modules. It uses the OpenWeatherMap REST API with `async/await`, displays current conditions and a five-day forecast, supports city search and geolocation, and persists preferences in Local Storage.

## Features

- Current temperature, feels-like temperature, high/low, description and weather icon
- Five-day forecast aggregated from OpenWeatherMap's 3-hour forecast data
- City search with loading, network, API-key, rate-limit and not-found error handling
- Saved/favorite cities
- Celsius/Fahrenheit selection
- Light/dark theme preference
- Default city saved between visits
- Optional browser geolocation (requires permission and a secure context such as localhost/HTTPS)
- Responsive layout, keyboard-friendly form controls, status announcements, visible focus support, and reduced-motion support

## Project structure

```text
weather-dashboard-week6/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── app.js
│   └── storage.js
├── screenshots/
│   └── README.md
└── README.md
```

## Setup instructions

1. Install Node.js only if you want to use a local development server; no build step or npm packages are required.
2. Create a free account at [OpenWeatherMap](https://openweathermap.org/api).
3. Open your API keys page and copy your API key. New keys may take a little time to activate.
4. Open `js/api.js` and replace `YOUR_OPENWEATHERMAP_API_KEY` with your key.
5. Serve the folder from localhost. For example, in VS Code install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**. ES modules may not work when opening the file directly using `file://`.
6. Search for a city such as Delhi, London, or Tokyo.

> Keep your API key private. This beginner/intermediate demo stores the key in front-end code, so it is visible to anyone who can inspect the deployed site. For a public production app, call the weather API through a server-side proxy and keep the key in an environment variable.

## API integration

Base URL: `https://api.openweathermap.org/data/2.5`

### Current weather

`GET /weather?q={city}&appid={API_KEY}&units={metric|imperial}`

Example (replace placeholders before using):

```text
https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=YOUR_API_KEY&units=metric
```

The application reads `name`, `sys.country`, `main.temp`, `main.feels_like`, `main.temp_min`, `main.temp_max`, `main.humidity`, `main.pressure`, `weather[0].description`, `weather[0].icon`, `wind.speed`, and `visibility`.

### Five-day forecast

`GET /forecast?q={city}&appid={API_KEY}&units={metric|imperial}`

OpenWeatherMap provides forecast entries in three-hour intervals. `summarizeForecast()` groups entries by date, chooses the entry closest to midday for the condition and representative temperature, and calculates each day's minimum/maximum across that date's entries. Precipitation probability (`pop`) is shown as a percentage.

### Geolocation

The browser Geolocation API provides latitude and longitude after the user grants permission. Those coordinates are sent to `/weather` and `/forecast` as `lat` and `lon` parameters.

## Async JavaScript and error handling

- `async/await` keeps the asynchronous request flow readable.
- `fetch()` sends HTTP GET requests.
- `response.ok` is checked before data is used.
- API errors are converted into useful messages (404 city not found, 401 API key issue, 429 rate limit).
- A `try/catch/finally` pattern handles errors and always clears the loading state.
- A request ID prevents a slower earlier search from overwriting the newest result.
- Data is parsed with `response.json()` and transformed before being rendered.

## Local Storage

`js/storage.js` stores one JSON object under the key `atmosWeatherPreferences`:

```json
{
  "defaultCity": "Delhi",
  "units": "metric",
  "theme": "light",
  "favorites": ["Delhi", "London"]
}
```

`loadPreferences()` safely parses stored JSON and supplies defaults if data is missing or invalid. `savePreferences()` serializes the object with `JSON.stringify()`. No sensitive personal data is stored.

## Testing checklist

| Test | Steps | Expected result |
|---|---|---|
| Valid city | Search `Delhi` | Current conditions and forecast render |
| Another city | Search `London` | Dashboard updates to London |
| Invalid city | Search a nonsense city name | Friendly not-found message appears |
| Missing API key | Keep placeholder in `api.js` | Setup message explains how to configure key |
| Units | Change °C to °F | Temperatures and wind units update |
| Favorite | Click the heart on a city | City appears in Saved cities |
| Remove favorite | Click × next to a saved city | City disappears from the list |
| Persistence | Save a city/theme, then refresh | Preferences are restored |
| Theme | Click sun/moon button | Light/dark theme changes and persists |
| Geolocation | Click Use my location and allow access | Weather for detected location appears |
| Responsive | Resize to mobile width | Layout adapts; forecast can scroll horizontally |
| Network error | Disable network and search | Clear network error is shown |

## Documentation / architecture

- `index.html`: accessible page structure and UI containers.
- `css/styles.css`: responsive layout, theme variables, component styling, animations and reduced-motion handling.
- `js/api.js`: API requests, HTTP error mapping and forecast aggregation.
- `js/storage.js`: Local Storage defaults, parsing, persistence and favorites.
- `js/app.js`: DOM updates, event handlers, loading states, geolocation and application state.

### Algorithms and data structures

- A `Map` groups three-hour forecast records by date.
- Arrays store saved city names and forecast summaries.
- `toggleFavorite()` performs a case-insensitive membership check and returns an updated array.
- Preferences are serialized as JSON because Local Storage stores strings.

## Screenshots

Run the project locally, then capture screenshots of:
1. Dashboard with a valid city and current weather.
2. Five-day forecast and weather details.
3. Saved cities after favoriting two cities.
4. Dark and light themes.
5. Mobile/responsive layout.
6. Error message for an invalid city (optional).

Save the images in the `screenshots/` folder before submitting.

## Deployment

You can deploy the static site using GitHub Pages, Netlify, or Vercel. Remember that a browser-side API key is visible in a public deployment. For a classroom submission, follow your instructor's guidance; for a real public service, move API requests behind a backend proxy.

## Credits

Weather data: [OpenWeatherMap](https://openweathermap.org/). Fonts: DM Sans and Manrope via Google Fonts.
