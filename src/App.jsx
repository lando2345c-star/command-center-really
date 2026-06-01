import { useState, useEffect, useRef } from "react";

const C = {
  gold: "#F5A623", green: "#27AE60", blue: "#2980B9", purple: "#8E44AD",
  red: "#E74C3C", sun: "#F39C12", teal: "#16A085", bg: "#0B0D12",
  card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  jarvis: "#00D4FF",
};

const pct = (v, g) => Math.min(Math.round((v / g) * 100), 100);
const fmtMoney = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;
const fmtK = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;
const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const TODAY_KEY = new Date().toISOString().split("T")[0];
const TOMORROW = new Date(Date.now() + 86400000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const isWeekend = () => { const d = new Date().getDay(); return d === 0 || d === 6; };

const OUTCOMES = ["Sold", "Follow-Up", "Not Interested", "No Answer", "Callback"];
const OUTCOME_COLORS = { "Sold": C.green, "Follow-Up": C.gold, "Not Interested": C.red, "No Answer": C.purple, "Callback": C.blue };
const PRODUCTS = ["Print", "Digital", "Radio", "Bundle"];

// ── UI Atoms ─────────────────────────────────────────────────
function Ring({ pct: p, size = 80, stroke = 8, color = C.gold, label }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, dash = (Math.min(p, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
      <foreignObject x={0} y={0} width={size} height={size} style={{ transform: "rotate(90deg)" }}>
        <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: size * 0.17, fontWeight: 800, color, lineHeight: 1 }}>{p}%</span>
          {label && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{label}</span>}
        </div>
      </foreignObject>
    </svg>
  );
}

function Bar({ values, color, h = 44 }) {
  const mx = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 4, minHeight: 3,
          background: i === values.length - 1 ? color : "rgba(255,255,255,0.1)",
          height: `${(v / mx) * 100}%`, transition: "height 0.9s ease" }} />
      ))}
    </div>
  );
}

function PBar({ value, goal, color }) {
  return (
    <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", borderRadius: 5, background: color, width: `${pct(value, goal)}%`, transition: "width 1s ease" }} />
    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "16px 18px", backdropFilter: "blur(10px)", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function Tag({ label, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${color}20`, color, border: `1px solid ${color}35`, letterSpacing: 0.4 }}>{label}</span>;
}

function Btn({ children, onClick, color = C.gold, outline = false, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "11px 16px", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700,
      background: disabled ? "rgba(255,255,255,0.06)" : outline ? `${color}15` : color,
      border: `1px solid ${disabled ? "rgba(255,255,255,0.1)" : outline ? color + "44" : "transparent"}`,
      color: disabled ? "rgba(255,255,255,0.3)" : outline ? color : "#000", opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

function TInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: "#EEF0F5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161924", border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: 28, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 10, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── FB Connect ───────────────────────────────────────────────
function FBConnect({ onConnect, onSkip }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const handleConnect = () => {
    if (!token.trim()) { setError("Please paste your access token first."); return; }
    if (!token.trim().startsWith("EAA")) { setError("Token should start with EAA..."); return; }
    onConnect({ id: "102907851890377", token: token.trim(), name: "Thumb Forecast", followers: 13515 });
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Sora','DM Sans',sans-serif", color: "#EEF0F5" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 14px", boxShadow: `0 8px 32px rgba(41,128,185,0.4)` }}>📱</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Connect Thumb Forecast</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Stored only in your browser session.</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, marginBottom: 12 }}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(41,128,185,0.08)", border: `1px solid ${C.blue}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, marginBottom: 3 }}>PAGE ALREADY SET</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Thumb Forecast</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>ID: 102907851890377</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 700 }}>PASTE YOUR ACCESS TOKEN</div>
            <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your token here — starts with EAA..." rows={4}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: "#EEF0F5", fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "monospace", lineHeight: 1.5 }} />
          </div>
          {error && <div style={{ padding: "10px 14px", background: "rgba(231,76,60,0.1)", border: `1px solid ${C.red}30`, borderRadius: 10, fontSize: 12, color: C.red, marginBottom: 14 }}>{error}</div>}
          <button onClick={handleConnect} disabled={!token.trim()} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: token.trim() ? "pointer" : "not-allowed", background: token.trim() ? `linear-gradient(135deg,${C.blue},${C.purple})` : "rgba(255,255,255,0.08)", color: token.trim() ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 800 }}>
            🔗 Connect & Test
          </button>
        </div>
        <button onClick={onSkip} style={{ width: "100%", padding: 12, borderRadius: 14, background: "transparent", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>Skip — use sample data</button>
      </div>
    </div>
  );
}

// ── Goal Editor ──────────────────────────────────────────────
function GoalEditor({ goals, onSave, onClose }) {
  const [vals, setVals] = useState(goals.reduce((a, g) => ({ ...a, [g.key]: String(g.value) }), {}));
  return (
    <Modal title="🎯 Edit Goals" onClose={onClose}>
      {goals.map(g => (
        <div key={g.key} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{g.label}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>now: {g.current} {g.unit || ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" value={vals[g.key]} onChange={e => setVals(v => ({ ...v, [g.key]: e.target.value }))}
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: "#EEF0F5", fontSize: 14, outline: "none" }} />
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", minWidth: 40 }}>{g.unit || ""}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <Btn outline color="rgba(255,255,255,0.3)" onClick={onClose} style={{ flex: 1, color: "#aaa" }}>Cancel</Btn>
        <Btn onClick={() => onSave(vals)} style={{ flex: 1 }}>Save Goals</Btn>
      </div>
    </Modal>
  );
}

// ── Nutrition Scanner ────────────────────────────────────────
function NutritionScanner({ onLog, onClose }) {
  const [stage, setStage] = useState("idle");
  const [imgSrc, setImgSrc] = useState(null);
  const [imgB64, setImgB64] = useState(null);
  const [result, setResult] = useState(null);
  const [desc, setDesc] = useState("");
  const fileRef = useRef();
  const handleFile = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => { setImgSrc(e.target.result); setImgB64(e.target.result.split(",")[1]); };
    r.readAsDataURL(file);
  };
  const analyze = async () => {
    setStage("analyzing");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgB64 } },
          { type: "text", text: `Analyze this meal photo${desc ? ` (${desc})` : ""} and respond ONLY with JSON: {"meal":"name","calories":0,"protein":0,"carbs":0,"fat":0,"items":[{"name":"item","calories":0}],"notes":"tip","confidence":"high"}` }
        ] }] }) });
      const data = await resp.json();
      setResult(JSON.parse(data.content?.map(c => c.text || "").join("").replace(/```json|```/g, "").trim()));
      setStage("done");
    } catch (e) { setStage("error"); }
  };
  return (
    <Modal title="📸 AI Nutrition Scanner" onClose={onClose}>
      {stage === "idle" && (<>
        <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${imgSrc ? C.teal : C.border}`, borderRadius: 16, padding: imgSrc ? "0" : "32px 16px", textAlign: "center", cursor: "pointer", marginBottom: 14, overflow: "hidden" }}>
          {imgSrc ? <img src={imgSrc} alt="meal" style={{ width: "100%", borderRadius: 14, display: "block" }} /> : <><div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div><div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Tap to upload a photo</div></>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        {imgSrc && (<><TInput label="Optional: describe your meal" value={desc} onChange={setDesc} placeholder="e.g. medium salmon" />
          <div style={{ display: "flex", gap: 10 }}><Btn outline color="rgba(255,255,255,0.3)" onClick={() => { setImgSrc(null); setImgB64(null); setDesc(""); }} style={{ flex: 1, color: "#aaa" }}>Retake</Btn><Btn onClick={analyze} color={C.teal} style={{ flex: 1 }}>🔍 Analyze</Btn></div></>)}
      </>)}
      {stage === "analyzing" && <div style={{ textAlign: "center", padding: "32px 0" }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div><div style={{ fontSize: 15, fontWeight: 700, color: C.teal }}>Analyzing your meal…</div></div>}
      {stage === "done" && result && (<>
        {imgSrc && <img src={imgSrc} alt="meal" style={{ width: "100%", borderRadius: 14, marginBottom: 16 }} />}
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{result.meal}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "14px 0" }}>
          {[{ l: "Cal", v: result.calories, c: C.teal }, { l: "Protein", v: result.protein, c: C.purple }, { l: "Carbs", v: result.carbs, c: C.gold }, { l: "Fat", v: result.fat, c: C.red }].map(({ l, v, c }) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        {result.notes && <div style={{ padding: "10px 14px", background: "rgba(22,160,133,0.08)", border: `1px solid ${C.teal}25`, borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, margin: "14px 0" }}>💡 {result.notes}</div>}
        <div style={{ display: "flex", gap: 10 }}><Btn outline color="rgba(255,255,255,0.3)" onClick={onClose} style={{ flex: 1, color: "#aaa" }}>Discard</Btn><Btn onClick={() => { onLog(result); onClose(); }} color={C.teal} style={{ flex: 1 }}>✅ Log Meal</Btn></div>
      </>)}
      {stage === "error" && <div style={{ textAlign: "center", padding: "32px 0" }}><div style={{ fontSize: 36, marginBottom: 12 }}>😕</div><Btn onClick={() => setStage("idle")} color={C.teal}>Try Again</Btn></div>}
    </Modal>
  );
}

// ── Contact Log Modal ────────────────────────────────────────
function ContactLogModal({ onSave, onClose, existing = null }) {
  const [form, setForm] = useState(existing || { business: "", contact: "", product: "Print", outcome: "Follow-Up", value: "", notes: "", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title={existing ? "✏️ Edit Visit" : "📋 Log Visit"} onClose={onClose}>
      <TInput label="Business Name *" value={form.business} onChange={v => set("business", v)} placeholder="e.g. Sunrise Bakery" />
      <TInput label="Contact Name" value={form.contact} onChange={v => set("contact", v)} placeholder="e.g. John Smith" />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>PRODUCT PITCHED</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRODUCTS.map(p => (
            <button key={p} onClick={() => set("product", p)} style={{ padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1px solid ${form.product === p ? C.blue + "88" : C.border}`, background: form.product === p ? `${C.blue}20` : "rgba(255,255,255,0.04)", color: form.product === p ? C.blue : "rgba(255,255,255,0.4)" }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>OUTCOME</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {OUTCOMES.map(o => (
            <button key={o} onClick={() => set("outcome", o)} style={{ padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1px solid ${form.outcome === o ? OUTCOME_COLORS[o] + "88" : C.border}`, background: form.outcome === o ? `${OUTCOME_COLORS[o]}20` : "rgba(255,255,255,0.04)", color: form.outcome === o ? OUTCOME_COLORS[o] : "rgba(255,255,255,0.4)" }}>{o}</button>
          ))}
        </div>
      </div>

      <TInput label="Deal Value ($)" type="number" value={form.value} onChange={v => set("value", v)} placeholder="e.g. 800" />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5, fontWeight: 600 }}>NOTES / WHAT WAS DISCUSSED</div>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="What did you talk about? Any objections? Follow-up needed?" rows={3}
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: "#EEF0F5", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5, fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn outline color="rgba(255,255,255,0.3)" onClick={onClose} style={{ flex: 1, color: "#aaa" }}>Cancel</Btn>
        <Btn onClick={() => { if (!form.business) return; onSave({ ...form, id: existing?.id || Date.now() }); onClose(); }} style={{ flex: 1 }}>Save Visit</Btn>
      </div>
    </Modal>
  );
}

// ── AI Chat ──────────────────────────────────────────────────
const PERSONAS = {
  sales: {
    label: "Sales Coach", icon: "💼", color: C.gold,
    accent: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)",
    buildPrompt: (d, logs) => {
      const todayLog = logs[TODAY_KEY] || [];
      const visitSummary = todayLog.length > 0
        ? todayLog.map(v => `${v.business} (${v.product}, ${v.outcome}${v.value ? ", $" + v.value : ""}${v.notes ? " — " + v.notes : ""})`).join("; ")
        : "No visits logged yet today";
      const soldCount = todayLog.filter(v => v.outcome === "Sold").length;
      const followUpCount = todayLog.filter(v => v.outcome === "Follow-Up").length;
      return `You are an expert newspaper advertising sales coach inside a personal dashboard app. Help the user succeed selling print, radio, and digital ads.

LIVE DASHBOARD DATA:
- Revenue: $${d.sales.revenue} of $${d.sales.revenueGoal} goal (${pct(d.sales.revenue, d.sales.revenueGoal)}%)
- Calls today: ${d.sales.calls}/${d.sales.callsGoal} | Deals: ${d.sales.deals}/${d.sales.dealsGoal}
- Pipeline: ${d.sales.pipeline.map(p => `${p.name} $${p.value} ${p.stage} ${p.product}`).join("; ")}

TODAY'S VISIT LOG (${todayLog.length}/5 visits done):
${visitSummary}
- Sold today: ${soldCount} | Follow-ups set: ${followUpCount}

Today: ${TODAY}

Use their actual visit data when giving advice. Be concise, specific, and encouraging. Reference real businesses they visited. Short paragraphs.`;
    },
    starters: ["How did I do today based on my visits?", "Which of today's follow-ups should I prioritize?", "What should I focus on to hit my revenue goal?", "Help me plan tomorrow's visits", "How do I handle the objections I got today?"]
  },
  facebook: {
    label: "FB Thumb Forecast Coach", icon: "📱", color: C.blue,
    accent: "rgba(41,128,185,0.12)", border: "rgba(41,128,185,0.25)",
    buildPrompt: (d, _, fb) => `You are a Facebook brand growth specialist for the Thumb Forecast page — a meteorology/weather brand by a Central Michigan University student with ${fb?.followers || "13,515"} followers.
Live stats: Reach ${d.facebook.reach}/${d.facebook.reachGoal} goal. Engagement ${d.facebook.engagement}%/${d.facebook.engGoal}% goal. Posts today ${d.facebook.posts}/${d.facebook.postsGoal}.
Focus ONLY on: thumbnail strategy, reach and engagement growth, content calendars, Reels strategy, and building the weather brand to attract ad sales clients. Be specific, creative, and tactical.`,
    starters: ["What thumbnail style gets the most clicks right now?", "How do I grow from 13K to 20K followers?", "Give me a 7-day content calendar", "What should my thumb look like for a weather post?", "How do I turn my weather brand into ad sales leads?"]
  }
};

function AIChat({ mode, dashData, contactLogs, fbData, onClose }) {
  const persona = PERSONAS[mode];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async text => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const history = [...messages, { role: "user", content: msg }];
    setMessages(history);
    setLoading(true);

    let sys = "";
    try {
      sys = mode === "sales"
        ? persona.buildPrompt(dashData, contactLogs)
        : persona.buildPrompt(dashData, null, fbData);
    } catch (e) {
      setMessages(h => [...h, { role: "assistant", content: "Error building context. Try again." }]);
      setLoading(false);
      return;
    }

    try {
      // Inject system context as first user message (avoids proxy issues with system field)
      const messagesWithContext = [
        { role: "user", content: `[Your role and context for this conversation: ${sys}]

Ready — what's your first question?` },
        { role: "assistant", content: "Got it — I'm ready. What would you like to discuss?" },
        ...history.map(m => ({ role: m.role, content: m.content }))
      ];

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: messagesWithContext
        })
      });

      const raw = await resp.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { setMessages(h => [...h, { role: "assistant", content: "Unexpected response format. Try again." }]); setLoading(false); return; }

      if (data.error) {
        setMessages(h => [...h, { role: "assistant", content: `API Error: ${data.error.message}` }]);
      } else if (data.content?.length > 0) {
        const reply = data.content.filter(c => c.type === "text").map(c => c.text).join("") || "No reply — try again.";
        setMessages(h => [...h, { role: "assistant", content: reply }]);
      } else {
        setMessages(h => [...h, { role: "assistant", content: "Empty response — try again." }]);
      }
    } catch (e) {
      setMessages(h => [...h, { role: "assistant", content: `Network error: ${e.message || "unknown"}` }]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 540, height: "92vh", display: "flex", flexDirection: "column", background: "#0F1118", borderRadius: "28px 28px 0 0", border: `1px solid ${persona.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", background: `linear-gradient(135deg,${persona.accent},transparent)`, borderBottom: `1px solid ${persona.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${persona.color},${persona.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 4px 16px ${persona.color}40` }}>{persona.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{persona.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Powered by Claude · Live page data</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {messages.length > 0 && <button onClick={() => setMessages([])} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.4)", borderRadius: 10, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Clear</button>}
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 10, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>x</button>
            </div>
          </div>
          {mode === "sales" && (
            <div style={{ marginTop: 10, padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                {(contactLogs[TODAY_KEY] || []).length}/5 visits today · {(contactLogs[TODAY_KEY] || []).filter(v => v.outcome === "Sold").length} sold
              </span>
            </div>
          )}
          {mode === "facebook" && fbData && (
            <div style={{ marginTop: 10, padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                Live · {fbData.name} · {fbData.followers?.toLocaleString()} followers
              </span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
              <div style={{ textAlign: "center", paddingBottom: 8 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{persona.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{mode === "sales" ? "I can see your visits — how can I help?" : "How can I grow your Thumb Forecast reach?"}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>I have access to your live Thumb Forecast data.</div>
              </div>
              {persona.starters.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 14, background: persona.accent, border: `1px solid ${persona.border}`, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: 13, lineHeight: 1.4 }}>{s}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: persona.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{persona.icon}</div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{persona.label}</span>
                </div>
              )}
              <div style={{ maxWidth: "88%", padding: "12px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? `linear-gradient(135deg,${persona.color},${persona.color}cc)` : "rgba(255,255,255,0.07)",
                border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
                color: m.role === "user" ? "#000" : "rgba(255,255,255,0.87)", fontSize: 14, lineHeight: 1.65, fontWeight: m.role === "user" ? 600 : 400 }}>
                {m.content.split("\n").map((line, li) => <span key={li}>{line}{li < m.content.split("\n").length - 1 && <br />}</span>)}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: persona.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{persona.icon}</div>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "12px 16px 20px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: "rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={mode === "sales" ? "Ask about your visits, pipeline, strategy…" : "Ask about thumbnails, reach, content ideas…"}
              rows={1} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", color: "#EEF0F5", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, fontFamily: "inherit", maxHeight: 100, overflowY: "auto" }} />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: 13, border: "none", cursor: "pointer", background: input.trim() && !loading ? persona.color : "rgba(255,255,255,0.08)", color: input.trim() && !loading ? "#000" : "rgba(255,255,255,0.3)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>↑</button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8, textAlign: "center" }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}

// ── INITIAL DATA ─────────────────────────────────────────────
const INIT = {
  steps: { current: 6240, goal: 10000, history: [4200, 7800, 9100, 5500, 8300, 6240] },
  eating: { calories: 1640, calGoal: 2200, protein: 88, proteinGoal: 150, water: 5, waterGoal: 8, history: [1800, 2100, 1500, 2300, 1950, 1640], meals: [] },
  lifting: { sessions: 2, sessionsGoal: 4, history: [6200, 9800, 7100, 11200, 9500, 8400], log: [] },
  sun: { minutes: 25, goal: 30, weekendGoal: 60, history: [0, 40, 15, 0, 20, 25] },
  facebook: { reach: 328591, reachGoal: 500000, pageViews: 0, newFollowers: 0, engagement: 4.2, engGoal: 8, posts: 3, postsGoal: 5, history: [280000, 310000, 295000, 315000, 320000, 328591],
    tips: ["Post between 7–9 PM — your audience is most active then", "Reels get 3x more reach than static posts", "Add a question to your caption to boost comments", "Reply to every comment in the first hour", "Bundle ad success stories into carousel posts"] },
  sales: { calls: 8, callsGoal: 15, deals: 2, dealsGoal: 5, revenue: 1400, revenueGoal: 5000, history: [800, 1200, 600, 2100, 1800, 1400],
    planArea: "", planProduct: "Print", planNotes: "",
    pipeline: [{ id: 1, name: "Riverside Auto", value: 800, stage: "Proposal", product: "Print", notes: "" }, { id: 2, name: "Bloom Salon", value: 400, stage: "Follow-up", product: "Digital", notes: "" }, { id: 3, name: "Cruz Law Group", value: 1200, stage: "Negotiation", product: "Radio", notes: "" }, { id: 4, name: "Peak Gym", value: 600, stage: "New Lead", product: "Digital", notes: "" }] },
  streak: 5,
  tasks: { today: [], tomorrow: [] },
  energy: 72,
};

const STAGE_C = { "New Lead": C.blue, "Follow-up": C.purple, "Proposal": C.gold, "Negotiation": C.green, "Closed": C.green };
const PROD_C = { Print: "#E67E22", Digital: C.blue, Radio: C.purple, Bundle: C.green };
const ALL_STAGES = ["New Lead", "Follow-up", "Proposal", "Negotiation", "Closed"];

// ════════════════════════════════════════════════════════════
export default function App() {
  const [d, setD] = useState(INIT);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({});
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [aiMode, setAiMode] = useState(null);
  const [fbCreds, setFbCreds] = useState(() => {
    try {
      const saved = localStorage.getItem('thumbforecast_creds');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [fbLoading, setFbLoading] = useState(false);
  const [showFBConnect, setShowFBConnect] = useState(false);
  // Contact logs: { "2026-05-31": [...visits] }
  const [contactLogs, setContactLogs] = useState({});
  const [showContactLog, setShowContactLog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [logViewDate, setLogViewDate] = useState(TODAY_KEY);
  const [newTask, setNewTask] = useState("");
  const [newTaskTmr, setNewTaskTmr] = useState("");
  const weekend = isWeekend();

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % d.facebook.tips.length), 6000);
    return () => clearInterval(t);
  }, []);

  // FB live fetch
  useEffect(() => {
    if (!fbCreds) return;
    const fetchFB = async () => {
      setFbLoading(true);
      try {
        const insightsUrl = `https://graph.facebook.com/v19.0/${fbCreds.id}/insights?metric=page_impressions_unique,page_impressions,page_fan_adds,page_fans&period=day&access_token=${fbCreds.token}`;
        const r = await fetch(insightsUrl);
        const json = await r.json();

        if (json.data) {
          const imp  = json.data.find(m => m.name === "page_impressions_unique");
          const views = json.data.find(m => m.name === "page_impressions");
          const newFans = json.data.find(m => m.name === "page_fan_adds");
          const fans = json.data.find(m => m.name === "page_fans");
          const reach = imp?.values?.slice(-1)[0]?.value || 0;
          const pageViews = views?.values?.slice(-1)[0]?.value || 0;
          const newFollowers = newFans?.values?.slice(-1)[0]?.value || 0;
          const followers = fans?.values?.slice(-1)[0]?.value || fbCreds.followers || 0;
          // Build 6 day history from API values
          const rawHist = imp?.values || [];
          const hist = rawHist.length >= 2
            ? rawHist.slice(-6).map(v => v.value || 0)
            : null;
          setD(prev => ({ ...prev, facebook: { ...prev.facebook, reach, pageViews, newFollowers, history: hist && hist.length >= 2 ? hist : prev.facebook.history } }));
          setFbCreds(prev => ({ ...prev, followers }));
        }
      } catch (e) { console.log("FB error", e); }
      setFbLoading(false);
    };
    fetchFB();
    const interval = setInterval(fetchFB, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fbCreds?.id]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  const openLog = (field, cur) => { setModal("log"); setForm({ field, value: String(cur) }); };

  const saveLog = () => {
    const v = parseFloat(form.value);
    if (isNaN(v)) return;
    setD(prev => { const n = JSON.parse(JSON.stringify(prev)); const [s, k] = form.field.split("."); n[s][k] = v; return n; });
    setModal(null); setForm({}); showToast("✅ Saved!");
  };

  const saveContact = contact => {
    setContactLogs(prev => {
      const dayLogs = prev[TODAY_KEY] || [];
      const exists = dayLogs.find(v => v.id === contact.id);
      const updated = exists ? dayLogs.map(v => v.id === contact.id ? contact : v) : [...dayLogs, contact];
      // Auto-update sales if sold
      if (contact.outcome === "Sold" && contact.value) {
        setD(dd => ({ ...dd, sales: { ...dd.sales, revenue: dd.sales.revenue + parseFloat(contact.value || 0), deals: dd.sales.deals + (exists ? 0 : 1) } }));
      }
      return { ...prev, [TODAY_KEY]: updated };
    });
    showToast(contact.outcome === "Sold" ? "🎉 Sale logged!" : "📋 Visit saved!");
  };

  const deleteContact = (id, date) => {
    setContactLogs(prev => ({ ...prev, [date]: (prev[date] || []).filter(v => v.id !== id) }));
    showToast("🗑️ Removed");
  };

  const addTask = (which) => {
    const text = which === "today" ? newTask : newTaskTmr;
    if (!text.trim()) return;
    setD(prev => ({ ...prev, tasks: { ...prev.tasks, [which]: [...prev.tasks[which], { id: Date.now(), text: text.trim(), done: false }] } }));
    which === "today" ? setNewTask("") : setNewTaskTmr("");
  };

  const toggleTask = (which, id) => {
    setD(prev => ({ ...prev, tasks: { ...prev.tasks, [which]: prev.tasks[which].map(t => t.id === id ? { ...t, done: !t.done } : t) } }));
  };

  const removeTask = (which, id) => {
    setD(prev => ({ ...prev, tasks: { ...prev.tasks, [which]: prev.tasks[which].filter(t => t.id !== id) } }));
  };

  const logMeal = result => {
    setD(prev => { const n = JSON.parse(JSON.stringify(prev)); n.eating.calories = Math.round(n.eating.calories + (result.calories || 0)); n.eating.protein = Math.round(n.eating.protein + (result.protein || 0)); n.eating.meals.unshift({ name: result.meal, calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }); return n; });
    showToast(`✅ Logged: ${result.meal}`);
  };

  const saveLead = () => {
    if (!form.name) return;
    setD(prev => { const n = JSON.parse(JSON.stringify(prev)); n.sales.pipeline.push({ id: Date.now(), name: form.name, value: parseFloat(form.value) || 0, stage: form.stage || "New Lead", product: form.product || "Print", notes: form.notes || "" }); return n; });
    setModal(null); setForm({}); showToast("🎯 Lead added!");
  };

  const saveLift = () => {
    if (!form.exercise) return;
    setD(prev => { const n = JSON.parse(JSON.stringify(prev)); n.lifting.log.unshift({ exercise: form.exercise, sets: form.sets || "", reps: form.reps || "", weight: form.weight || "", date: new Date().toLocaleDateString() }); n.lifting.sessions = Math.min(n.lifting.sessions + 1, n.lifting.sessionsGoal * 2); return n; });
    setModal(null); setForm({}); showToast("💪 Logged!");
  };

  const removeLead = id => { setD(prev => ({ ...prev, sales: { ...prev.sales, pipeline: prev.sales.pipeline.filter(p => p.id !== id) } })); showToast("🗑️ Removed"); };

  const goalsForTab = () => {
    if (tab === "wellness") return [
      { key: "steps.goal", label: "Daily Steps", value: d.steps.goal, current: d.steps.current, color: C.green, unit: "steps" },
      { key: "eating.calGoal", label: "Calories", value: d.eating.calGoal, current: d.eating.calories, color: C.teal, unit: "kcal" },
      { key: "eating.proteinGoal", label: "Protein", value: d.eating.proteinGoal, current: d.eating.protein, color: C.purple, unit: "g" },
      { key: "eating.waterGoal", label: "Water", value: d.eating.waterGoal, current: d.eating.water, color: C.blue, unit: "cups" },
      { key: "lifting.sessionsGoal", label: "Lift Sessions", value: d.lifting.sessionsGoal, current: d.lifting.sessions, color: C.red, unit: "sessions" },
      { key: "sun.goal", label: "Weekday Sun", value: d.sun.goal, current: d.sun.minutes, color: C.sun, unit: "min" },
      { key: "sun.weekendGoal", label: "Weekend Sun", value: d.sun.weekendGoal, current: d.sun.minutes, color: C.sun, unit: "min" }
    ];
    if (tab === "facebook") return [
      { key: "facebook.reachGoal", label: "Reach Goal", value: d.facebook.reachGoal, current: d.facebook.reach, color: C.blue, unit: "people" },
      { key: "facebook.engGoal", label: "Engagement Goal", value: d.facebook.engGoal, current: d.facebook.engagement, color: C.purple, unit: "%" },
      { key: "facebook.postsGoal", label: "Daily Posts", value: d.facebook.postsGoal, current: d.facebook.posts, color: C.gold, unit: "posts" }
    ];
    if (tab === "sales") return [
      { key: "sales.callsGoal", label: "Daily Calls", value: d.sales.callsGoal, current: d.sales.calls, color: C.blue, unit: "calls" },
      { key: "sales.dealsGoal", label: "Monthly Deals", value: d.sales.dealsGoal, current: d.sales.deals, color: C.green, unit: "deals" },
      { key: "sales.revenueGoal", label: "Monthly Revenue", value: d.sales.revenueGoal, current: d.sales.revenue, color: C.gold, unit: "$" }
    ];
    return [
      { key: "steps.goal", label: "Steps", value: d.steps.goal, current: d.steps.current, color: C.green, unit: "steps" },
      { key: "eating.calGoal", label: "Calories", value: d.eating.calGoal, current: d.eating.calories, color: C.teal, unit: "kcal" },
      { key: "lifting.sessionsGoal", label: "Lift Sessions", value: d.lifting.sessionsGoal, current: d.lifting.sessions, color: C.red, unit: "sessions" },
      { key: "sales.revenueGoal", label: "Revenue", value: d.sales.revenueGoal, current: d.sales.revenue, color: C.gold, unit: "$" }
    ];
  };

  const saveGoals = vals => {
    setD(prev => { const n = JSON.parse(JSON.stringify(prev)); Object.entries(vals).forEach(([key, val]) => { const v = parseFloat(val); if (!isNaN(v)) { const [s, k] = key.split("."); n[s][k] = v; } }); return n; });
    setShowGoalEditor(false); showToast("🎯 Goals updated!");
  };

  const todayVisits = contactLogs[TODAY_KEY] || [];
  const visitGoal = 5;
  const soldToday = todayVisits.filter(v => v.outcome === "Sold").length;

  if (showFBConnect) return <FBConnect onConnect={creds => {
    setFbCreds(creds);
    try { localStorage.setItem('thumbforecast_creds', JSON.stringify(creds)); } catch {}
    setShowFBConnect(false);
    showToast(`✅ Connected: ${creds.name}!`);
  }} onSkip={() => setShowFBConnect(false)} />;

  const TABS = ["overview", "sales", "wellness", "facebook"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: "#EEF0F5", fontFamily: "'Sora','DM Sans','Segoe UI',sans-serif", paddingBottom: 80, position: "relative", overflowX: "hidden" }}>
      {/* BG Glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -140, left: -120, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,166,35,0.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -100, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(41,128,185,0.06) 0%,transparent 70%)" }} />
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: "#1C2030", border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 22px", zIndex: 9999, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{toast}</div>}

      {/* Modals */}
      {showGoalEditor && <GoalEditor goals={goalsForTab()} onSave={saveGoals} onClose={() => setShowGoalEditor(false)} />}
      {showScanner && <NutritionScanner onLog={logMeal} onClose={() => setShowScanner(false)} />}
      {aiMode && <AIChat mode={aiMode} dashData={d} contactLogs={contactLogs} fbData={fbCreds} onClose={() => setAiMode(null)} />}
      {showContactLog && <ContactLogModal onSave={saveContact} onClose={() => setShowContactLog(false)} />}
      {editingContact && <ContactLogModal existing={editingContact} onSave={saveContact} onClose={() => setEditingContact(null)} />}

      {modal === "log" && <Modal title="Update Value" onClose={() => setModal(null)}><TInput label="New value" type="number" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} /><div style={{ display: "flex", gap: 10 }}><Btn outline color="rgba(255,255,255,0.3)" onClick={() => setModal(null)} style={{ flex: 1, color: "#aaa" }}>Cancel</Btn><Btn onClick={saveLog} style={{ flex: 1 }}>Save</Btn></div></Modal>}

      {modal === "lead" && (
        <Modal title="➕ Add New Lead" onClose={() => setModal(null)}>
          <TInput label="Business Name *" value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Sunrise Bakery" />
          <TInput label="Deal Value ($)" type="number" value={form.value || ""} onChange={v => setForm(f => ({ ...f, value: v }))} placeholder="750" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Product</div>
            <div style={{ display: "flex", gap: 8 }}>{["Print", "Digital", "Radio"].map(p => (<button key={p} onClick={() => setForm(f => ({ ...f, product: p }))} style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, border: `1px solid ${form.product === p ? PROD_C[p] + "88" : C.border}`, background: form.product === p ? `${PROD_C[p]}20` : "rgba(255,255,255,0.04)", color: form.product === p ? PROD_C[p] : "rgba(255,255,255,0.4)" }}>{p}</button>))}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Stage</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{ALL_STAGES.slice(0, 4).map(s => (<button key={s} onClick={() => setForm(f => ({ ...f, stage: s }))} style={{ padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1px solid ${form.stage === s ? STAGE_C[s] + "88" : C.border}`, background: form.stage === s ? `${STAGE_C[s]}20` : "rgba(255,255,255,0.04)", color: form.stage === s ? STAGE_C[s] : "rgba(255,255,255,0.4)" }}>{s}</button>))}</div>
          </div>
          <TInput label="Notes" value={form.notes || ""} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Any details..." />
          <div style={{ display: "flex", gap: 10 }}><Btn outline color="rgba(255,255,255,0.3)" onClick={() => setModal(null)} style={{ flex: 1, color: "#aaa" }}>Cancel</Btn><Btn onClick={saveLead} style={{ flex: 1 }}>Add Lead</Btn></div>
        </Modal>
      )}

      {modal === "lift" && (
        <Modal title="💪 Log Workout" onClose={() => setModal(null)}>
          <TInput label="Exercise" value={form.exercise || ""} onChange={v => setForm(f => ({ ...f, exercise: v }))} placeholder="e.g. Bench Press" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["Sets", "sets", "3"], ["Reps", "reps", "10"], ["lbs", "weight", "135"]].map(([lbl, key, ph]) => (
              <div key={key}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5, fontWeight: 600 }}>{lbl}</div>
                <input type="number" value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 10px", color: "#EEF0F5", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}><Btn outline color="rgba(255,255,255,0.3)" onClick={() => setModal(null)} style={{ flex: 1, color: "#aaa" }}>Cancel</Btn><Btn onClick={saveLift} color={C.red} style={{ flex: 1 }}>Log It</Btn></div>
        </Modal>
      )}

      {/* ── HEADER ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "26px 18px 0" }}>

        {/* JARVIS Energy Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 3 }}>Command Center</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{weekend ? "Weekend Warrior! ☀️" : "Let's get it. 🚀"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{TODAY}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(245,166,35,0.12)", border: `1px solid ${C.gold}33`, borderRadius: 20, padding: "5px 10px" }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.gold }}>{d.streak}d</span>
            </div>
            <button onClick={() => setShowGoalEditor(true)} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>🎯 Goals</button>
          </div>
        </div>

        {/* Energy + Visit Progress */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {/* Energy Ring */}
          <div style={{ background: "rgba(0,212,255,0.05)", border: `1px solid ${C.jarvis}22`, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <Ring pct={d.energy} size={60} stroke={6} color={C.jarvis} />
            <div>
              <div style={{ fontSize: 10, color: C.jarvis, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Energy</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2 }}>{d.energy < 40 ? "Rest Up" : d.energy < 70 ? "Steady" : "Peak"}</div>
              <button onClick={() => openLog("energy", d.energy)} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>tap to update</button>
            </div>
          </div>
          {/* Visits Today */}
          <div style={{ background: "rgba(39,174,96,0.05)", border: `1px solid ${C.green}22`, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <Ring pct={pct(todayVisits.length, visitGoal)} size={60} stroke={6} color={C.green} />
            <div>
              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Visits</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2 }}>{todayVisits.length}/{visitGoal}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{soldToday} sold today</div>
            </div>
          </div>
        </div>

        {/* FB Live Bar */}
        {fbCreds ? (
          <div style={{ marginBottom: 12, padding: "9px 14px", background: "rgba(39,174,96,0.08)", border: `1px solid ${C.green}25`, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: fbLoading ? "#F39C12" : C.green, boxShadow: `0 0 8px ${fbLoading ? "#F39C12" : C.green}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: fbLoading ? "#F39C12" : C.green }}>{fbLoading ? "Syncing…" : "Live"}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>· {fbCreds.name} · {fbCreds.followers?.toLocaleString()} followers</span>
            </div>
            <button onClick={() => setShowFBConnect(true)} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Reconnect</button>
          </div>
        ) : (
          <button onClick={() => setShowFBConnect(true)} style={{ width: "100%", marginBottom: 12, padding: "10px 16px", borderRadius: 14, background: "rgba(41,128,185,0.1)", border: `2px dashed ${C.blue}44`, color: C.blue, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>📱</span> Connect Thumb Forecast · Live Data
          </button>
        )}

        {/* AI Launchers */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button onClick={() => setAiMode("sales")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, background: "rgba(245,166,35,0.1)", border: `1px solid ${C.gold}35`, color: C.gold, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <span style={{ fontSize: 16 }}>💼</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 800 }}>Sales Coach</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>Reads your visit log</div>
            </div>
            <span style={{ marginLeft: "auto", opacity: 0.5 }}>›</span>
          </button>
          <button onClick={() => setAiMode("facebook")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, background: "rgba(41,128,185,0.1)", border: `1px solid ${C.blue}35`, color: C.blue, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <span style={{ fontSize: 16 }}>📱</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 800 }}>Thumb Coach</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>Reach · Content · Growth</div>
            </div>
            <span style={{ marginLeft: "auto", opacity: 0.5 }}>›</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 14px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", background: tab === t ? C.gold : "rgba(255,255,255,0.06)", color: tab === t ? "#000" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}>
              {t === "visits" ? "📋 Visits" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "16px 16px 0" }}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 5 rings */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {[
                { label: "Steps", p: pct(d.steps.current, d.steps.goal), color: C.green },
                { label: "Eating", p: pct(d.eating.calories, d.eating.calGoal), color: C.teal },
                { label: "Lifting", p: pct(d.lifting.sessions, d.lifting.sessionsGoal), color: C.red },
                { label: "☀️", p: pct(d.sun.minutes, weekend ? d.sun.weekendGoal : d.sun.goal), color: C.sun },
                { label: "Sales", p: pct(d.sales.revenue, d.sales.revenueGoal), color: C.gold }
              ].map(({ label, p, color }) => (
                <Card key={label} style={{ padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <Ring pct={p} size={52} stroke={6} color={color} />
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{label}</div>
                </Card>
              ))}
            </div>

            {/* Today's Tasks */}
            <Card>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
                Today — {d.tasks.today.filter(t => t.done).length}/{d.tasks.today.length} complete
              </div>
              {d.tasks.today.map(task => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <button onClick={() => toggleTask("today", task.id)} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${task.done ? C.green : "rgba(255,255,255,0.14)"}`, background: task.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {task.done && <span style={{ fontSize: 11, color: "#000" }}>✓</span>}
                  </button>
                  <span style={{ fontSize: 13, flex: 1, color: task.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                  <button onClick={() => removeTask("today", task.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask("today")} placeholder="Add a task for today..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: "#EEF0F5", fontSize: 13, outline: "none" }} />
                <button onClick={() => addTask("today")} style={{ padding: "9px 14px", borderRadius: 10, background: C.gold, border: "none", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+</button>
              </div>
            </Card>

            {/* Tomorrow's Tasks */}
            <Card>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
                Plan Tomorrow — {d.tasks.tomorrow.filter(t => t.done).length} planned
              </div>
              {d.tasks.tomorrow.map(task => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid rgba(255,255,255,0.14)`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>→</span>
                  </div>
                  <span style={{ fontSize: 13, flex: 1, color: "rgba(255,255,255,0.6)" }}>{task.text}</span>
                  <button onClick={() => removeTask("tomorrow", task.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={newTaskTmr} onChange={e => setNewTaskTmr(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask("tomorrow")} placeholder="Plan something for tomorrow..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: "#EEF0F5", fontSize: 13, outline: "none" }} />
                <button onClick={() => addTask("tomorrow")} style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+</button>
              </div>
            </Card>

            {/* FB tip */}
            <Card style={{ borderLeft: `3px solid ${C.blue}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>💡 Facebook Tip</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>{d.facebook.tips[tipIdx]}</div>
            </Card>
          </div>
        )}

        {/* ═══ SALES + VISITS ═══ */}
        {tab === "sales" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* AI Coach */}
            <button onClick={() => setAiMode("sales")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "rgba(245,166,35,0.1)", border: `1px solid ${C.gold}40`, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.gold},${C.gold}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💼</div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>Sales Coach AI</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Knows your visits · Pipeline · Strategy</div></div>
              <span style={{ marginLeft: "auto", fontSize: 20, color: C.gold, opacity: 0.6 }}>›</span>
            </button>

            {/* ── DAY PLAN ── */}
            <Card style={{ borderLeft: `3px solid ${C.gold}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>📅 Today's Game Plan</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>AREA / TERRITORY TODAY</div>
                <input value={d.sales.planArea || ""} onChange={e => setD(prev => ({ ...prev, sales: { ...prev.sales, planArea: e.target.value } }))}
                  placeholder="e.g. Downtown, East Side, Route 66 corridor..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: "#EEF0F5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>WHAT I'M FOCUSING ON SELLING TODAY</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {["Print", "Digital", "Radio", "Bundle"].map(p => (
                    <button key={p} onClick={() => setD(prev => ({ ...prev, sales: { ...prev.sales, planProduct: p } }))}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700,
                        border: `1px solid ${d.sales.planProduct === p ? PROD_C[p] + "88" : C.border}`,
                        background: d.sales.planProduct === p ? `${PROD_C[p]}20` : "rgba(255,255,255,0.04)",
                        color: d.sales.planProduct === p ? PROD_C[p] : "rgba(255,255,255,0.4)" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>MY PLAN / PITCH NOTES FOR TODAY</div>
                <textarea value={d.sales.planNotes || ""} onChange={e => setD(prev => ({ ...prev, sales: { ...prev.sales, planNotes: e.target.value } }))}
                  placeholder="What's your strategy today? Any specific businesses you want to hit? What's your pitch angle?..."
                  rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: "#EEF0F5", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5, fontFamily: "inherit" }} />
              </div>
            </Card>

            {/* ── REVENUE ── */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>💰 MONTHLY REVENUE</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.gold, letterSpacing: -1 }}>{fmtMoney(d.sales.revenue)}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Goal {fmtMoney(d.sales.revenueGoal)}</div>
                </div>
                <Ring pct={pct(d.sales.revenue, d.sales.revenueGoal)} size={82} stroke={9} color={C.gold} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn onClick={() => openLog("sales.revenue", d.sales.revenue)} style={{ flex: 1 }}>💵 Revenue</Btn>
                <Btn outline color={C.gold} onClick={() => openLog("sales.calls", d.sales.calls)} style={{ flex: 1 }}>📞 Calls</Btn>
                <Btn outline color={C.gold} onClick={() => openLog("sales.deals", d.sales.deals)} style={{ flex: 1 }}>🤝 Deals</Btn>
              </div>
            </Card>

            {/* ── VISIT LOG ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>📋 Visit Log — {TODAY}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{todayVisits.length}/{visitGoal} visits · {soldToday} sold</div>
              </div>
              <Btn onClick={() => setShowContactLog(true)} style={{ padding: "9px 14px", fontSize: 12 }}>+ Log Visit</Btn>
            </div>

            {/* Visit progress */}
            <Card style={{ background: todayVisits.length >= visitGoal ? "rgba(39,174,96,0.08)" : C.card, border: `1px solid ${todayVisits.length >= visitGoal ? C.green + "30" : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{todayVisits.length >= visitGoal ? "✅ Visit goal hit!" : `${visitGoal - todayVisits.length} more visits to go`}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: todayVisits.length >= visitGoal ? C.green : C.gold }}>{todayVisits.length}/{visitGoal}</div>
              </div>
              <PBar value={todayVisits.length} goal={visitGoal} color={todayVisits.length >= visitGoal ? C.green : C.gold} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginTop: 12 }}>
                {[{ label: "Sold", color: C.green }, { label: "Follow-Up", color: C.gold }, { label: "Not Int.", color: C.red }, { label: "No Answer", color: C.purple }, { label: "Callback", color: C.blue }].map(({ label, color }) => (
                  <div key={label} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{todayVisits.filter(v => v.outcome === label || (label === "Not Int." && v.outcome === "Not Interested")).length}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Visit list */}
            {todayVisits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 18 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🚗</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>No visits logged yet</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6, marginBottom: 18 }}>Set your game plan above, then hit the streets!</div>
                <Btn onClick={() => setShowContactLog(true)}>+ Log First Visit</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {todayVisits.map(visit => (
                  <Card key={visit.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{visit.business}</div>
                          <Tag label={visit.outcome} color={OUTCOME_COLORS[visit.outcome] || C.gold} />
                        </div>
                        {visit.contact && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>👤 {visit.contact}</div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: visit.notes ? 8 : 0 }}>
                          <Tag label={visit.product} color={PROD_C[visit.product] || C.blue} />
                          {visit.value && <Tag label={`$${visit.value}`} color={C.green} />}
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{visit.time}</span>
                        </div>
                        {visit.notes && (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginTop: 6, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${OUTCOME_COLORS[visit.outcome] || C.gold}44` }}>
                            {visit.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginLeft: 10, flexShrink: 0 }}>
                        <button onClick={() => setEditingContact(visit)} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.5)", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 12 }}>✏️</button>
                        <button onClick={() => deleteContact(visit.id, TODAY_KEY)} style={{ background: "rgba(231,76,60,0.1)", border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13 }}>×</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Past days */}
            {Object.keys(contactLogs).filter(k => k !== TODAY_KEY).length > 0 && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Past Days</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.keys(contactLogs).filter(k => k !== TODAY_KEY).sort().reverse().map(date => (
                    <button key={date} onClick={() => setLogViewDate(date === logViewDate ? TODAY_KEY : date)}
                      style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        border: `1px solid ${logViewDate === date ? C.blue + "88" : C.border}`,
                        background: logViewDate === date ? `${C.blue}20` : "rgba(255,255,255,0.04)",
                        color: logViewDate === date ? C.blue : "rgba(255,255,255,0.4)" }}>
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ({(contactLogs[date] || []).length})
                    </button>
                  ))}
                </div>
                {logViewDate !== TODAY_KEY && contactLogs[logViewDate] && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>{new Date(logViewDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                    {contactLogs[logViewDate].map(visit => (
                      <div key={visit.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{visit.business}</div>
                          {visit.value && <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>${visit.value}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginBottom: visit.notes ? 6 : 0 }}>
                          <Tag label={visit.outcome} color={OUTCOME_COLORS[visit.outcome] || C.gold} />
                          <Tag label={visit.product} color={PROD_C[visit.product] || C.blue} />
                        </div>
                        {visit.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, lineHeight: 1.5 }}>{visit.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Pipeline */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Pipeline ({d.sales.pipeline.length})</div>
                <Btn onClick={() => { setModal("lead"); setForm({ stage: "New Lead", product: "Print" }); }} style={{ padding: "7px 14px", fontSize: 12 }}>+ Add Lead</Btn>
              </div>
              {d.sales.pipeline.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < d.sales.pipeline.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                    {p.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{p.notes}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                      <Tag label={p.stage} color={STAGE_C[p.stage] || C.gold} />
                      <Tag label={p.product} color={PROD_C[p.product] || C.blue} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>{fmtMoney(p.value)}</div>
                    <button onClick={() => removeLead(p.id)} style={{ background: "rgba(231,76,60,0.1)", border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, width: 26, height: 26, cursor: "pointer", fontSize: 13 }}>×</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Total Pipeline</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmtMoney(d.sales.pipeline.reduce((a, p) => a + p.value, 0))}</div>
              </div>
            </Card>

          </div>
        )}

        {/* ═══ WELLNESS ═══ */}
        {tab === "wellness" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button onClick={() => setShowGoalEditor(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 14, background: "rgba(245,166,35,0.08)", border: `1px solid ${C.gold}30`, color: C.gold, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🎯 Edit Wellness Goals</button>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>👟 Daily Steps</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.green, letterSpacing: -1 }}>{d.steps.current.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Goal {d.steps.goal.toLocaleString()}</div>
                </div>
                <Ring pct={pct(d.steps.current, d.steps.goal)} size={80} stroke={8} color={C.green} />
              </div>
              <Bar values={d.steps.history} color={C.green} h={44} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn outline color={C.green} onClick={() => openLog("steps.current", d.steps.current)} style={{ flex: 1 }}>+ Log Steps</Btn>
                <Btn outline color="rgba(255,255,255,0.3)" onClick={() => setShowGoalEditor(true)} style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>✏️ Goal</Btn>
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>🥗 Nutrition</div>
                <button onClick={() => setShowScanner(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 12, background: `rgba(22,160,133,0.15)`, border: `1px solid ${C.teal}44`, color: C.teal, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>📸 Scan Meal</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{ label: "Calories", v: d.eating.calories, g: d.eating.calGoal, color: C.teal, unit: "kcal", key: "eating.calories" },
                  { label: "Protein", v: d.eating.protein, g: d.eating.proteinGoal, color: C.purple, unit: "g", key: "eating.protein" },
                  { label: "Water", v: d.eating.water, g: d.eating.waterGoal, color: C.blue, unit: "cups", key: "eating.water" }].map(({ label, v, g, color, unit, key }) => (
                  <div key={label} onClick={() => openLog(key, v)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 10px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>/ {g} {unit}</div>
                    <PBar value={v} goal={g} color={color} />
                  </div>
                ))}
              </div>
              <Bar values={d.eating.history} color={C.teal} h={36} />
              {d.eating.meals.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  {d.eating.meals.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g · {m.time}</div></div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.teal }}>{m.calories} cal</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 12, textAlign: "center", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Tap <b style={{ color: C.teal }}>Scan Meal</b> to log food with AI</div>
                </div>
              )}
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>🏋️ Lifting</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.red }}>{d.lifting.sessions}<span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/{d.lifting.sessionsGoal}</span></div>
                </div>
                <Ring pct={pct(d.lifting.sessions, d.lifting.sessionsGoal)} size={70} stroke={7} color={C.red} />
              </div>
              <Bar values={d.lifting.history} color={C.red} h={40} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={() => setModal("lift")} color={C.red} style={{ flex: 1 }}>+ Log Workout</Btn>
                <Btn outline color="rgba(255,255,255,0.3)" onClick={() => setShowGoalEditor(true)} style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>✏️ Goal</Btn>
              </div>
              {d.lifting.log.slice(0, 4).map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.exercise}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{l.sets}x{l.reps} @ {l.weight}lbs</div>
                </div>
              ))}
            </Card>

            <Card style={{ borderLeft: `3px solid ${C.sun}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>☀️ Outside Time</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.sun }}>{d.sun.minutes}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>min</span></div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Goal: {weekend ? d.sun.weekendGoal : d.sun.goal} min</div>
                </div>
                <Ring pct={pct(d.sun.minutes, weekend ? d.sun.weekendGoal : d.sun.goal)} size={78} stroke={8} color={C.sun} />
              </div>
              <Bar values={d.sun.history} color={C.sun} h={36} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn outline color={C.sun} onClick={() => openLog("sun.minutes", d.sun.minutes)} style={{ flex: 1 }}>+ Log Sun Time</Btn>
                <Btn outline color="rgba(255,255,255,0.3)" onClick={() => setShowGoalEditor(true)} style={{ flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>✏️ Goal</Btn>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ FACEBOOK ═══ */}
        {tab === "facebook" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!fbCreds ? (
              <button onClick={() => setShowFBConnect(true)} style={{ padding: "20px", borderRadius: 18, background: "rgba(41,128,185,0.1)", border: `2px dashed ${C.blue}44`, color: C.blue, cursor: "pointer", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
                <div>Connect Thumb Forecast</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 400 }}>Tap to enter your Access Token</div>
              </button>
            ) : (
              <div style={{ padding: "12px 16px", background: "rgba(39,174,96,0.08)", border: `1px solid ${C.green}25`, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: fbLoading ? "#F39C12" : C.green, boxShadow: `0 0 8px ${fbLoading ? "#F39C12" : C.green}` }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: fbLoading ? "#F39C12" : C.green }}>{fbLoading ? "Syncing…" : "Live Data"}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>· {fbCreds.followers?.toLocaleString()} followers</span>
                </div>
                <button onClick={() => setShowFBConnect(true)} style={{ fontSize: 11, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Reconnect</button>
              </div>
            )}

            <button onClick={() => setAiMode("facebook")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "rgba(41,128,185,0.12)", border: `1px solid ${C.blue}40`, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📱</div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>FB Thumb Forecast Coach</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Thumbnails · Reach · Content · Growth strategy</div></div>
              <span style={{ marginLeft: "auto", fontSize: 20, color: C.blue, opacity: 0.6 }}>›</span>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Reach", v: d.facebook.reach, g: d.facebook.reachGoal, color: C.blue, key: "facebook.reach", live: !!fbCreds },
                { label: "Impressions", v: d.facebook.pageViews || 0, g: 500000, color: C.purple, key: null, live: !!fbCreds },
                { label: "New Followers", v: d.facebook.newFollowers || 0, g: 50, color: C.gold, key: null, live: !!fbCreds },
                { label: "Followers", v: fbCreds?.followers || 13515, g: 20000, color: C.green, key: null, live: !!fbCreds }].map(({ label, v, g, color, key, sfx = "", live }) => (
                <Card key={label} onClick={key ? () => openLog(key, v) : null}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{label}</div>
                    {live && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 4px ${C.green}` }} />}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{fmtK(v)}{sfx}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>/ {fmtK(g)}{sfx}</div>
                  <PBar value={v} goal={g} color={color} />
                </Card>
              ))}
            </div>

            <Card>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Reach Trend {fbCreds ? "(Live)" : ""}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{d}</div>)}
              </div>
              <Bar values={d.facebook.history} color={C.blue} h={52} />
            </Card>

            <Card style={{ borderLeft: `3px solid ${C.purple}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Thumb Strategy Tips</div>
              {d.facebook.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.purple}22`, border: `1px solid ${C.purple}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.purple, flexShrink: 0, fontWeight: 800 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{tip}</div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ═══ SALES ═══ */}
        {tab === "sales" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button onClick={() => setAiMode("sales")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "rgba(245,166,35,0.1)", border: `1px solid ${C.gold}40`, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.gold},${C.gold}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💼</div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>Sales Coach AI</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Knows your visits · Pipeline · Strategy</div></div>
              <span style={{ marginLeft: "auto", fontSize: 20, color: C.gold, opacity: 0.6 }}>›</span>
            </button>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>💰 MONTHLY REVENUE</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.gold, letterSpacing: -1 }}>{fmtMoney(d.sales.revenue)}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Goal {fmtMoney(d.sales.revenueGoal)}</div>
                </div>
                <Ring pct={pct(d.sales.revenue, d.sales.revenueGoal)} size={82} stroke={9} color={C.gold} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn onClick={() => openLog("sales.revenue", d.sales.revenue)} style={{ flex: 1 }}>💵 Revenue</Btn>
                <Btn outline color={C.gold} onClick={() => openLog("sales.calls", d.sales.calls)} style={{ flex: 1 }}>📞 Calls</Btn>
                <Btn outline color={C.gold} onClick={() => openLog("sales.deals", d.sales.deals)} style={{ flex: 1 }}>🤝 Deals</Btn>
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ label: "Calls", v: d.sales.calls, g: d.sales.callsGoal, color: C.blue },
                { label: "Deals", v: d.sales.deals, g: d.sales.dealsGoal, color: C.green },
                { label: "Close%", v: `${d.sales.calls > 0 ? Math.round((d.sales.deals / d.sales.calls) * 100) : 0}%`, g: "25%", color: C.purple }].map(({ label, v, g, color }) => (
                <Card key={label} style={{ padding: "14px 10px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>{v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>goal {g}</div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Revenue Trend</div>
              <Bar values={d.sales.history} color={C.gold} h={48} />
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Pipeline ({d.sales.pipeline.length})</div>
                <Btn onClick={() => { setModal("lead"); setForm({ stage: "New Lead", product: "Print" }); }} style={{ padding: "7px 14px", fontSize: 12 }}>+ Add Lead</Btn>
              </div>
              {d.sales.pipeline.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < d.sales.pipeline.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                    {p.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{p.notes}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                      <Tag label={p.stage} color={STAGE_C[p.stage] || C.gold} />
                      <Tag label={p.product} color={PROD_C[p.product] || C.blue} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>{fmtMoney(p.value)}</div>
                    <button onClick={() => removeLead(p.id)} style={{ background: "rgba(231,76,60,0.1)", border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, width: 26, height: 26, cursor: "pointer", fontSize: 13 }}>×</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Total Pipeline</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmtMoney(d.sales.pipeline.reduce((a, p) => a + p.value, 0))}</div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
