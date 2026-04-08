import { useState } from "react";
import { OutfitAdviceRequest, OutfitAdviceResponse, ApiError } from "../types/weather";

type OutfitAdvisorProps = OutfitAdviceRequest;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export default function OutfitAdvisor({ weather, location }: OutfitAdvisorProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [shown, setShown] = useState<boolean>(false);

  const getAdvice = async (): Promise<void> => {
    if (shown && advice) return;
    setLoading(true);
    setShown(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/outfit-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, location }),
      });
      const data: OutfitAdviceResponse | ApiError = await res.json();
      if ("error" in data) throw new Error(data.error);
      setAdvice(data.advice);
    } catch (e : any){
      setAdvice(e.message || "Failed to get advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (): void => {
    setAdvice("");
    setShown(false);
    setTimeout(getAdvice, 50);
  };

  return (
    <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)" }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B6B, #FFE66D)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L10.8 7H16L11.6 10L13.4 15L9 12L4.6 15L6.4 10L2 7H7.2L9 2Z" fill="#0A0A0F"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white font-display" style={{ fontSize: 16 }}>AI Style Assistant</h3>
            <p className="text-white/50 text-xs font-body">Powered by Gemini</p>
          </div>
        </div>

        {!shown ? (
          <button
            onClick={getAdvice}
            className="w-full py-3 px-6 rounded-2xl font-semibold text-sm font-body transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #FF6B6B, #FFE66D)", color: "#0A0A0F" }}
          >
            What should I wear today? ✨
          </button>
        ) : loading ? (
          <div className="space-y-2">
            {[100, 90, 75].map((w, i) => (
              <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite", animationDelay: `${i * 0.15}s` }} />
            ))}
            <p className="text-white/40 text-xs font-body mt-3">Checking your forecast...</p>
          </div>
        ) : (
          <div>
            <p className="text-white/90 text-sm leading-relaxed font-body">{advice}</p>
            <button onClick={handleRefresh} className="mt-4 text-xs text-white/40 hover:text-white/70 transition-colors font-body underline underline-offset-2">
              Refresh advice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
