import express, { Request, Response } from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

interface GeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface CitySearchResult {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

interface OutfitRequestBody {
  weather: {
    temp_c: number;
    temp_f: number;
    condition: { text: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
    precip_mm: number;
  };
  location: string;
}

// Helpers
const kelvinToCelsius = (k: number) => Math.round(k - 273.15);
const celsiusToFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);
const msToKph = (ms: number) => Math.round(ms * 3.6);

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev
      "https://weather-ai-forecast-assistent.vercel.app", // production
      "https://weather-ai-forecast-assistent-git-feature-r671hs-projects.vercel.app/",
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// GET /api/search?q=Ber
app.get("/api/search", async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    res.json([]);
    return;
  }
  try {
    const result = await axios.get<GeoResult[]>(
      "https://api.openweathermap.org/geo/1.0/direct",
      {
        params: {
          q: q.trim(),
          limit: 6,
          appid: OPENWEATHER_API_KEY,
        },
      }
    );

    const cities: CitySearchResult[] = result.data.map((item) => ({
      name: item.name,
      region: item.state ?? "",
      country: item.country,
      lat: item.lat,
      lon: item.lon,
    }));

    res.json(cities);
  } catch {
    res.json([]);
  }
});

// GET /api/weather?city=Berlin  OR  /api/weather?lat=52.52&lon=13.41
app.get("/api/weather", async (req: Request, res: Response): Promise<void> => {
  const { city, lat: rawLat, lon: rawLon } = req.query;

  let lat: number;
  let lon: number;
  let resolvedCity = "";

  try {
    if (rawLat && rawLon) {
      lat = parseFloat(rawLat as string);
      lon = parseFloat(rawLon as string);

      const geoRes = await axios.get<GeoResult[]>(
        "https://api.openweathermap.org/geo/1.0/reverse",
        { params: { lat, lon, limit: 1, appid: OPENWEATHER_API_KEY } }
      );
      resolvedCity = geoRes.data[0]
        ? `${geoRes.data[0].name}, ${geoRes.data[0].country}`
        : `${lat}, ${lon}`;
    } else if (city && typeof city === "string") {
      // Resolve city name → coordinates via Geocoding API
      const geoRes = await axios.get<GeoResult[]>(
        "https://api.openweathermap.org/geo/1.0/direct",
        { params: { q: city, limit: 1, appid: OPENWEATHER_API_KEY } }
      );

      if (!geoRes.data.length) {
        res.status(404).json({ error: "City not found" });
        return;
      }

      lat = geoRes.data[0].lat;
      lon = geoRes.data[0].lon;
      resolvedCity = `${geoRes.data[0].name}, ${geoRes.data[0].country}`;
    } else {
      res.status(400).json({ error: "Provide city name or lat/lon coordinates" });
      return;
    }

    const commonParams = { lat, lon, appid: OPENWEATHER_API_KEY };

    const [currentRes, forecastRes] = await Promise.all([
      axios.get("https://api.openweathermap.org/data/2.5/weather", { params: commonParams }),
      axios.get("https://api.openweathermap.org/data/2.5/forecast", {
        params: { ...commonParams, cnt: 40 }, // 40 × 3h = ~5 days
      }),
    ]);

    const cur = currentRes.data;
    const temp_c = kelvinToCelsius(cur.main.temp);
    const feelslike_c = kelvinToCelsius(cur.main.feels_like);

    // Group the 3-hour forecast slots by calendar date
    const slotsByDate: Record<string, any[]> = {};
    for (const slot of forecastRes.data.list as any[]) {
      const date: string = new Date(slot.dt * 1000).toISOString().split("T")[0];
      if (!slotsByDate[date]) slotsByDate[date] = [];
      slotsByDate[date].push(slot);
    }

    const forecastday = Object.entries(slotsByDate)
      .slice(0, 5)
      .map(([date, slots]) => {
        const temps = slots.map((s: any) => kelvinToCelsius(s.main.temp));
        const maxC = Math.max(...temps);
        const minC = Math.min(...temps);
        const midSlot =
          slots.find((s: any) => new Date(s.dt * 1000).getUTCHours() === 12) ?? slots[0];
        const totalRain = slots.reduce(
          (sum: number, s: any) => sum + (s.rain?.["3h"] ?? 0),
          0
        );
        const avgPop = Math.round(
          (slots.reduce((sum: number, s: any) => sum + (s.pop ?? 0), 0) / slots.length) * 100
        );
        const avgHumidity = Math.round(
          slots.reduce((sum: number, s: any) => sum + s.main.humidity, 0) / slots.length
        );
        const avgWindKph = Math.round(
          slots.reduce((sum: number, s: any) => sum + msToKph(s.wind.speed), 0) / slots.length
        );

        return {
          date,
          day: {
            maxtemp_c: maxC,
            maxtemp_f: celsiusToFahrenheit(maxC),
            mintemp_c: minC,
            mintemp_f: celsiusToFahrenheit(minC),
            avgtemp_c: Math.round((maxC + minC) / 2),
            condition: {
              text: midSlot.weather[0]?.description ?? "",
              icon: `https://openweathermap.org/img/wn/${midSlot.weather[0]?.icon}@2x.png`,
              code: midSlot.weather[0]?.id ?? 0,
            },
            daily_chance_of_rain: avgPop,
            totalprecip_mm: Math.round(totalRain * 10) / 10,
            humidity: avgHumidity,
            wind_kph: avgWindKph,
          },
        };
      });

    const normalized = {
      location: {
        name: resolvedCity,
        lat,
        lon,
        localtime: new Date(cur.dt * 1000).toISOString(),
        timezone: cur.timezone, // offset in seconds
      },
      current: {
        temp_c,
        temp_f: celsiusToFahrenheit(temp_c),
        feelslike_c,
        feelslike_f: celsiusToFahrenheit(feelslike_c),
        condition: {
          text: cur.weather[0]?.description ?? "",
          icon: `https://openweathermap.org/img/wn/${cur.weather[0]?.icon}@2x.png`,
          code: cur.weather[0]?.id ?? 0,
        },
        humidity: cur.main.humidity,
        wind_kph: msToKph(cur.wind.speed),
        wind_dir: cur.wind.deg,
        pressure_mb: cur.main.pressure,
        precip_mm: cur.rain?.["1h"] ?? 0,
        cloud: cur.clouds.all,
        vis_km: (cur.visibility ?? 0) / 1000,
      },
      forecast: { forecastday },
    };

    res.json(normalized);
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status ?? 500;
    const message = axiosErr.response?.data?.message ?? "Weather API error";
    res.status(status).json({ error: message });
  }
});

// POST /api/outfit-advice
app.post(
  "/api/outfit-advice",
  async (req: Request<{}, {}, OutfitRequestBody>, res: Response): Promise<void> => {
    const { weather, location } = req.body;

    if (!weather || !location) {
      res.status(400).json({ error: "Weather data and location required" });
      return;
    }

    const { temp_c, temp_f, condition, humidity, wind_kph, feelslike_c, precip_mm } =
      weather;

    const prompt = `You are a friendly, witty personal stylist AI assistant. Based on today's weather in ${location}, give outfit advice.

Weather conditions:
- Temperature: ${temp_c}°C (feels like ${feelslike_c}°C)
- Condition: ${condition.text}
- Humidity: ${humidity}%
- Wind: ${wind_kph} km/h
- Precipitation: ${precip_mm}mm

Give a short, fun, and practical outfit recommendation in 3-4 sentences. Be specific about clothing items.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      res.json({ advice: text });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Gemini error name:", error.name);
        console.error("Gemini error message:", error.message);
        console.error("Gemini error details:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: "AI advice generation failed" });
      } else {
        console.error("Unknown error:", error);
        res.status(500).json({ error: "AI advice generation failed" });
      }
    }
  }
);

const PORT = Number(process.env.PORT ?? 4000);

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));