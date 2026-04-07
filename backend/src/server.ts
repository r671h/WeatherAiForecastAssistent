import express, { Request, Response } from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import Anthropic from "@anthropic-ai/sdk";

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

app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.FRONTEND_URL ?? "",
  ].filter(Boolean),
}));
app.use(express.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

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

Give a short, fun, and practical outfit recommendation in 3-4 sentences. Be specific about clothing items (e.g. "a light denim jacket", "waterproof sneakers", "UV-protective sunglasses"). Mention any accessories needed. Keep it casual, warm, and helpful. Start directly with the advice — no greeting needed.`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = message.content[0];
      if (textBlock.type !== "text") throw new Error("Unexpected response type");
      res.json({ advice: textBlock.text });
    } catch {
      res.status(500).json({ error: "AI advice generation failed" });
    }
  }
);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));