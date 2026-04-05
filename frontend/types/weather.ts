export interface WeatherCondition {
  code: number;
  text: string;
  icon: string;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  feelslike_c: number;
  feelslike_f: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  precip_mm: number;
  vis_km: number;
  uv: number;
  is_day: number;
  condition: WeatherCondition;
}

export interface ForecastDay {
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  daily_chance_of_rain: number;
  daily_chance_of_snow: number;
  condition: WeatherCondition;
}

export interface HourWeather {
  time: string;
  temp_c: number;
  feelslike_c: number;
  chance_of_rain: number;
  condition: WeatherCondition;
}

export interface ForecastDayEntry {
  date: string;
  day: ForecastDay;
  hour: HourWeather[];
}

export interface Forecast {
  forecastday: ForecastDayEntry[];
}

export interface Location {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface WeatherResponse {
  location: Location;
  current: CurrentWeather;
  forecast: Forecast;
}

export interface OutfitAdviceRequest {
  weather: {
    temp_c: number;
    temp_f: number;
    condition: WeatherCondition;
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
    precip_mm: number;
    uv: number;
  };
  location: string;
}

export interface OutfitAdviceResponse {
  advice: string;
}

export interface ApiError {
  error: string;
}
