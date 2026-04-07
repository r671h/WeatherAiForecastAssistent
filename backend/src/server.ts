import express, { Request, Response } from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

interface CitySearchResult {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

interface OutfitRequestBody {
  weather: {
    temp_c: number;
    temp_f: number;
    condition: { code: number; text: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
    precip_mm: number;
    uv: number;
  };
  location: string;
}

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev
      "https://weather-ai-forecast-assistent.vercel.app", // production
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// GET /api/search?q=Ber
app.get("/api/search", async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    res.json([]);
    return;
  }
  try {
    const result = await axios.get<CitySearchResult[]>(
      "https://api.weatherapi.com/v1/search.json",
      { params: { key: WEATHER_API_KEY, q: q.trim() } }
    );
    res.json(result.data.slice(0, 6));
  } catch {
    res.json([]);
  }
});

// GET /api/weather?city=Berlin
app.get("/api/weather", async (req: Request, res: Response): Promise<void> => {
  const { city } = req.query;
  if (!city || typeof city !== "string") {
    res.status(400).json({ error: "City is required" });
    return;
  }
  try {
    const weatherRes = await axios.get(
      "https://api.weatherapi.com/v1/forecast.json",
      {
        params: { key: WEATHER_API_KEY, q: city, days: 5, aqi: "no", alerts: "no" },
      }
    );
    res.json(weatherRes.data);
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
    const status = axiosErr.response?.status ?? 500;
    const message = axiosErr.response?.data?.error?.message ?? "Weather API error";
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

    const { temp_c, temp_f, condition, humidity, wind_kph, feelslike_c, precip_mm, uv } = weather;

    const prompt = `You are a friendly, witty personal stylist AI assistant. Based on today's weather in ${location}, give outfit advice.

Weather conditions:
- Temperature: ${temp_c}°C / ${temp_f}°F (feels like ${feelslike_c}°C)
- Condition: ${condition.text}
- Humidity: ${humidity}%
- Wind: ${wind_kph} km/h
- Precipitation: ${precip_mm}mm
- UV Index: ${uv}

Give a short, fun, and practical outfit recommendation in 3-4 sentences. Be specific about clothing items.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      res.json({ advice: text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI advice generation failed" });
    }
  }
);

const PORT = Number(process.env.PORT ?? 4000);
// Global error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));