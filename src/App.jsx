import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "spend-tracker-data";

const fmt = (n) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseKey = (k) => { const [y,m,d] = k.split("-").map(Number); return new Date(y,m-1,d); };

const getMonday = (d) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

const CATEGORIES = [
  { id: "food", label: "Food", icon: "◐", color: "#e07a5f" },
  { id: "transport", label: "Transport", icon: "◑", color: "#81b29a" },
  { id: "shopping", label: "Shopping", icon: "◒", color: "#f2cc8f" },
  { id: "entertainment", label: "Fun", icon: "◓", color: "#3d405b" },
  { id: "bills", label: "Bills", icon: "◔", color: "#7f96a5" },
  { id: "other", label: "Other", icon: "◕", color: "#b8b8b8" },
];

const getCatColor = (id) => CATEGORIES.find(c => c.id === id)?.color || "#b8b8b8";

export default function SpendTracker() {
  const [data, setData] = useState(() => loadData());
  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("food");
  const [editingId, setEditingId] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { if (showAdd && inputRef.current) setTimeout(() => inputRef.current.focus(), 100); }, [showAdd]);

  const today = new Date();
  const todayKey = toKey(today);
  const selKey = toKey(selectedDate);

  const dayEntries = data[selKey] || [];
  const dayTotal = dayEntries.reduce((s, e) => s + e.amount, 0);

  const getWeekTotal = () => {
    const mon = getMonday(selectedDate);
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      total += (data[toKey(d)] || []).reduce((s, e) => s + e.amount, 0);
    }
    return total;
  };

  const getMonthTotal = () => {
    const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
    let total = 0;
    Object.keys(data).forEach(k => {
      const d = parseKey(k);
      if (d.getFullYear() === y && d.getMonth() === m) {
        total += data[k].reduce((s, e) => s + e.amount, 0);
      }
    });
    return total;
  };

  const addEntry = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const entry = { id: Date.now().toString(), amount: val, note: note.trim(), category, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setData(prev => {
      const existing = prev[selKey] || [];
      if (editingId) {
        return { ...prev, [selKey]: existing.map(e => e.id === editingId ? { ...e, amount: val, note: note.trim(), category } : e) };
      }
      return { ...prev, [selKey]: [...existing, entry] };
    });
    resetForm();
  };

  const deleteEntry = (id) => {
    setData(prev => {
      const existing = prev[selKey] || [];
      const filtered = existing.filter(e => e.id !== id);
      const copy = { ...prev };
      if (filtered.length === 0) delete copy[selKey];
      else copy[selKey] = filtered;
      return copy;
    });
  };

  const startEdit = (entry) => {
    setAmount(String(entry.amount));
    setNote(entry.note);
    setCategory(entry.category);
    setEditingId(entry.id);
    setShowAdd(true);
  };

  const resetForm = () => {
    setAmount(""); setNote(""); setCategory("food"); setShowAdd(false); setEditingId(null);
  };

  const switchView = (v) => {
    setFadeIn(false);
    setTimeout(() => { setView(v); setFadeIn(true); }, 150);
  };

  const renderCalendar = () => {
    const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
          {DAYS_SHORT.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "#999", fontFamily: "'DM Mono', monospace", padding: "4px 0", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
          {days.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const dk = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const entries = data[dk] || [];
            const total = entries.reduce((s, e) => s + e.amount, 0);
            const isToday = dk === todayKey;
            const isSelected = dk === selKey;
            const hasSpend = total > 0;
            const maxDaily = 200;
            const intensity = Math.min(total / maxDaily, 1);

            return (
              <div key={dk} onClick={() => { setSelectedDate(new Date(y, m, day)); switchView("today"); }}
                style={{
                  aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: "10px", cursor: "pointer", position: "relative",
                  background: isSelected ? "#1a1a1a" : hasSpend ? `rgba(224, 122, 95, ${0.08 + intensity * 0.25})` : "rgba(0,0,0,0.02)",
                  border: isToday && !isSelected ? "1.5px solid #e07a5f" : "1.5px solid transparent",
                  transition: "all 0.2s ease",
                }}>
                <span style={{ fontSize: "13px", fontWeight: isToday ? "700" : "400", color: isSelected ? "#fff" : "#1a1a1a", fontFamily: "'DM Mono', monospace" }}>{day}</span>
                {hasSpend && <span style={{ fontSize: "8px", color: isSelected ? "rgba(255,255,255,0.7)" : "#e07a5f", fontFamily: "'DM Mono', monospace", marginTop: "1px", fontWeight: "600" }}>{fmt(total)}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const mon = getMonday(selectedDate);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      weekDays.push(d);
    }
    const maxBar = Math.max(...weekDays.map(d => (data[toKey(d)] || []).reduce((s, e) => s + e.amount, 0)), 1);

    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "180px", padding: "0 4px" }}>
        {weekDays.map(d => {
          const dk = toKey(d);
          const entries = data[dk] || [];
          const total = entries.reduce((s, e) => s + e.amount, 0);
          const isToday = dk === todayKey;
          const isSel = dk === selKey;
          const barH = total > 0 ? Math.max((total / maxBar) * 130, 12) : 4;

          return (
            <div key={dk} onClick={() => { setSelectedDate(d); switchView("today"); }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              {total > 0 && <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#1a1a1a", fontWeight: "600" }}>{fmt(total)}</span>}
              <div style={{
                width: "100%", height: `${barH}px`, borderRadius: "6px",
                background: isSel ? "#1a1a1a" : total > 0 ? "#e07a5f" : "#eee",
                opacity: total > 0 ? (isSel ? 1 : 0.7) : 0.4,
                transition: "all 0.3s ease",
              }} />
              <span style={{
                fontSize: "11px", fontFamily: "'DM Mono', monospace",
                color: isToday ? "#e07a5f" : "#999", fontWeight: isToday ? "700" : "400",
              }}>{DAYS_SHORT[(d.getDay() + 6) % 7]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getCategoryBreakdown = (entries) => {
    const map = {};
    entries.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const navigate = (dir) => {
    const d = new Date(selectedDate);
    if (view === "today") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const getTitle = () => {
    if (view === "today") {
      if (selKey === todayKey) return "Today";
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      if (selKey === toKey(yesterday)) return "Yesterday";
      return selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    if (view === "week") {
      const mon = getMonday(selectedDate);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return `${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const currentTotal = view === "today" ? dayTotal : view === "week" ? getWeekTotal() : getMonthTotal();

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: "#faf9f7", fontFamily: "'Instrument Sans', 'Helvetica Neue', sans-serif", color: "#1a1a1a", maxWidth: "460px", margin: "0 auto", position: "relative", paddingBottom: "100px", paddingTop: "env(safe-area-inset-top)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* header */}
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.02em", margin: 0 }}>spend.</h1>
          <div style={{ display: "flex", gap: "2px", background: "#f0efed", borderRadius: "10px", padding: "3px" }}>
            {[["today", "Day"], ["week", "Week"], ["month", "Month"]].map(([v, l]) => (
              <button key={v} onClick={() => switchView(v)}
                style={{
                  padding: "6px 14px", fontSize: "12px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.01em",
                  background: view === v ? "#fff" : "transparent",
                  color: view === v ? "#1a1a1a" : "#999",
                  boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}>{l}</button>
            ))}
          </div>
        </div>

        {/* date nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#999", padding: "4px 8px" }}>‹</button>
          <span style={{ fontSize: "14px", fontFamily: "'DM Mono', monospace", fontWeight: "400", color: "#666" }}>{getTitle()}</span>
          <button onClick={() => navigate(1)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: selKey >= todayKey && view === "today" ? "transparent" : "#999", padding: "4px 8px", pointerEvents: selKey >= todayKey && view === "today" ? "none" : "auto" }}>›</button>
        </div>

        {/* big total */}
        <div style={{ textAlign: "center", padding: "20px 0 28px", opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(6px)", transition: "all 0.25s ease" }}>
          <div style={{ fontSize: "52px", fontWeight: "700", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {currentTotal === 0 ? "$0" : fmt(currentTotal)}
          </div>
          <div style={{ fontSize: "12px", color: "#b0b0b0", marginTop: "6px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
            {view === "today" ? "today" : view === "week" ? "this week" : "this month"}
          </div>
        </div>
      </div>

      {/* content */}
      <div style={{ padding: "0 24px", opacity: fadeIn ? 1 : 0, transition: "opacity 0.25s ease" }}>
        {view === "month" && renderCalendar()}
        {view === "week" && renderWeek()}

        {view === "today" && (
          <div>
            {dayEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#ccc" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>○</div>
                <div style={{ fontSize: "13px", fontFamily: "'DM Mono', monospace" }}>No spending logged</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dayEntries.map((entry, i) => (
                  <div key={entry.id}
                    style={{
                      display: "flex", alignItems: "center", padding: "14px 16px", background: "#fff",
                      borderRadius: "12px", border: "1px solid rgba(0,0,0,0.04)",
                      animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                    }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", color: getCatColor(entry.category), fontWeight: "600",
                      position: "relative", flexShrink: 0,
                      background: `${getCatColor(entry.category)}18`,
                    }}>
                      {CATEGORIES.find(c => c.id === entry.category)?.icon}
                    </div>
                    <div style={{ flex: 1, marginLeft: "12px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>{entry.note || CATEGORIES.find(c => c.id === entry.category)?.label}</div>
                      <div style={{ fontSize: "11px", color: "#b0b0b0", fontFamily: "'DM Mono', monospace", marginTop: "2px" }}>{entry.time}</div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "600", fontFamily: "'DM Mono', monospace", marginRight: "8px" }}>{fmt(entry.amount)}</div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button onClick={() => startEdit(entry)} style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", color: "#ccc", padding: "4px" }}>✎</button>
                      <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", color: "#ccc", padding: "4px" }}>×</button>
                    </div>
                  </div>
                ))}

                {dayEntries.length > 1 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "8px", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                    {getCategoryBreakdown(dayEntries).map(([cat, total]) => (
                      <div key={cat} style={{ flex: total, background: getCatColor(cat), opacity: 0.6, borderRadius: "3px", transition: "flex 0.3s ease" }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view !== "today" && (() => {
          let allEntries = [];
          if (view === "week") {
            const mon = getMonday(selectedDate);
            for (let i = 0; i < 7; i++) {
              const d = new Date(mon); d.setDate(mon.getDate() + i);
              allEntries.push(...(data[toKey(d)] || []));
            }
          } else {
            const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
            Object.keys(data).forEach(k => {
              const d = parseKey(k);
              if (d.getFullYear() === y && d.getMonth() === m) allEntries.push(...data[k]);
            });
          }
          const breakdown = getCategoryBreakdown(allEntries);
          if (breakdown.length === 0) return null;
          const total = allEntries.reduce((s, e) => s + e.amount, 0);

          return (
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", gap: "4px", height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" }}>
                {breakdown.map(([cat, t]) => (
                  <div key={cat} style={{ flex: t, background: getCatColor(cat), opacity: 0.6, borderRadius: "3px" }} />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {breakdown.map(([cat, t]) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: getCatColor(cat) }} />
                      <span style={{ fontSize: "13px", color: "#666" }}>{CATEGORIES.find(c => c.id === cat)?.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "13px", fontFamily: "'DM Mono', monospace", fontWeight: "500" }}>{fmt(t)}</span>
                      <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#b0b0b0" }}>{Math.round(t / total * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* add modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div style={{
            background: "#faf9f7", borderRadius: "24px 24px 0 0", padding: "28px 24px calc(36px + env(safe-area-inset-bottom))",
            width: "100%", maxWidth: "460px", animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, letterSpacing: "-0.02em" }}>{editingId ? "Edit" : "Log"} spend</h2>
              <button onClick={resetForm} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>×</button>
            </div>

            <div style={{ position: "relative", marginBottom: "20px" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "28px", fontFamily: "'DM Mono', monospace", fontWeight: "500", color: "#ccc" }}>$</span>
              <input ref={inputRef} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%", padding: "16px 16px 16px 40px", fontSize: "28px", fontFamily: "'DM Mono', monospace",
                  fontWeight: "500", border: "2px solid #eee", borderRadius: "14px", background: "#fff",
                  outline: "none", boxSizing: "border-box", letterSpacing: "-0.02em",
                  transition: "border-color 0.2s", WebkitAppearance: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#e07a5f"}
                onBlur={e => e.target.style.borderColor = "#eee"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  style={{
                    padding: "12px 8px", border: "2px solid", borderRadius: "12px", cursor: "pointer",
                    borderColor: category === cat.id ? getCatColor(cat.id) : "#eee",
                    background: category === cat.id ? `${getCatColor(cat.id)}10` : "#fff",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    transition: "all 0.2s ease", fontFamily: "'Instrument Sans', sans-serif",
                  }}>
                  <span style={{ fontSize: "18px" }}>{cat.icon}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: category === cat.id ? getCatColor(cat.id) : "#999" }}>{cat.label}</span>
                </button>
              ))}
            </div>

            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              style={{
                width: "100%", padding: "14px 16px", fontSize: "14px", border: "2px solid #eee",
                borderRadius: "12px", background: "#fff", outline: "none", boxSizing: "border-box",
                fontFamily: "'Instrument Sans', sans-serif", marginBottom: "20px",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#e07a5f"}
              onBlur={e => e.target.style.borderColor = "#eee"}
              onKeyDown={e => { if (e.key === "Enter") addEntry(); }}
            />

            <button onClick={addEntry}
              style={{
                width: "100%", padding: "16px", fontSize: "15px", fontWeight: "700", border: "none",
                borderRadius: "14px", background: "#1a1a1a", color: "#fff", cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.01em",
                transition: "transform 0.1s ease",
              }}
              onMouseDown={e => e.target.style.transform = "scale(0.98)"}
              onMouseUp={e => e.target.style.transform = "scale(1)"}
            >
              {editingId ? "Update" : "Log it"}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!showAdd && (
        <button onClick={() => { setSelectedDate(new Date()); setShowAdd(true); }}
          style={{
            position: "fixed", bottom: "calc(28px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)",
            width: "60px", height: "60px", borderRadius: "50%", border: "none",
            background: "#1a1a1a", color: "#fff", fontSize: "28px", fontWeight: "300",
            cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            zIndex: 50,
          }}
        >+</button>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
      `}</style>
    </div>
  );
}
