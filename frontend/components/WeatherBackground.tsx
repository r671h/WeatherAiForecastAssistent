interface WeatherBackgroundProps {
  code: number;
  isDay: boolean;
}

export default function WeatherBackground({ code, isDay }: WeatherBackgroundProps) {
  const getColors = (): [string, string, string] => {
    if (!isDay) return ["#1a1a4e", "#0d0d2b", "#2d1b69"];
    if (code === 1000) return ["#FF6B35", "#FFE66D", "#F7931E"];
    if (code === 1003) return ["#667eea", "#764ba2", "#f093fb"];
    if ([1006, 1009].includes(code)) return ["#4a5568", "#718096", "#a0aec0"];
    if ([1063,1180,1183,1186,1189,1192,1195,1240,1243,1246,1150,1153].includes(code))
      return ["#1e40af", "#3b82f6", "#0ea5e9"];
    if ([1066,1114,1117,1210,1213,1216,1219,1222,1225].includes(code))
      return ["#bae6fd", "#e0f2fe", "#f0f9ff"];
    if ([1087,1273,1276,1279,1282].includes(code))
      return ["#1e1b4b", "#312e81", "#4c1d95"];
    return ["#1e3a5f", "#0f4c75", "#1b6ca8"];
  };

  const [c1, c2, c3] = getColors();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      <div
        className="absolute rounded-full animate-pulse-slow"
        style={{ width: "60vw", height: "60vw", top: "-20vw", left: "-15vw", background: c1, opacity: 0.3, filter: "blur(80px)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ width: "50vw", height: "50vw", bottom: "-15vw", right: "-10vw", background: c2, opacity: 0.25, filter: "blur(70px)", animation: "pulse 6s cubic-bezier(0.4,0,0.6,1) infinite 2s" }}
      />
      <div
        className="absolute rounded-full"
        style={{ width: "30vw", height: "30vw", top: "40%", left: "40%", background: c3, opacity: 0.2, filter: "blur(60px)", animation: "pulse 8s cubic-bezier(0.4,0,0.6,1) infinite 1s" }}
      />
    </div>
  );
}
