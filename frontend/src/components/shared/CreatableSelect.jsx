import { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * A dropdown that lets the user pick from existing options OR type a new value
 * to create it.  Shows a "+ Add '[typed]'" row when the typed text doesn't
 * exist in the list.
 *
 * Props:
 *   value        – current string value
 *   onChange     – (newValue: string) => void
 *   options      – string[]
 *   onAdd        – async (name: string) => void   (called when user creates)
 *   onDelete     – async (name: string) => void   (optional — shows × on each item)
 *   placeholder  – string
 *   label        – string (shown above)
 */
export function CreatableSelect({ value, onChange, options = [], onAdd, onDelete, placeholder = "Select or type…", label }) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState("");
  const [adding,  setAdding]  = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered  = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const canCreate = search.trim() && !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (opt) => {
    onChange(opt);
    setSearch("");
    setOpen(false);
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await onAdd(name);
      onChange(name);
      setSearch("");
      setOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (e, name) => {
    e.stopPropagation();
    await onDelete(name);
    if (value === name) onChange("");
  };

  return (
    <div ref={ref} className="relative">
      {/* trigger */}
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setSearch(""); }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors",
          "bg-transparent text-left",
          open
            ? "border-primary ring-1 ring-primary/30"
            : "border-input hover:border-primary/40"
        )}
        style={{ color: value ? "var(--tx-1)" : "var(--tx-3)" }}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 ml-1 transition-transform", open && "rotate-180")}
          style={{ color: "var(--tx-3)" }} />
      </button>

      {/* dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl shadow-lg overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "var(--card-shadow)" }}
        >
          {/* search input */}
          <div className="p-2 border-b" style={{ borderColor: "var(--surface-border)" }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); canCreate ? handleCreate() : filtered[0] && handleSelect(filtered[0]); } }}
              placeholder="Search or type to create…"
              className="w-full text-sm px-2 py-1 rounded-lg bg-transparent outline-none"
              style={{ color: "var(--tx-1)", caretColor: "var(--tx-1)" }}
            />
          </div>

          {/* option list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-3 text-xs text-center" style={{ color: "var(--tx-3)" }}>
                No options yet
              </p>
            )}

            {filtered.map((opt) => (
              <div
                key={opt}
                onMouseDown={() => handleSelect(opt)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors hover:bg-white/5"
                style={{ color: "var(--tx-1)" }}
              >
                {value === opt && <Check className="h-3 w-3 flex-shrink-0 text-primary" />}
                {value !== opt && <span className="w-3" />}
                <span className="flex-1 truncate">{opt}</span>
                {onDelete && (
                  <button
                    type="button"
                    onMouseDown={(e) => handleDelete(e, opt)}
                    className="flex-shrink-0 p-0.5 rounded hover:text-danger transition-colors"
                    style={{ color: "var(--tx-3)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {/* create new row */}
            {canCreate && (
              <div
                onMouseDown={handleCreate}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-t transition-colors hover:bg-primary/10"
                style={{ borderColor: "var(--surface-border)", color: "var(--tx-1)" }}
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span>
                  {adding ? "Adding…" : <>Add <strong>"{search.trim()}"</strong></>}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
