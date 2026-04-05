import WeatherIcon from "./WeatherIcon";
import { ForecastDayEntry } from "../types/weather";

interface ForecastCardProps {
  day: ForecastDayEntry;
  index: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function ForecastCard({ day, index }: ForecastCardProps) {
  const date = new Date(day.date);
  const dayName = index === 0 ? "Today" : DAYS[date.getDay()];
  const code = day.day.condition.code;
  const maxC = Math.round(day.day.maxtemp_c);
  const minC = Math.round(day.day.mintemp_c);
  const rainChance = day.day.daily_chance_of_rain;

  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:bg-white/10 cursor-default" style={{ minWidth: 0 }}>
      <span className="text-sm font-medium text-white/60 font-body">{dayName}</span>
      <WeatherIcon code={code} isDay={true} size={44} />
      <div className="flex gap-2 items-baseline">
        <span className="text-base font-semibold text-white font-body">{maxC}°</span>
        <span className="text-sm text-white/40 font-body">{minC}°</span>
      </div>
      {rainChance > 20 && (
        <div className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1C5 1 2 5 2 6.5C2 8 3.3 9 5 9C6.7 9 8 8 8 6.5C8 5 5 1 5 1Z" fill="#60A5FA"/>
          </svg>
          <span className="text-xs text-blue-300/80 font-body">{rainChance}%</span>
        </div>
      )}
    </div>
  );
}
