const checks = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Special char", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const levels = [
  { label: "Too weak", color: "#EF4444" },
  { label: "Weak",     color: "#F97316" },
  { label: "Fair",     color: "#EAB308" },
  { label: "Good",     color: "#84CC16" },
  { label: "Strong",   color: "#22C55E" },
];

export function PasswordStrengthBar({ password }) {
  if (!password) return null;
  const passed = checks.filter((c) => c.test(password)).length;
  const level = levels[passed] ?? levels[4];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? level.color : "var(--surface-2, #E2E8F0)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: level.color }}>{level.label}</p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-end">
          {checks.map((c) => (
            <span
              key={c.label}
              className="text-[10px]"
              style={{ color: c.test(password) ? "#22C55E" : "var(--tx-3, #94A3B8)" }}
            >
              {c.test(password) ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
