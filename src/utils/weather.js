// Free, keyless weather via Open-Meteo. No signup, no API key required.
const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Foggy", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Snow", icon: "🌨️" },
  80: { label: "Rain showers", icon: "🌦️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
};

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] || { label: "—", icon: "🌡️" };
}

export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather request failed");
  const data = await res.json();
  return {
    tempC: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
    timezone: data.timezone,
    sunrise: data.daily?.sunrise?.[0] || null,
    sunset: data.daily?.sunset?.[0] || null,
  };
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unsupported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 6000, maximumAge: 15 * 60 * 1000 }
    );
  });
}

// Derives a human-friendly region label from the browser's IANA
// timezone (e.g. "Asia/Kolkata" -> "Kolkata") — a reasonable
// location hint without a second geocoding API call/key.
export function getTimezoneCityLabel() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "Asia/Kolkata"
    const parts = tz.split("/");
    return (parts[parts.length - 1] || tz).replace(/_/g, " ");
  } catch {
    return "";
  }
}