import { fetchWeather, describeWeatherCode, getCurrentPosition } from "../../utils/weather";

export const weatherToolDeclaration = {
  name: "get_current_weather",
  description: "Get the current weather (temperature, condition, sunrise/sunset) at the user's current location. Use this for any question about weather, temperature, or whether it will rain.",
  parameters: { type: "OBJECT", properties: {} },
};

export async function getCurrentWeather() {
  try {
    const { lat, lon } = await getCurrentPosition();
    const data = await fetchWeather(lat, lon);
    const desc = describeWeatherCode(data.code);
    return {
      temperatureCelsius: data.tempC,
      condition: desc.label,
      sunrise: data.sunrise,
      sunset: data.sunset,
    };
  } catch (err) {
    // Tools must fail loudly to the model, not silently invent data —
    // this becomes visible context the model can honestly relay
    // ("I couldn't get your location") instead of guessing weather.
    return { error: "Could not determine location or reach the weather service. Location permission may be denied." };
  }
}