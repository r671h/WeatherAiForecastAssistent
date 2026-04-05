interface WeatherIconProps {
  code: number;
  isDay: boolean;
  size?: number;
  className?: string;
}

const RAIN_CODES = [1063,1180,1183,1186,1189,1192,1195,1240,1243,1246,1150,1153,1168,1171];
const SNOW_CODES = [1066,1114,1117,1210,1213,1216,1219,1222,1225,1255,1258];
const THUNDER_CODES = [1087,1273,1276,1279,1282];
const FOG_CODES = [1030,1135,1147];

export default function WeatherIcon({ code, isDay, size = 80, className = "" }: WeatherIconProps) {
  const s = size;

  if (isDay && code === 1000) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <circle cx="40" cy="40" r="16" fill="#FFE66D" />
        {([0,45,90,135,180,225,270,315] as number[]).map((deg, i) => (
          <line key={i} x1="40" y1="8" x2="40" y2="14" stroke="#FFE66D" strokeWidth="3" strokeLinecap="round" transform={`rotate(${deg} 40 40)`} />
        ))}
      </svg>
    );
  }

  if (!isDay && code === 1000) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <path d="M52 44C44 44 36 36 36 28C36 22 39 17 44 14C34 14 26 22 26 32C26 43 35 52 46 52C54 52 61 47 64 40C60 42 56 44 52 44Z" fill="#C7D2FE"/>
        <circle cx="62" cy="18" r="2" fill="#E0E7FF" opacity="0.8"/>
        <circle cx="18" cy="26" r="1.5" fill="#E0E7FF" opacity="0.6"/>
        <circle cx="58" cy="58" r="1" fill="#E0E7FF" opacity="0.5"/>
      </svg>
    );
  }

  if (code === 1003) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        {isDay && <circle cx="28" cy="28" r="12" fill="#FFE66D" />}
        {isDay && ([0,60,120,180,240,300] as number[]).map((deg, i) => (
          <line key={i} x1="28" y1="10" x2="28" y2="14" stroke="#FFE66D" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${deg} 28 28)`} />
        ))}
        <ellipse cx="46" cy="50" rx="22" ry="14" fill="#E2E8F0"/>
        <ellipse cx="36" cy="48" rx="14" ry="10" fill="#F1F5F9"/>
        <ellipse cx="52" cy="46" rx="12" ry="9" fill="#F8FAFC"/>
      </svg>
    );
  }

  if (code === 1006 || code === 1009) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <ellipse cx="40" cy="46" rx="28" ry="16" fill="#94A3B8"/>
        <ellipse cx="30" cy="42" rx="18" ry="12" fill="#CBD5E1"/>
        <ellipse cx="50" cy="40" rx="16" ry="12" fill="#E2E8F0"/>
        <ellipse cx="40" cy="38" rx="20" ry="10" fill="#F1F5F9"/>
      </svg>
    );
  }

  if (RAIN_CODES.includes(code)) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <ellipse cx="40" cy="32" rx="24" ry="14" fill="#94A3B8"/>
        <ellipse cx="30" cy="28" rx="16" ry="10" fill="#CBD5E1"/>
        <ellipse cx="50" cy="26" rx="14" ry="10" fill="#E2E8F0"/>
        {([[28,52,32,64],[40,54,44,66],[52,52,56,64],[34,62,38,70]] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"/>
        ))}
      </svg>
    );
  }

  if (SNOW_CODES.includes(code)) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <ellipse cx="40" cy="30" rx="24" ry="14" fill="#CBD5E1"/>
        <ellipse cx="30" cy="26" rx="16" ry="10" fill="#E2E8F0"/>
        {([[28,50,28,66],[40,48,40,68],[52,50,52,66]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round"/>
            <line x1={x1-4} y1={(y1+y2)/2-2} x2={x1+4} y2={(y1+y2)/2+2} stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round"/>
            <line x1={x1-4} y1={(y1+y2)/2+2} x2={x1+4} y2={(y1+y2)/2-2} stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round"/>
          </g>
        ))}
      </svg>
    );
  }

  if (THUNDER_CODES.includes(code)) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        <ellipse cx="40" cy="28" rx="26" ry="15" fill="#475569"/>
        <ellipse cx="30" cy="24" rx="17" ry="11" fill="#64748B"/>
        <polygon points="44,40 36,55 42,55 36,70 52,50 44,50" fill="#FCD34D"/>
      </svg>
    );
  }

  if (FOG_CODES.includes(code)) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
        {([[20,28,60,28],[14,38,66,38],[18,48,62,48],[22,58,58,58]] as [number,number,number,number][]).map(([x1,y,x2], i) => (
          <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity={1 - i * 0.15}/>
        ))}
      </svg>
    );
  }

  return (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none" className={className}>
      <ellipse cx="40" cy="44" rx="26" ry="16" fill="#94A3B8"/>
      <ellipse cx="30" cy="40" rx="17" ry="12" fill="#CBD5E1"/>
      <ellipse cx="50" cy="38" rx="15" ry="11" fill="#E2E8F0"/>
    </svg>
  );
}
