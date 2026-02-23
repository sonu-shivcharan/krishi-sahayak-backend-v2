import { tool } from "langchain";
import z from "zod";
import axios from "axios";
import { geocode } from "../utils/location";

export const getWeather = tool(
  async ({ location, lat, lng }) => {
    try {
      let latitude = lat;
      let longitude = lng;

      // 1. Get coordinates if not provided
      if (!latitude || !longitude) {
        if (!location) {
          return "Please provide a location name or coordinates.";
        }
        const coords = await geocode(location);
        latitude = coords.lat;
        longitude = coords.lng;
      }

      if (!latitude || !longitude) {
        return `Could not find coordinates for "${location}". Please provide a more specific location.`;
      }

      // 2. Fetch weather from Open-Meteo
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
      );

      const current = response.data.current;
      const daily = response.data.daily;

      // Weather codes interpretation (simplified)
      const weatherCodes: Record<number, string> = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        95: "Thunderstorm",
      };

      const condition =
        weatherCodes[current.weather_code] || "Unknown condition";

      const locationName = location ? location : `coordinates (${latitude}, ${longitude})`;

      return `Weather in ${locationName}:
- Condition: ${condition}
- Temperature: ${current.temperature_2m}°C
- Humidity: ${current.relative_humidity_2m}%
- Wind Speed: ${current.wind_speed_10m} km/h
- Forecast (Today): High: ${daily.temperature_2m_max[0]}°C, Low: ${daily.temperature_2m_min[0]}°C, Rain Chance: ${daily.precipitation_probability_max[0]}%`;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return "Sorry, I encountered an error while fetching the weather information.";
    }
  },
  {
    name: "getWeather",
    description:
      "Get current weather and forecast. You can provide a location string OR latitude/longitude coordinates.",
    schema: z.object({
      location: z
        .string()
        .optional()
        .describe("The city, town, or village name (e.g., 'Pune', 'Nashik')"),
      lat: z.number().optional().describe("Latitude of the location"),
      lng: z.number().optional().describe("Longitude of the location"),
    }),
  },
);
