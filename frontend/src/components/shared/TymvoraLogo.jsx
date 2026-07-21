export function TymvoraLogo({
  className = "",
  showText = true,
  textClassName = "",
  markClassName = "",
  subtitle = "Smart Workforce Platform",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className={`relative flex-shrink-0 ${markClassName}`.trim()}>
        <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Tymvora logo">
          <rect x="6" y="6" width="68" height="68" rx="20" fill="url(#tymvoraGradient)" />
          <path d="M24 24H56" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M38 24V56" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M26 56H54" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <circle cx="58" cy="24" r="8" fill="#34D399" />
          <defs>
            <linearGradient id="tymvoraGradient" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <div className="min-w-0">
          <h1 className={`text-lg font-semibold tracking-tight ${textClassName || "text-white"}`.trim()}>Tymvora</h1>
          {subtitle ? (
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
