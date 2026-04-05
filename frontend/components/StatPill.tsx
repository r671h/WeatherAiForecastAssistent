interface StatPillProps {
  icon: string;
  label: string;
  value: string;
}

export default function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-white/40 text-xs font-body uppercase tracking-wider">{label}</p>
        <p className="text-white font-semibold text-sm font-body">{value}</p>
      </div>
    </div>
  );
}
