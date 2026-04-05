import 'dotenv/config';
import express, { Request, Response } from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        params: {
          key: WEATHER_API_KEY,
          q: city,
          days: 5,
          aqi: "no",
          alerts: "no",
        },
      }
    );
    res.json(weatherRes.data);
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
    const status = axiosErr.response?.status ?? 500;
    const message =
      axiosErr.response?.data?.error?.message ?? "Weather API error";
    res.status(status).json({ error: message });
  }
});

app.post(
  "/api/outfit-advice",
  async (req: Request<{}, {}, OutfitRequestBody>, res: Response): Promise<void> => {
    const { weather, location } = req.body;

    if (!weather || !location) {
      res.status(400).json({ error: "Weather data and location required" });
      return;
    }

    const {
      temp_c,
      temp_f,
      condition,
      humidity,
      wind_kph,
      feelslike_c,
      precip_mm,
      uv,
    } = weather;

    const prompt = `You are a friendly, witty personal stylist AI assistant. Based on today's weather in ${location}, give short outfit advice.

Weather conditions:
- Temperature: ${temp_c}°C / ${temp_f}°F (feels like ${feelslike_c}°C)
- Condition: ${condition.text}
- Humidity: ${humidity}%
- Wind: ${wind_kph} km/h
- Precipitation: ${precip_mm}mm
- UV Index: ${uv}

Give a short, fun, and practical outfit recommendation in 2-3 sentences. Be specific about clothing items (e.g. "a light denim jacket", "waterproof sneakers", "UV-protective sunglasses"). Mention any accessories needed. Keep it casual, warm, and helpful. Start directly with the advice — no greeting needed.`;

    try {
      const result = await model.generateContent(prompt);
      const advice = result.response.text();

      if (!advice) {
        throw new Error("No response from Gemini");
      }

      res.json({ advice });
    } catch (err) {
      console.error("Gemini error:", err);
      const message = err instanceof Error ? err.message : "AI advice generation failed";
      res.status(500).json({ error: message });
    }
  }
);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));