import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, Sun, Moon, Monitor, Plus, X, FileText,
  Upload, Trash2, Check, Briefcase, Phone, Mail, MapPin,
  Star, Award, Clock, Calendar, ChevronRight, ChevronDown, Edit3, Save,
  Link2, Github, Globe, Bell, Shield, Search,
  Lock, Eye, EyeOff, Zap, TrendingUp, Target,
  Languages, Palette, Layout,
  Download, BookOpen, AlertCircle, Hash,
  Activity, CheckCircle, BarChart2, RefreshCw, Key, MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useProfileStore, DEFAULT_PROFILE } from "@/store/profile.store";

/* ─── tabs ────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",    label: "Overview",      icon: User },
  { id: "edit",        label: "Edit Profile",  icon: Edit3 },
  { id: "skills",      label: "Skills",        icon: Star },
  { id: "appearance",  label: "Appearance",    icon: Palette },
  { id: "documents",   label: "Documents",     icon: FileText },
  { id: "security",    label: "Security",      icon: Shield },
  { id: "preferences", label: "Preferences",   icon: Zap },
];

/* ─── CSS-var-based style objects ─────────────────────────────── */
const S = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    boxShadow: "var(--card-shadow)",
  },
  cardHeader: {
    background: "var(--surface-2)",
    borderBottom: "1px solid var(--surface-border)",
  },
  input: (focused) => ({
    background: focused ? "var(--surface-3)" : "var(--surface-2)",
    border: focused ? "1px solid #2563EB" : "1px solid var(--inp-border)",
    boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
    color: "var(--tx-1)",
  }),
  textarea: {
    background: "var(--surface-2)",
    border: "1px solid var(--inp-border)",
    color: "var(--tx-1)",
  },
  select: {
    background: "var(--surface-2)",
    border: "1px solid var(--inp-border)",
    color: "var(--tx-1)",
  },
  fieldLabel: { color: "var(--tx-3)" },
  fieldValue: { color: "var(--tx-1)" },
  mutedText: { color: "var(--tx-2)" },
  pill: {
    background: "rgba(37,99,235,0.1)",
    border: "1px solid rgba(37,99,235,0.2)",
    color: "#2563EB",
  },
  subRow: {
    background: "var(--surface-2)",
    border: "1px solid var(--surface-border)",
  },
  infoBox: (color) => ({
    background: `${color}11`,
    border: `1px solid ${color}28`,
  }),
};

/* ─── Helpers ──────────────────────────────────────────────────── */
function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ ...S.card, ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, action, accent = "#2563EB" }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between" style={S.cardHeader}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}18` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={S.fieldValue}>{title}</p>
          {subtitle && <p className="text-[10px] mt-0.5" style={S.fieldLabel}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function FLabel({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={S.fieldLabel}>{children}</p>;
}

function FValue({ children }) {
  return (
    <p className="text-sm font-medium" style={S.fieldValue}>
      {children || <span className="italic" style={S.fieldLabel}>Not set</span>}
    </p>
  );
}

function ThemedInput({ value, onChange, placeholder, type = "text", prefix, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{prefix}</div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full py-2.5 rounded-xl text-sm focus:outline-none transition-all ${prefix ? "pl-10 pr-4" : "px-4"}`}
        style={S.input(focused)}
        {...rest}
      />
    </div>
  );
}

function ThemedSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
      style={S.select}
    >
      {children}
    </select>
  );
}

function ToggleSwitch({ checked, onChange, label, description }) {
  /* track: 48×26px  dot: 20×20px  padding: 3px each side
     off: dot left=3px  on: dot left=48-20-3=25px             */
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-0" style={{ borderColor: "var(--surface-border)" }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium" style={S.fieldValue}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={S.mutedText}>{description}</p>}
      </div>
      <motion.button
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.93 }}
        className="flex-shrink-0 relative rounded-full transition-colors duration-200"
        style={{
          width: 48,
          height: 26,
          background: checked
            ? "linear-gradient(135deg,#2563EB,#10B981)"
            : "var(--surface-3)",
          border: checked ? "none" : "1px solid var(--surface-border)",
        }}
        aria-checked={checked}
        role="switch"
      >
        <motion.span
          animate={{ x: checked ? 25 : 3 }}
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
          style={{
            position: "absolute",
            top: 3,
            left: 0,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: checked
              ? "0 2px 6px rgba(37,99,235,0.35)"
              : "0 1px 4px rgba(0,0,0,0.18)",
          }}
        />
      </motion.button>
    </div>
  );
}

function GradBtn({ onClick, children, color = "blue", small = false, type = "button" }) {
  const bg = {
    blue:   "linear-gradient(135deg,#2563EB,#1D4ED8)",
    green:  "linear-gradient(135deg,#10B981,#059669)",
    red:    "linear-gradient(135deg,#EF4444,#DC2626)",
    purple: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
  }[color] ?? "linear-gradient(135deg,#2563EB,#1D4ED8)";
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`flex items-center gap-1.5 rounded-xl font-semibold text-white ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
      style={{ background: bg, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Timezone → Cities mapping ──────────────────────────────────── */
const TIMEZONE_CITIES = {
  "Asia/Kolkata": [
    "Agra","Ahmedabad","Amritsar","Aurangabad","Bengaluru","Bhopal","Bhubaneswar",
    "Chandigarh","Chennai","Coimbatore","Dehradun","Delhi","Dhanbad","Faridabad",
    "Ghaziabad","Gurugram","Guwahati","Hyderabad","Indore","Jaipur","Jammu",
    "Jodhpur","Kanpur","Kochi","Kolkata","Kota","Lucknow","Ludhiana","Madurai",
    "Mangaluru","Meerut","Mumbai","Mysuru","Nagpur","Nashik","Navi Mumbai",
    "Noida","Patna","Pimpri-Chinchwad","Pune","Raipur","Rajkot","Ranchi",
    "Srinagar","Surat","Thane","Thiruvananthapuram","Udaipur","Vadodara",
    "Varanasi","Vijayawada","Visakhapatnam",
  ],
  "Asia/Karachi": [
    "Faisalabad","Hyderabad (PK)","Islamabad","Karachi","Lahore","Multan",
    "Peshawar","Quetta","Rawalpindi",
  ],
  "Asia/Dhaka": [
    "Chittagong","Dhaka","Khulna","Rajshahi","Sylhet",
  ],
  "Asia/Kathmandu": [
    "Biratnagar","Kathmandu","Lalitpur","Pokhara",
  ],
  "Asia/Colombo": [
    "Colombo","Kandy","Galle",
  ],
  "Asia/Kabul": [
    "Kabul","Kandahar","Mazar-i-Sharif",
  ],
  "Asia/Tehran": [
    "Ahvaz","Isfahan","Mashhad","Shiraz","Tabriz","Tehran",
  ],
  "Asia/Dubai": [
    "Abu Dhabi","Al Ain","Dubai","Riyadh","Sharjah",
  ],
  "Asia/Riyadh": [
    "Dammam","Jeddah","Mecca","Medina","Riyadh",
  ],
  "Asia/Baghdad": [
    "Baghdad","Basra","Erbil","Mosul",
  ],
  "Asia/Kuwait": [
    "Kuwait City",
  ],
  "Asia/Doha": [
    "Doha",
  ],
  "Asia/Bahrain": [
    "Manama",
  ],
  "Asia/Muscat": [
    "Muscat","Salalah",
  ],
  "Asia/Beirut": [
    "Beirut","Tripoli (LB)",
  ],
  "Asia/Jerusalem": [
    "Jerusalem","Tel Aviv",
  ],
  "Asia/Nicosia": [
    "Nicosia",
  ],
  "Asia/Almaty": [
    "Almaty","Astana","Bishkek","Tashkent",
  ],
  "Asia/Tashkent": [
    "Samarkand","Tashkent",
  ],
  "Asia/Baku": [
    "Baku",
  ],
  "Asia/Yerevan": [
    "Yerevan",
  ],
  "Asia/Tbilisi": [
    "Tbilisi",
  ],
  "Asia/Colombo_extra": [],
  "Asia/Yangon": [
    "Mandalay","Naypyidaw","Yangon",
  ],
  "Asia/Bangkok": [
    "Bangkok","Chiang Mai","Pattaya","Phnom Penh","Vientiane",
  ],
  "Asia/Ho_Chi_Minh": [
    "Da Nang","Hanoi","Ho Chi Minh City",
  ],
  "Asia/Jakarta": [
    "Bandung","Jakarta","Medan","Surabaya","Yogyakarta",
  ],
  "Asia/Singapore": [
    "Kuala Lumpur","Singapore",
  ],
  "Asia/Manila": [
    "Cebu","Davao","Manila",
  ],
  "Asia/Hong_Kong": [
    "Hong Kong",
  ],
  "Asia/Taipei": [
    "Kaohsiung","Taipei","Taichung",
  ],
  "Asia/Shanghai": [
    "Beijing","Chengdu","Chongqing","Guangzhou","Hangzhou","Nanjing",
    "Shanghai","Shenzhen","Tianjin","Wuhan","Xi'an",
  ],
  "Asia/Seoul": [
    "Busan","Incheon","Seoul",
  ],
  "Asia/Tokyo": [
    "Fukuoka","Kyoto","Nagoya","Osaka","Sapporo","Tokyo","Yokohama",
  ],
  "Australia/Sydney": [
    "Brisbane","Canberra","Melbourne","Newcastle","Sydney","Wollongong",
  ],
  "Australia/Adelaide": [
    "Adelaide",
  ],
  "Australia/Perth": [
    "Perth",
  ],
  "Pacific/Auckland": [
    "Auckland","Christchurch","Wellington",
  ],
  "Europe/London": [
    "Birmingham","Bristol","Edinburgh","Glasgow","Leeds","Liverpool",
    "London","Manchester","Newcastle upon Tyne","Nottingham","Sheffield",
  ],
  "Europe/Dublin": [
    "Cork","Dublin","Galway",
  ],
  "Europe/Lisbon": [
    "Lisbon","Porto",
  ],
  "Europe/Madrid": [
    "Barcelona","Bilbao","Madrid","Seville","Valencia","Zaragoza",
  ],
  "Europe/Paris": [
    "Bordeaux","Lyon","Marseille","Nantes","Nice","Paris","Strasbourg","Toulouse",
  ],
  "Europe/Brussels": [
    "Antwerp","Brussels","Ghent","Liège",
  ],
  "Europe/Amsterdam": [
    "Amsterdam","Rotterdam","The Hague","Utrecht",
  ],
  "Europe/Berlin": [
    "Berlin","Cologne","Düsseldorf","Frankfurt","Hamburg","Munich","Stuttgart",
  ],
  "Europe/Zurich": [
    "Basel","Bern","Geneva","Zurich",
  ],
  "Europe/Rome": [
    "Florence","Milan","Naples","Palermo","Rome","Turin","Venice",
  ],
  "Europe/Vienna": [
    "Graz","Linz","Salzburg","Vienna",
  ],
  "Europe/Stockholm": [
    "Gothenburg","Malmö","Stockholm",
  ],
  "Europe/Oslo": [
    "Bergen","Oslo","Trondheim",
  ],
  "Europe/Copenhagen": [
    "Aarhus","Copenhagen",
  ],
  "Europe/Helsinki": [
    "Helsinki","Tampere","Turku",
  ],
  "Europe/Warsaw": [
    "Kraków","Łódź","Poznań","Warsaw","Wrocław",
  ],
  "Europe/Prague": [
    "Brno","Prague",
  ],
  "Europe/Budapest": [
    "Budapest","Debrecen",
  ],
  "Europe/Bucharest": [
    "Bucharest","Cluj-Napoca",
  ],
  "Europe/Sofia": [
    "Plovdiv","Sofia","Varna",
  ],
  "Europe/Athens": [
    "Athens","Thessaloniki",
  ],
  "Europe/Istanbul": [
    "Ankara","Bursa","Istanbul","Izmir",
  ],
  "Europe/Moscow": [
    "Kazan","Moscow","Novosibirsk","Saint Petersburg","Yekaterinburg",
  ],
  "Europe/Kiev": [
    "Dnipro","Kharkiv","Kyiv","Lviv","Odesa",
  ],
  "Europe/Minsk": [
    "Minsk",
  ],
  "Africa/Cairo": [
    "Alexandria","Aswan","Cairo","Luxor",
  ],
  "Africa/Lagos": [
    "Abuja","Ibadan","Kano","Lagos",
  ],
  "Africa/Nairobi": [
    "Addis Ababa","Dar es Salaam","Kampala","Nairobi",
  ],
  "Africa/Johannesburg": [
    "Cape Town","Durban","Johannesburg","Pretoria",
  ],
  "Africa/Casablanca": [
    "Casablanca","Fes","Marrakesh","Rabat",
  ],
  "Africa/Algiers": [
    "Algiers","Oran",
  ],
  "Africa/Tunis": [
    "Sfax","Tunis",
  ],
  "Africa/Accra": [
    "Accra","Kumasi",
  ],
  "America/New_York": [
    "Atlanta","Baltimore","Boston","Buffalo","Charlotte","Cleveland",
    "Detroit","Jacksonville","Miami","New York","Orlando","Philadelphia",
    "Pittsburgh","Washington D.C.",
  ],
  "America/Chicago": [
    "Chicago","Dallas","Houston","Indianapolis","Kansas City",
    "Memphis","Milwaukee","Minneapolis","New Orleans","Oklahoma City","St. Louis",
  ],
  "America/Denver": [
    "Albuquerque","Denver","El Paso","Salt Lake City","Tucson",
  ],
  "America/Los_Angeles": [
    "Las Vegas","Los Angeles","Phoenix","Portland","Sacramento",
    "San Diego","San Francisco","San Jose","Seattle","Vancouver",
  ],
  "America/Toronto": [
    "Hamilton","Mississauga","Montreal","Ottawa","Quebec City","Toronto",
  ],
  "America/Vancouver": [
    "Burnaby","Surrey","Vancouver",
  ],
  "America/Calgary": [
    "Calgary","Edmonton","Regina","Saskatoon","Winnipeg",
  ],
  "America/Sao_Paulo": [
    "Belo Horizonte","Brasília","Campinas","Curitiba","Fortaleza",
    "Manaus","Porto Alegre","Recife","Rio de Janeiro","Salvador","São Paulo",
  ],
  "America/Argentina/Buenos_Aires": [
    "Buenos Aires","Córdoba","Mendoza","Rosario",
  ],
  "America/Bogota": [
    "Barranquilla","Bogotá","Cali","Medellín",
  ],
  "America/Lima": [
    "Arequipa","Lima","Trujillo",
  ],
  "America/Santiago": [
    "Santiago","Valparaíso",
  ],
  "America/Mexico_City": [
    "Guadalajara","Mexico City","Monterrey","Puebla","Tijuana",
  ],
  "UTC": [
    "Accra","Abidjan","Dakar","Lomé","Monrovia","Reykjavik",
  ],
};

/* ─── Fallback: all cities sorted (used when no TZ match) ────────── */
const ALL_CITIES = [
  ...new Set(Object.values(TIMEZONE_CITIES).flat()),
].sort();

/* ─── Get cities for a given timezone ───────────────────────────── */
function getCitiesForTimezone(tz) {
  if (!tz) return ALL_CITIES;
  const direct = TIMEZONE_CITIES[tz];
  if (direct && direct.length) return [...direct].sort();
  return ALL_CITIES;
}

/* ─── Searchable City Dropdown component ─────────────────────────── */
function CityDropdown({ value, onChange, timezone }) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState("");
  const inputRef                  = useRef(null);
  const containerRef              = useRef(null);

  const cities = getCitiesForTimezone(timezone);
  const filtered = search.trim()
    ? cities.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : cities;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (city) => {
    onChange(city);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all text-left"
        style={{
          background: open ? "var(--surface-3)" : "var(--surface-2)",
          border: open ? "1px solid #2563EB" : "1px solid var(--inp-border)",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
          color: value ? "var(--tx-1)" : "var(--tx-3)",
        }}
      >
        <span className="flex items-center gap-2 truncate">
          {value
            ? <><span className="text-base">📍</span><span style={{ color:"var(--tx-1)" }}>{value}</span></>
            : <><Search className="h-4 w-4" style={{ color:"var(--tx-3)" }} /><span>Select or search city…</span></>
          }
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color:"var(--tx-3)" }} />
        </motion.span>
      </button>

      {/* dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-6, scale:0.98 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.98 }}
            transition={{ duration:0.15, ease:[0.4,0,0.2,1] }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {/* search box */}
            <div className="px-3 pt-3 pb-2" style={{ borderBottom:"1px solid var(--surface-border)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color:"var(--tx-3)" }} />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${cities.length} cities…`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--inp-border)",
                    color: "var(--tx-1)",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
                    style={{ color:"var(--tx-3)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-[10px] mt-1.5 px-1" style={{ color:"var(--tx-3)" }}>
                {filtered.length} {filtered.length === 1 ? "city" : "cities"}
                {timezone && TIMEZONE_CITIES[timezone]?.length ? ` in selected timezone` : " worldwide"}
              </p>
            </div>

            {/* list */}
            <div className="overflow-y-auto max-h-52 py-1 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm" style={{ color:"var(--tx-3)" }}>
                  No cities match "<span style={{ color:"var(--tx-1)" }}>{search}</span>"
                </div>
              ) : (
                filtered.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => select(city)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-all"
                    style={{
                      background: city === value ? "rgba(37,99,235,0.1)" : "transparent",
                      color: city === value ? "#2563EB" : "var(--tx-1)",
                      fontWeight: city === value ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (city !== value) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { if (city !== value) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span className="text-sm">{city === value ? "✓" : "📍"}</span>
                    {city}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Custom SVG brand icons ─────────────────────────────────────── */

function LinkedInIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0A66C2"/>
      <path d="M7.5 9.5H5V19H7.5V9.5ZM6.25 8.5C7.08 8.5 7.75 7.83 7.75 7C7.75 6.17 7.08 5.5 6.25 5.5C5.42 5.5 4.75 6.17 4.75 7C4.75 7.83 5.42 8.5 6.25 8.5ZM19 19H16.5V14.3C16.5 13.07 16.48 11.47 14.77 11.47C13.04 11.47 12.77 12.83 12.77 14.21V19H10.27V9.5H12.67V10.93H12.7C13.04 10.27 13.89 9.57 15.17 9.57C17.7 9.57 19 11.18 19 13.47V19Z" fill="white"/>
    </svg>
  );
}
function GitHubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="12" fill="#24292E"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 5C8.13 5 5 8.13 5 12C5 15.14 7.03 17.81 9.87 18.76C10.22 18.82 10.35 18.61 10.35 18.42V17.1C8.43 17.52 8.02 16.2 8.02 16.2C7.7 15.37 7.23 15.16 7.23 15.16C6.58 14.73 7.28 14.74 7.28 14.74C7.99 14.79 8.37 15.47 8.37 15.47C9.01 16.56 10.04 16.24 10.38 16.06C10.44 15.6 10.63 15.28 10.83 15.1C9.32 14.92 7.73 14.33 7.73 11.73C7.73 10.95 8.01 10.31 8.38 9.82C8.32 9.64 8.07 8.91 8.44 7.93C8.44 7.93 9.04 7.74 10.35 8.66C10.9 8.5 11.45 8.42 12 8.42C12.55 8.42 13.1 8.5 13.65 8.66C14.96 7.74 15.56 7.93 15.56 7.93C15.93 8.91 15.68 9.64 15.62 9.82C15.99 10.31 16.27 10.95 16.27 11.73C16.27 14.34 14.68 14.92 13.16 15.1C13.41 15.32 13.63 15.75 13.63 16.41V18.42C13.63 18.61 13.76 18.83 14.12 18.76C16.97 17.81 19 15.14 19 12C19 8.13 15.87 5 12 5Z" fill="white"/>
    </svg>
  );
}
function PortfolioIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#059669"/>
      <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 7.5C12.89 7.5 13.73 7.76 14.43 8.2L8.2 14.43C7.76 13.73 7.5 12.89 7.5 12C7.5 9.52 9.52 7.5 12 7.5ZM12 16.5C11.11 16.5 10.27 16.24 9.57 15.8L15.8 9.57C16.24 10.27 16.5 11.11 16.5 12C16.5 14.48 14.48 16.5 12 16.5Z" fill="white"/>
    </svg>
  );
}
function LeetCodeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FFA116"/>
      <path d="M13.88 18.12L10.62 21.38C10.13 21.87 9.32 21.87 8.83 21.38L7.42 19.97C6.93 19.48 6.93 18.67 7.42 18.18L10.68 14.92" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.5 6.5L10.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 12H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13.88 5.88L17.14 9.14C17.63 9.63 17.63 10.44 17.14 10.93L10.88 17.19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Static data ──────────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  "React","Node.js","TypeScript","Python","SQL","AWS",
  "Project Management","Agile","Leadership","Excel","Power BI","Docker","Git","Figma",
];

const ACHIEVEMENTS = [
  { icon: Zap,        color: "#F59E0B", label: "Early Adopter",    desc: "Joined in the first cohort" },
  { icon: Target,     color: "#2563EB", label: "On-Time Streak",   desc: "Submitted timesheets 4 weeks in a row" },
  { icon: TrendingUp, color: "#10B981", label: "Consistent Logger",desc: "Logged time every working day this month" },
  { icon: Star,       color: "#8B5CF6", label: "Team Player",      desc: "Mentioned in 3+ approvals" },
];

const ACTIVITY = [
  { icon: Clock,       color: "#2563EB", label: "Logged 8h on Project Alpha",           time: "Today, 5:30 PM" },
  { icon: CheckCircle, color: "#10B981", label: "Timesheet approved by manager",        time: "Yesterday" },
  { icon: FileText,    color: "#8B5CF6", label: "Submitted weekly timesheet",           time: "Mon, 9:00 AM" },
  { icon: Award,       color: "#F59E0B", label: "Profile updated",                     time: "Last week" },
  { icon: Briefcase,   color: "#10B981", label: "Assigned to project: Beta Launch",     time: "2 weeks ago" },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user }                       = useAuthStore();
  const { theme, setTheme }            = useThemeStore();
  const { setAvatar, setBio, addSkill, removeSkill, setResume, clearResume } = useProfileStore();
  const uid = user?.id;
  // Read this user's profile slice — falls back to defaults so other users' data is never shown
  const { avatar, bio, skills, resumeFileName, resumeData } =
    useProfileStore((s) => s._profiles[uid] ?? DEFAULT_PROFILE);

  const [tab, setTab]                  = useState("overview");
  const [editingBio, setEditingBio]    = useState(false);
  const [bioInput, setBioInput]        = useState(bio);
  const [bioSaved, setBioSaved]        = useState(false);
  const [skillInput, setSkillInput]    = useState("");
  const [dragOver, setDragOver]        = useState(false);
  const [showPass, setShowPass]        = useState({ old:false, new:false, confirm:false });
  const [editSaved, setEditSaved]      = useState(false);
  const [editForm, setEditForm]        = useState({
    phone:"", location:"", linkedin:"", github:"", leetcode:"", portfolio:"",
    language:"English", timezone:"Asia/Kolkata",
    yearsExp:"", techStack:"", certifications:"",
    officeLocation:"", workMode:"", emergencyName:"", emergencyPhone:"",
  });
  const [phoneError, setPhoneError]    = useState("");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState("");
  const [prefs, setPrefs]              = useState({
    emailDigest:true, timeReminder:true, approvalAlerts:true,
    weeklyReport:false, compactView:false, showSeconds:false,
    showProfile:true, showOnline:true, showInHierarchy:true,
  });

  const avatarRef = useRef(null);
  const resumeRef = useRef(null);

  const isSuperAdmin = user?.role === "super_admin";
  const initials     = user?.full_name?.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase() || "U";
  const memberSince  = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}) : "—";
  const avatarGrad   = isSuperAdmin ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#2563EB,#10B981)";

  const completionPct = Math.round([
    !!user?.full_name, !!user?.email, !!bio, skills.length > 0,
    !!resumeFileName, !!avatar, !!editForm.phone, !!editForm.linkedin,
  ].filter(Boolean).length / 8 * 100);

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader(); r.onload = (ev) => setAvatar(uid, ev.target.result); r.readAsDataURL(file);
  };
  const handleResume = (file) => {
    if (!file) return;
    const r = new FileReader(); r.onload = (ev) => setResume(uid, file.name, ev.target.result); r.readAsDataURL(file);
  };
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const sk = skillInput.trim();
    if (sk && !skills.includes(sk)) { addSkill(uid, sk); setSkillInput(""); }
  };
  const saveBio = () => { setBio(uid, bioInput); setEditingBio(false); setBioSaved(true); setTimeout(() => setBioSaved(false), 2200); };
  const saveEdit = () => { setEditSaved(true); setTimeout(() => setEditSaved(false), 2200); };
  const setPref = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const ef = (k) => (e) => setEditForm((p) => ({ ...p, [k]: e.target.value }));
  const handlePhone = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setEditForm((p) => ({ ...p, phone: raw }));
    if (raw.length > 0 && raw.length < 10) setPhoneError("Phone number must be exactly 10 digits");
    else setPhoneError("");
  };
  const handleEmergencyPhone = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setEditForm((p) => ({ ...p, emergencyPhone: raw }));
    if (raw.length > 0 && raw.length < 10) setEmergencyPhoneError("Must be exactly 10 digits");
    else setEmergencyPhoneError("");
  };

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto flex flex-col" style={{ height: "calc(100vh - 64px - 48px)" }}>

      {/* ═══ HERO ════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.35, ease:[0.4,0,0.2,1] }}
        className="relative rounded-2xl overflow-hidden flex-shrink-0 mb-3"
        style={{
          background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 40%,#0D9488 100%)",
          boxShadow: "0 8px 40px rgba(37,99,235,0.3)",
        }}
      >
        {/* decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"
          style={{ background: "radial-gradient(circle,#60A5FA,transparent)" }} />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full opacity-10 translate-y-1/2 pointer-events-none"
          style={{ background: "radial-gradient(circle,#34D399,transparent)" }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }} />

        <div className="relative px-6 py-4">
          <div className="flex items-center gap-5">

            {/* ── LEFT: info ─────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white leading-tight">{user?.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background:"rgba(255,255,255,0.2)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)" }}>
                  {isSuperAdmin ? "Super Admin" : user?.can_approve_timesheets ? "Approver" : "Employee"}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 flex-shrink-0" />{user?.email}
              </p>
              {user?.department && (
                <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />{user.department}
                </p>
              )}
              {bio && <p className="text-xs text-white/60 mt-1.5 max-w-md leading-relaxed line-clamp-1">{bio}</p>}

              {/* inline stats */}
              <div className="flex items-center gap-4 mt-2.5">
                {[
                  { val: skills.length,          label: "Skills" },
                  { val: resumeFileName ? 1 : 0, label: "Docs" },
                  { val: `${completionPct}%`,    label: "Complete" },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-white">{s.val}</span>
                    <span className="text-[10px] text-white/50">{s.label}</span>
                  </div>
                ))}
                <div className="flex-1 ml-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.15)" }}>
                    <motion.div
                      initial={{ width:0 }} animate={{ width:`${completionPct}%` }}
                      transition={{ duration:1.2, ease:[0.4,0,0.2,1], delay:0.4 }}
                      className="h-full rounded-full"
                      style={{ background:"linear-gradient(90deg,#FFFFFF,rgba(255,255,255,0.7))" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: avatar ──────────────────────────────────── */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: avatar ? "transparent" : avatarGrad, boxShadow: "0 0 0 3px rgba(255,255,255,0.2),0 6px 24px rgba(0,0,0,0.3)" }}>
                {avatar ? <img src={avatar} alt="av" className="w-full h-full object-cover" /> : initials}
              </div>
              <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.88 }}
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xl"
                style={{ background:"linear-gradient(135deg,#2563EB,#10B981)", border:"2px solid rgba(255,255,255,0.3)" }}>
                <Camera className="h-3.5 w-3.5" />
              </motion.button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ TABS ════════════════════════════════════════════════ */}
      <div className="flex gap-0.5 p-1 rounded-xl overflow-x-auto scrollbar-thin flex-shrink-0 mb-3" style={S.card}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <motion.button key={id} onClick={() => setTab(id)}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative"
              style={{ color: active ? "#fff" : "var(--tx-3)" }}
            >
              {active && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-lg"
                  style={{ background:"linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow:"0 2px 8px rgba(37,99,235,0.3)" }}
                  transition={{ duration:0.22, ease:[0.4,0,0.2,1] }} />
              )}
              <Icon className="h-3.5 w-3.5 relative z-10 flex-shrink-0" />
              <span className="relative z-10 hidden md:block whitespace-nowrap">{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══ CONTENT ═════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-2xl">
      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <motion.div key="ov" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">

            {/* stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon:Clock,     accent:"#2563EB", label:"Time Logged",  val:"—" },
                { icon:Calendar,  accent:"#10B981", label:"Member Since", val:memberSince },
                { icon:Briefcase, accent:"#8B5CF6", label:"Department",   val:user?.department||"—" },
                { icon:Award,     accent:"#F59E0B", label:"Role",         val:isSuperAdmin?"Super Admin":user?.can_approve_timesheets?"Approver":"Employee" },
              ].map((s,i) => (
                <motion.div key={s.label} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }}
                  className="rounded-xl p-3 flex items-center gap-3" style={S.card}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background:`${s.accent}18` }}>
                    <s.icon className="h-4 w-4" style={{ color:s.accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium" style={S.fieldLabel}>{s.label}</p>
                    <p className="text-xs font-bold truncate" style={S.fieldValue}>{s.val}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* quick info + about grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardHeader icon={User} title="Quick Info" accent="#2563EB" />
                <div className="p-3 space-y-2.5">
                  {[
                    { icon:Briefcase, label:"Designation",  val:user?.designation },
                    { icon:Hash,      label:"Employee ID",  val:user?.employee_id },
                    { icon:MapPin,    label:"Location",        val:editForm.location||undefined },
                    { icon:Phone,     label:"Phone",           val:editForm.phone ? `+91 ${editForm.phone}` : undefined },
                    { icon:Briefcase, label:"Experience",       val:editForm.yearsExp||undefined },
                    { icon:Globe,     label:"Work Mode",        val:editForm.workMode||undefined },
                    { icon:Languages, label:"Language",         val:editForm.language },
                    { icon:Hash,      label:"Tech Stack",       val:editForm.techStack||undefined },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:"rgba(37,99,235,0.1)" }}>
                        <r.icon className="h-3 w-3" style={{ color:"#2563EB" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider" style={S.fieldLabel}>{r.label}</p>
                        <FValue>{r.val}</FValue>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader icon={MessageSquare} title="About & Social" accent="#10B981"
                  action={<GradBtn small onClick={() => setTab("edit")}><Edit3 className="h-3 w-3" />Edit</GradBtn>} />
                <div className="p-3 space-y-3">
                  <div>
                    <FLabel>Bio</FLabel>
                    <p className="text-xs leading-relaxed" style={S.mutedText}>
                      {bio || <span className="italic" style={S.fieldLabel}>No bio yet — go to Edit Profile to add one.</span>}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { SvgIcon:LinkedInIcon,  label:"LinkedIn",  val:editForm.linkedin,  color:"#0A66C2" },
                      { SvgIcon:GitHubIcon,    label:"GitHub",    val:editForm.github,    color:"#24292E" },
                      { SvgIcon:PortfolioIcon, label:"Portfolio", val:editForm.portfolio, color:"#059669" },
                      { SvgIcon:LeetCodeIcon,  label:"LeetCode",  val:editForm.leetcode,  color:"#FFA116" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={S.subRow}>
                        <div className="flex-shrink-0"><s.SvgIcon size={16} /></div>
                        <div className="min-w-0">
                          <p className="text-[9px]" style={S.fieldLabel}>{s.label}</p>
                          <p className="text-[11px] font-medium truncate" style={{ color: s.val ? s.color : "var(--tx-3)" }}>
                            {s.val || "Not linked"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* achievements */}
            <Card>
              <CardHeader icon={Award} title="Achievements" subtitle="Milestones you've unlocked" accent="#F59E0B" />
              <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((a, i) => (
                  <motion.div key={a.label} initial={{ opacity:0,scale:0.85 }} animate={{ opacity:1,scale:1 }} transition={{ delay:i*0.07, type:"spring", damping:15 }}
                    className="flex items-center gap-3 p-3 rounded-xl" style={S.subRow}>
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:`${a.color}18` }}>
                      <a.icon className="h-4 w-4" style={{ color:a.color }} />
                    </div>
                    <p className="text-xs font-semibold" style={S.fieldValue}>{a.label}</p>
                    <p className="text-xs leading-snug" style={S.fieldLabel}>{a.desc}</p>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* recent activity */}
            <Card>
              <CardHeader icon={Activity} title="Recent Activity" subtitle="Your latest actions" accent="#8B5CF6" />
              <div className="p-2 space-y-0.5">
                {ACTIVITY.map((item, i) => (
                  <motion.div key={i} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.05 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-default"
                    onMouseEnter={(e) => e.currentTarget.style.background="var(--surface-3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background="transparent"}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${item.color}18` }}>
                      <item.icon className="h-3.5 w-3.5" style={{ color:item.color }} />
                    </div>
                    <p className="flex-1 text-xs font-medium" style={S.fieldValue}>{item.label}</p>
                    <p className="text-[10px] flex-shrink-0" style={S.fieldLabel}>{item.time}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── EDIT PROFILE ── */}
        {tab === "edit" && (
          <motion.div key="ed" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            {/* bio */}
            <Card>
              <CardHeader icon={Edit3} title="About Me" subtitle="A short bio visible to your team" accent="#2563EB"
                action={editingBio
                  ? <GradBtn small color="green" onClick={saveBio}>{bioSaved?<Check className="h-3 w-3"/>:<Save className="h-3 w-3"/>}{bioSaved?"Saved!":"Save"}</GradBtn>
                  : <GradBtn small onClick={() => { setBioInput(bio); setEditingBio(true); }}><Edit3 className="h-3 w-3"/>Edit</GradBtn>}
              />
              <div className="p-4">
                {editingBio ? (
                  <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows={3}
                    placeholder="Write something about yourself, your experience, interests…"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none transition-all"
                    style={{ ...S.textarea, border:"1px solid #2563EB", boxShadow:"0 0 0 3px rgba(37,99,235,0.1)" }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed" style={S.mutedText}>
                    {bio || <span className="italic" style={S.fieldLabel}>No bio yet. Click Edit to add one.</span>}
                  </p>
                )}
              </div>
            </Card>

            {/* personal details */}
            <Card>
              <CardHeader icon={User} title="Personal Details" subtitle="Contact & location info" accent="#10B981"
                action={<GradBtn small color="green" onClick={saveEdit}>{editSaved?<Check className="h-3 w-3"/>:<Save className="h-3 w-3"/>}{editSaved?"Saved!":"Save"}</GradBtn>}
              />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone — 10 digits only */}
                <div>
                  <FLabel>Phone Number</FLabel>
                  <div className="relative">
                    <ThemedInput
                      value={editForm.phone}
                      placeholder="10-digit mobile number"
                      onChange={handlePhone}
                      maxLength={10}
                      inputMode="numeric"
                    />
                    {/* digit counter */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                      style={{ color: editForm.phone.length === 10 ? "#10B981" : editForm.phone.length > 0 ? "#F59E0B" : "var(--tx-3)" }}>
                      {editForm.phone.length}/10
                    </span>
                  </div>
                  {phoneError && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color:"#EF4444" }}>
                      <AlertCircle className="h-3 w-3" />{phoneError}
                    </p>
                  )}
                  {editForm.phone.length === 10 && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color:"#10B981" }}>
                      <CheckCircle className="h-3 w-3" />Valid phone number
                    </p>
                  )}
                </div>

                {/* Location — searchable city dropdown, filtered by timezone */}
                <div>
                  <FLabel>Location / City</FLabel>
                  <CityDropdown
                    value={editForm.location}
                    onChange={(city) => setEditForm((p) => ({ ...p, location: city }))}
                    timezone={editForm.timezone}
                  />
                  {editForm.timezone && TIMEZONE_CITIES[editForm.timezone]?.length > 0 && (
                    <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color:"var(--tx-3)" }}>
                      <Globe className="h-3 w-3" />
                      Showing cities for <span className="font-semibold" style={{ color:"#2563EB" }}>{editForm.timezone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <FLabel>Language</FLabel>
                  <ThemedSelect value={editForm.language} onChange={ef("language")}>
                    {["English","Hindi","Spanish","French","German","Japanese","Mandarin"].map((l) => <option key={l}>{l}</option>)}
                  </ThemedSelect>
                </div>
                <div>
                  <FLabel>Timezone</FLabel>
                  <ThemedSelect
                    value={editForm.timezone}
                    onChange={(e) => setEditForm((p) => ({ ...p, timezone: e.target.value, location: "" }))}
                  >
                    {Object.keys(TIMEZONE_CITIES).sort().map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </ThemedSelect>
                  <p className="text-[10px] mt-1.5" style={{ color:"var(--tx-3)" }}>
                    Changing timezone refreshes the city list
                  </p>
                </div>
              </div>
            </Card>

            {/* professional info */}
            <Card>
              <CardHeader icon={Briefcase} title="Professional Info" subtitle="Work-related details and experience" accent="#8B5CF6" />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Years of Experience */}
                <div>
                  <FLabel>Years of Experience</FLabel>
                  <ThemedSelect value={editForm.yearsExp} onChange={ef("yearsExp")}>
                    <option value="">Select range…</option>
                    {["Less than 1 year","1 – 2 years","2 – 4 years","4 – 6 years","6 – 8 years","8 – 10 years","10 – 15 years","15 – 20 years","20+ years"].map((y) => <option key={y}>{y}</option>)}
                  </ThemedSelect>
                </div>

                {/* Work Mode */}
                <div>
                  <FLabel>Work Mode</FLabel>
                  <div className="flex gap-2 mt-1">
                    {["On-site","Hybrid","Remote"].map((mode) => (
                      <motion.button
                        key={mode}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setEditForm((p) => ({ ...p, workMode: mode }))}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={editForm.workMode === mode
                          ? { background: "linear-gradient(135deg,#2563EB,#10B981)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
                          : { ...S.subRow, color: "var(--tx-2)" }
                        }
                      >
                        {mode === "On-site" ? "🏢" : mode === "Hybrid" ? "⚡" : "🏠"} {mode}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Primary Technology Stack */}
                <div className="sm:col-span-2">
                  <FLabel>Primary Technology Stack</FLabel>
                  <ThemedInput
                    value={editForm.techStack}
                    placeholder="e.g. React, Node.js, PostgreSQL, AWS"
                    onChange={ef("techStack")}
                  />
                  <p className="text-xs mt-1" style={S.fieldLabel}>Comma-separated list of your core technologies</p>
                </div>

                {/* Certifications */}
                <div className="sm:col-span-2">
                  <FLabel>Certifications</FLabel>
                  <ThemedInput
                    value={editForm.certifications}
                    placeholder="e.g. AWS Solutions Architect, PMP, Google Cloud Professional"
                    onChange={ef("certifications")}
                  />
                  <p className="text-xs mt-1" style={S.fieldLabel}>Comma-separated list of certifications you hold</p>
                </div>

                {/* Office Location */}
                <div className="sm:col-span-2">
                  <FLabel>Office Location</FLabel>
                  <ThemedInput
                    value={editForm.officeLocation}
                    placeholder="e.g. HQ – Bengaluru, Tower B, Floor 4"
                    onChange={ef("officeLocation")}
                  />
                </div>
              </div>
            </Card>

            {/* emergency contact */}
            <Card>
              <CardHeader icon={Phone} title="Emergency Contact" subtitle="Optional — visible only to HR/admin" accent="#EF4444"
                action={
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background:"rgba(245,158,11,0.12)", color:"#F59E0B" }}>
                    Optional
                  </span>
                }
              />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FLabel>Contact Name</FLabel>
                  <ThemedInput
                    value={editForm.emergencyName}
                    placeholder="Full name of emergency contact"
                    onChange={ef("emergencyName")}
                  />
                </div>
                <div>
                  <FLabel>Contact Phone Number</FLabel>
                  <div className="relative">
                    <ThemedInput
                      value={editForm.emergencyPhone}
                      placeholder="10-digit mobile number"
                      onChange={handleEmergencyPhone}
                      maxLength={10}
                      inputMode="numeric"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                      style={{ color: editForm.emergencyPhone.length === 10 ? "#10B981" : editForm.emergencyPhone.length > 0 ? "#F59E0B" : "var(--tx-3)" }}>
                      {editForm.emergencyPhone.length}/10
                    </span>
                  </div>
                  {emergencyPhoneError && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color:"#EF4444" }}>
                      <AlertCircle className="h-3 w-3" />{emergencyPhoneError}
                    </p>
                  )}
                  {editForm.emergencyPhone.length === 10 && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color:"#10B981" }}>
                      <CheckCircle className="h-3 w-3" />Valid number
                    </p>
                  )}
                </div>
              </div>
              <div className="mx-6 mb-6 px-4 py-3 rounded-xl flex items-start gap-2.5" style={S.infoBox("#F59E0B")}>
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color:"#F59E0B" }} />
                <p className="text-xs leading-relaxed" style={{ color:"var(--tx-2)" }}>
                  Emergency contact information is stored locally and only visible to HR administrators in case of emergencies.
                </p>
              </div>
            </Card>

            {/* social links */}
            <Card>
              <CardHeader icon={Link2} title="Social Links" subtitle="Connect your online profiles" accent="#8B5CF6" />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { k:"linkedin",  label:"LinkedIn Profile URL",  SvgIcon:LinkedInIcon,  ph:"https://linkedin.com/in/username",  ic:"#0A66C2" },
                  { k:"github",    label:"GitHub Profile URL",    SvgIcon:GitHubIcon,    ph:"https://github.com/username",       ic:"#24292E" },
                  { k:"portfolio", label:"Portfolio / Project URL",SvgIcon:PortfolioIcon, ph:"https://myportfolio.com",          ic:"#059669" },
                  { k:"leetcode",  label:"LeetCode Profile URL",  SvgIcon:LeetCodeIcon,  ph:"https://leetcode.com/username",    ic:"#FFA116" },
                ].map(({ k, label, SvgIcon, ph }) => (
                  <div key={k}>
                    <FLabel>{label}</FLabel>
                    <ThemedInput
                      value={editForm[k]}
                      placeholder={ph}
                      onChange={ef(k)}
                      prefix={<SvgIcon size={16} />}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── SKILLS ── */}
        {tab === "skills" && (
          <motion.div key="sk" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            <Card>
              <CardHeader icon={Star} title="Skills & Expertise" subtitle="Showcase your professional strengths" accent="#F59E0B" />
              <div className="p-4">
                <form onSubmit={handleAddSkill} className="flex gap-3 mb-5">
                  <ThemedInput value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Type a skill (e.g. React, Leadership)" />
                  <GradBtn onClick={handleAddSkill}><Plus className="h-4 w-4"/>Add</GradBtn>
                </form>

                {/* suggestions */}
                <div className="mb-6">
                  <p className="text-xs font-semibold mb-2.5" style={S.fieldLabel}>Quick add:</p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0,10).map((s) => (
                      <motion.button key={s} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                        onClick={() => addSkill(uid, s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                        style={S.subRow}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor="#2563EB"; e.currentTarget.style.color="#2563EB"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--surface-border)"; e.currentTarget.style.color="var(--tx-2)"; }}
                      >
                        <Plus className="h-3 w-3"/>{s}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={S.fieldLabel}>{skills.length} skill{skills.length!==1?"s":""} added</p>
                    <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      onClick={() => skills.slice().forEach((sk) => removeSkill(uid, sk))}
                      className="text-xs flex items-center gap-1 transition-all" style={{ color:"#EF4444" }}>
                      <Trash2 className="h-3 w-3"/>Clear all
                    </motion.button>
                  </div>
                )}

                {skills.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl" style={S.subRow}>
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background:"rgba(245,158,11,0.1)" }}>
                      <Star className="h-6 w-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium" style={S.mutedText}>No skills added yet</p>
                    <p className="text-xs mt-1" style={S.fieldLabel}>Add your skills above to showcase your expertise</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    <AnimatePresence>
                      {skills.map((skill, i) => (
                        <motion.div key={skill}
                          initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.7, opacity:0 }}
                          transition={{ duration:0.18, type:"spring", damping:15, delay:i*0.02 }}
                          className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-xl text-sm font-semibold"
                          style={{ background:"linear-gradient(135deg,rgba(37,99,235,0.1),rgba(16,185,129,0.07))", border:"1px solid rgba(37,99,235,0.2)", color:"#2563EB" }}
                        >
                          {skill}
                          <button onClick={() => removeSkill(uid, skill)}
                            className="w-4 h-4 rounded-full flex items-center justify-center transition-all hover:bg-red-100"
                            style={{ color:"#94A3B8" }}>
                            <X className="h-3 w-3"/>
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader icon={BookOpen} title="Certifications" subtitle="Professional certifications & licenses" accent="#8B5CF6" />
              <div className="p-6 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background:"rgba(139,92,246,0.1)" }}>
                  <BookOpen className="h-6 w-6" style={{ color:"#8B5CF6" }} />
                </div>
                <p className="text-sm font-medium" style={S.mutedText}>Certification tracking coming soon</p>
                <p className="text-xs mt-1" style={S.fieldLabel}>Add PMP, AWS, Google, and other certifications here</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── APPEARANCE ── */}
        {tab === "appearance" && (
          <motion.div key="ap" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            <Card>
              <CardHeader icon={Palette} title="Theme" subtitle="Choose how Tymvora looks for you" accent="#2563EB" />
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { key:"light",  icon:Sun,     label:"Light Mode",  desc:"Clean, bright interface",      preview:"bg-white border" },
                    { key:"dark",   icon:Moon,    label:"Dark Mode",   desc:"Easy on the eyes at night",    preview:"bg-slate-900" },
                    { key:"system", icon:Monitor, label:"System",      desc:"Follows your OS preference",   preview:"" },
                  ].map(({ key, icon:Icon, label, desc }) => {
                    const active = theme === key;
                    return (
                      <motion.button key={key} onClick={() => setTheme(key)} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        className="relative flex flex-col items-center gap-3 p-6 rounded-2xl text-left transition-all"
                        style={active
                          ? { background:"linear-gradient(135deg,rgba(37,99,235,0.12),rgba(16,185,129,0.07))", border:"2px solid #2563EB", boxShadow:"0 0 0 4px rgba(37,99,235,0.08)" }
                          : { ...S.subRow }
                        }
                      >
                        {active && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background:"linear-gradient(135deg,#2563EB,#10B981)" }}>
                            <Check className="h-3.5 w-3.5 text-white"/>
                          </div>
                        )}
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                          style={{ background: active ? "rgba(37,99,235,0.12)" : "var(--surface-3)" }}>
                          <Icon className="h-6 w-6" style={{ color: active ? "#2563EB" : "var(--tx-3)" }} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold" style={{ color: active ? "#2563EB" : "var(--tx-1)" }}>{label}</p>
                          <p className="text-xs mt-0.5" style={S.fieldLabel}>{desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="px-4 py-3.5 rounded-xl" style={S.infoBox("#2563EB")}>
                  <p className="text-sm" style={{ color:"#2563EB" }}>
                    <span className="font-semibold">Active: </span>
                    {theme==="light" ? "Light mode — bright, clean look." : theme==="dark" ? "Dark mode — dark navy theme." : "System mode — follows your OS."}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader icon={Layout} title="Display Options" subtitle="Adjust how content is shown" accent="#10B981" />
              <div className="p-4">
                <ToggleSwitch label="Compact view" description="Reduce spacing for a denser layout" checked={prefs.compactView} onChange={(v) => setPref("compactView",v)} />
                <ToggleSwitch label="Show seconds in time display" description="Display seconds in timesheets and time logs" checked={prefs.showSeconds} onChange={(v) => setPref("showSeconds",v)} />
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <motion.div key="do" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            <Card>
              <CardHeader icon={Upload} title="Resume / CV" subtitle="Upload and manage your documents" accent="#2563EB" />
              <div className="p-4">
                <motion.div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleResume(e.dataTransfer.files?.[0]); }}
                  onClick={() => resumeRef.current?.click()}
                  animate={dragOver ? { scale:1.02 } : { scale:1 }}
                  className="cursor-pointer rounded-2xl p-12 text-center transition-all"
                  style={dragOver
                    ? { background:"rgba(37,99,235,0.08)", border:"2px dashed #2563EB" }
                    : { background:"var(--surface-2)", border:"2px dashed var(--surface-border)" }
                  }
                >
                  <motion.div animate={dragOver?{y:-4}:{y:0}}
                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background:"linear-gradient(135deg,rgba(37,99,235,0.15),rgba(16,185,129,0.1))" }}>
                    <Upload className="h-6 w-6 text-primary-600" style={{ color:"#2563EB" }} />
                  </motion.div>
                  <p className="text-sm font-semibold" style={S.fieldValue}>{dragOver?"Release to upload":"Drop your resume here, or click to browse"}</p>
                  <p className="text-xs mt-1.5" style={S.fieldLabel}>Supports PDF, DOCX, DOC, TXT</p>
                </motion.div>
                <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleResume(e.target.files?.[0])} />

                <AnimatePresence>
                  {resumeFileName && (
                    <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }}
                      className="mt-5 flex items-center gap-4 px-5 py-4 rounded-2xl"
                      style={S.infoBox("#2563EB")}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(37,99,235,0.15)" }}>
                        <FileText className="h-5 w-5" style={{ color:"#2563EB" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={S.fieldValue}>{resumeFileName}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color:"#10B981" }}>
                          <CheckCircle className="h-3 w-3"/>Uploaded · Stored locally
                        </p>
                      </div>
                      {resumeData && (
                        <a href={resumeData} download={resumeFileName}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background:"rgba(37,99,235,0.12)", color:"#2563EB" }}
                          onClick={(e) => e.stopPropagation()}>
                          <Download className="h-3.5 w-3.5"/>Download
                        </a>
                      )}
                      <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
                        onClick={(e) => { e.stopPropagation(); clearResume(uid); }}
                        className="p-2 rounded-xl transition-all" style={{ color:"#EF4444" }}
                        onMouseEnter={(e) => e.currentTarget.style.background="rgba(239,68,68,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                        <Trash2 className="h-4 w-4"/>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            <Card>
              <CardHeader icon={AlertCircle} title="Document Tips" accent="#F59E0B" />
              <div className="p-4 space-y-3">
                {["Keep your resume updated with latest projects and achievements.",
                  "PDF format recommended for consistent formatting across devices.",
                  "Documents are stored in your browser — re-upload if you clear browser data."
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:"rgba(245,158,11,0.12)" }}>
                      <span className="text-[10px] font-bold" style={{ color:"#F59E0B" }}>{i+1}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={S.mutedText}>{tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── SECURITY ── */}
        {tab === "security" && (
          <motion.div key="se" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            <Card>
              <CardHeader icon={Lock} title="Change Password" subtitle="Update your login credentials" accent="#EF4444" />
              <div className="p-4 space-y-3 max-w-md">
                {[{k:"old",label:"Current Password",ph:"Enter current password"},{k:"new",label:"New Password",ph:"Minimum 8 characters"},{k:"confirm",label:"Confirm New Password",ph:"Repeat your new password"}].map(({k,label,ph}) => (
                  <div key={k}>
                    <FLabel>{label}</FLabel>
                    <div className="relative">
                      <ThemedInput type={showPass[k]?"text":"password"} value="" onChange={() => {}} placeholder={ph} />
                      <button type="button" onClick={() => setShowPass((p) => ({...p,[k]:!p[k]}))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-all" style={{ color:"var(--tx-3)" }}>
                        {showPass[k] ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                ))}
                <GradBtn color="blue"><Key className="h-4 w-4"/>Update Password</GradBtn>
                <p className="text-xs" style={S.fieldLabel}>
                  Or use the <a href="/change-password" className="underline" style={{ color:"#2563EB" }}>Change Password page</a> for the full flow.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeader icon={Shield} title="Active Sessions" subtitle="Devices currently signed in" accent="#10B981" />
              <div className="p-4 space-y-3">
                {[
                  { device:"Chrome · Windows 11", location:"New Delhi, IN", status:"current", time:"Now" },
                  { device:"Mobile Browser",       location:"New Delhi, IN", status:"active",  time:"2 hrs ago" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-xl" style={S.subRow}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: s.status==="current" ? "rgba(16,185,129,0.12)" : "var(--surface-3)" }}>
                      <Globe className="h-4 w-4" style={{ color: s.status==="current" ? "#10B981" : "var(--tx-3)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={S.fieldValue}>{s.device}</p>
                      <p className="text-xs" style={S.fieldLabel}>{s.location} · {s.time}</p>
                    </div>
                    {s.status==="current" ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background:"rgba(16,185,129,0.12)", color:"#10B981" }}>Current</span>
                    ) : (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                        style={{ color:"#EF4444" }}
                        onMouseEnter={(e) => e.currentTarget.style.background="rgba(239,68,68,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                        Revoke
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader icon={AlertCircle} title="Danger Zone" accent="#EF4444" />
              <div className="p-4">
                <div className="flex items-center justify-between px-5 py-4 rounded-xl" style={S.infoBox("#EF4444")}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"#EF4444" }}>Sign out all devices</p>
                    <p className="text-xs mt-0.5" style={S.fieldLabel}>Terminates all active sessions except this one</p>
                  </div>
                  <GradBtn color="red" small><RefreshCw className="h-3.5 w-3.5"/>Sign Out All</GradBtn>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── PREFERENCES ── */}
        {tab === "preferences" && (
          <motion.div key="pr" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.22 }} className="space-y-3 pb-3">
            <Card>
              <CardHeader icon={Bell} title="Notification Preferences" subtitle="Control what Tymvora notifies you about" accent="#2563EB" />
              <div className="p-4">
                <ToggleSwitch label="Email digest" description="Daily summary email of your activity" checked={prefs.emailDigest} onChange={(v) => setPref("emailDigest",v)} />
                <ToggleSwitch label="Time entry reminders" description="Get reminded to log time at end of day" checked={prefs.timeReminder} onChange={(v) => setPref("timeReminder",v)} />
                <ToggleSwitch label="Approval alerts" description="Notify when timesheets are approved or rejected" checked={prefs.approvalAlerts} onChange={(v) => setPref("approvalAlerts",v)} />
                <ToggleSwitch label="Weekly report" description="Receive a weekly summary of your logged hours" checked={prefs.weeklyReport} onChange={(v) => setPref("weeklyReport",v)} />
              </div>
            </Card>

            <Card>
              <CardHeader icon={Zap} title="Work Preferences" subtitle="Customize your work experience" accent="#10B981" />
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label:"Default timesheet view", opts:["Weekly","Daily","Monthly"] },
                    { label:"Work week starts on",    opts:["Monday","Sunday","Saturday"] },
                    { label:"Daily hours target",     opts:["6 hours","7 hours","8 hours","9 hours","10 hours"] },
                    { label:"Time format",            opts:["12-hour (AM/PM)","24-hour"] },
                  ].map(({ label, opts }) => (
                    <div key={label}>
                      <FLabel>{label}</FLabel>
                      <ThemedSelect value={opts[0]} onChange={() => {}}>
                        {opts.map((o) => <option key={o}>{o}</option>)}
                      </ThemedSelect>
                    </div>
                  ))}
                </div>
                <GradBtn color="green"><Save className="h-4 w-4"/>Save Preferences</GradBtn>
              </div>
            </Card>

            <Card>
              <CardHeader icon={BarChart2} title="Privacy" subtitle="Control your data visibility" accent="#8B5CF6" />
              <div className="p-4">
                <ToggleSwitch label="Show my profile to teammates" description="Allow others in your org to see your profile" checked={prefs.showProfile} onChange={(v) => setPref("showProfile",v)} />
                <ToggleSwitch label="Show online status" description="Display a green dot when you're active" checked={prefs.showOnline} onChange={(v) => setPref("showOnline",v)} />
                <ToggleSwitch label="Include me in org hierarchy view" description="Show your card in the organization chart" checked={prefs.showInHierarchy} onChange={(v) => setPref("showInHierarchy",v)} />
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
      </div>
    </div>
  );
}
