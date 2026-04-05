import { useState, useCallback } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import WeatherIcon from "../components/WeatherIcon";
import WeatherBackground from "../components/WeatherBackground";
import ForecastCard from "../components/ForecastCard";
import OutfitAdvisor from "../components/OutfitAdvisor";
import StatPill from "../components/StatPill";
import { WeatherResponse, ApiError } from "../types/weather";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

function getTimeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

const Home: NextPage = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchWeather = useCallback(async (searchCity: string): Promise<void> => {
    if (!searchCity.trim()) return;
    setLoading(true);
    setError("");
    setWeather(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(searchCity)}`);
      const data: WeatherResponse | ApiError = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Failed to fetch weather");
      }
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    fetchWeather(inputValue);
  };

  const current = weather?.current;
  const location = weather?.location;
  const forecast = weather?.forecast?.forecastday;
  const isDay = current?.is_day === 1;

  return (
    <>
      <Head>
        <title>SkyDress — Weather & Style</title>
        <meta name="description" content="Weather forecast with AI outfit advice" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌤️</text></svg>" />
      </Head>

      <WeatherBackground code={current?.condition?.code ?? 1000} isDay={isDay ?? true} />

      <main className="relative min-h-screen flex flex-col items-center px-4 py-8 md:py-12" style={{ zIndex: 1 }}>
        {/* Header */}
        <header className="w-full max-w-2xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌤️</span>
            <span className="font-display font-bold text-white/90 tracking-tight" style={{ fontSize: 20 }}>SkyDress</span>
          </div>
          {weather && (
            <span className="text-white/40 text-sm font-body">
              {getTimeOfDayLabel()} · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
        </header>

        {/* Search */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
          <div className="relative flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" style={{ fontSize: 18 }}>🔍</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                placeholder="Search city (e.g. Berlin, Tokyo, New York…)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl font-body text-sm text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-white/20"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-6 py-4 rounded-2xl font-semibold text-sm font-body transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FF6B6B, #FFE66D)", color: loading ? "rgba(255,255,255,0.5)" : "#0A0A0F", border: "none" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Searching
                </span>
              ) : "Search"}
            </button>
          </div>
          {error && (
            <div className="mt-3 px-4 py-3 rounded-xl text-sm font-body" style={{ background: "rgba(255, 100, 100, 0.1)", border: "1px solid rgba(255, 100, 100, 0.2)", color: "#FCA5A5" }}>
              ⚠️ {error}
            </div>
          )}
        </form>

        {/* Empty state */}
        {!weather && !loading && (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
            <div className="animate-float mb-6">
              <svg width="100" height="100" viewBox="0 0 80 80" fill="none">
                <circle cx="28" cy="26" r="14" fill="#FFE66D" opacity="0.9" />
                {([0,60,120,180,240,300] as number[]).map((deg, i) => (
                  <line key={i} x1="28" y1="6" x2="28" y2="11" stroke="#FFE66D" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${deg} 28 26)`} />
                ))}
                <ellipse cx="50" cy="52" rx="24" ry="15" fill="#94A3B8" opacity="0.7"/>
                <ellipse cx="40" cy="48" rx="17" ry="12" fill="#CBD5E1" opacity="0.8"/>
                <ellipse cx="54" cy="46" rx="14" ry="11" fill="#E2E8F0" opacity="0.9"/>
              </svg>
            </div>
            <h1 className="font-display font-bold mb-3 text-gradient" style={{ fontSize: 32, lineHeight: 1.2 }}>Weather meets style.</h1>
            <p className="text-white/40 text-base font-body max-w-xs leading-relaxed">Search any city to get today's forecast and AI-powered outfit recommendations.</p>
            <div className="flex gap-3 mt-8 flex-wrap justify-center">
              {(["New York", "Tokyo", "Paris", "Sydney"] as string[]).map((c) => (
                <button key={c} onClick={() => { setInputValue(c); fetchWeather(c); }}
                  className="px-4 py-2 rounded-full text-sm font-body text-white/60 hover:text-white/90 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weather data */}
        {weather && current && location && (
          <div className="w-full max-w-2xl space-y-4">
            {/* Main card */}
            <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/60 text-base font-body">📍 {location.name}</span>
                    <span className="text-white/30 text-sm font-body">{location.country}</span>
                  </div>
                  <div className="font-display font-bold text-white" style={{ fontSize: 72, lineHeight: 1, letterSpacing: "-3px" }}>
                    {Math.round(current.temp_c)}
                    <span className="font-display font-light text-white/40" style={{ fontSize: 36 }}>°C</span>
                  </div>
                  <p className="text-white/60 text-base font-body mt-1">{current.condition.text}</p>
                  <p className="text-white/30 text-sm font-body">Feels like {Math.round(current.feelslike_c)}°C</p>
                </div>
                <div className="animate-float">
                  <WeatherIcon code={current.condition.code} isDay={isDay ?? true} size={100} />
                </div>
              </div>
              {forecast?.[0] && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                  <span className="text-sm font-body text-white/50">H: <span className="text-white/80">{Math.round(forecast[0].day.maxtemp_c)}°</span></span>
                  <span className="text-sm font-body text-white/50">L: <span className="text-white/80">{Math.round(forecast[0].day.mintemp_c)}°</span></span>
                  <span className="text-sm font-body text-white/50">Rain: <span className="text-white/80">{forecast[0].day.daily_chance_of_rain}%</span></span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill icon="💧" label="Humidity" value={`${current.humidity}%`} />
              <StatPill icon="💨" label="Wind" value={`${Math.round(current.wind_kph)} km/h`} />
              <StatPill icon="☀️" label="UV Index" value={String(current.uv ?? "—")} />
              <StatPill icon="👁️" label="Visibility" value={`${current.vis_km} km`} />
            </div>

            {/* AI Advisor */}
            <OutfitAdvisor
              weather={{ temp_c: current.temp_c, temp_f: current.temp_f, condition: current.condition, humidity: current.humidity, wind_kph: current.wind_kph, feelslike_c: current.feelslike_c, precip_mm: current.precip_mm, uv: current.uv }}
              location={`${location.name}, ${location.country}`}
            />

            {/* Forecast */}
            {forecast && (
              <div>
                <h2 className="font-display font-semibold text-white/60 uppercase tracking-widest mb-3" style={{ fontSize: 11 }}>5-Day Forecast</h2>
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, i) => <ForecastCard key={day.date} day={day} index={i} />)}
                </div>
              </div>
            )}

            {/* Hourly */}
            {forecast?.[0]?.hour && (
              <div>
                <h2 className="font-display font-semibold text-white/60 uppercase tracking-widest mb-3" style={{ fontSize: 11 }}>Hourly</h2>
                <div className="glass rounded-2xl p-4 overflow-x-auto">
                  <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                    {forecast[0].hour.filter((_, i) => i % 3 === 0).map((hour) => {
                      const time = new Date(hour.time);
                      const h = time.getHours();
                      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
                      return (
                        <div key={hour.time} className="flex flex-col items-center gap-2" style={{ minWidth: 48 }}>
                          <span className="text-xs text-white/40 font-body">{label}</span>
                          <WeatherIcon code={hour.condition.code} isDay={h >= 6 && h < 20} size={28} />
                          <span className="text-sm font-semibold text-white font-body">{Math.round(hour.temp_c)}°</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-white/20 text-xs font-body pb-4">Data from WeatherAPI.com · AI advice by Claude</p>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
