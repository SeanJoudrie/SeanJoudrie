/**
 * FlexynShowcase — swipeable phone-frame carousel showcasing the Flexyn
 * fitness PWA, designed to sit inside Sean Joudrie's portfolio.
 *
 * DROP-IN: one file, zero dependencies beyond React. All styling is a
 * scoped stylesheet (`.fxs-*` namespace) injected once, so it works with
 * or without Tailwind. It reads the portfolio's theme tokens
 * (--color-paper, --color-ink, --color-accent, …) with hardcoded
 * fallbacks, so it inherits your palette automatically.
 *
 * Usage:  import FlexynShowcase from "./FlexynShowcase";
 *         <FlexynShowcase />
 *
 * Interaction: touch swipe, mouse drag, arrow keys, arrow buttons, dots.
 * Respects prefers-reduced-motion.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------- */
/* Flexyn dark-app palette (the screens inside the phone)            */
/* ---------------------------------------------------------------- */
const FX = {
  bg: "#0d0b16",
  card: "rgba(255,255,255,0.055)",
  cardBorder: "rgba(255,255,255,0.09)",
  text: "#f5f3ff",
  dim: "rgba(245,243,255,0.55)",
  faint: "rgba(245,243,255,0.32)",
  violet: "#8b5cf6",
  fuchsia: "#d946ef",
  emerald: "#34d399",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  rose: "#fb7185",
  gold: "#eab308",
};

/* ---------------------------------------------------------------- */
/* Tiny building blocks for the mock screens                         */
/* ---------------------------------------------------------------- */

function Ring({ size = 56, stroke = 5, pct = 70, color = FX.violet, track = "rgba(255,255,255,0.1)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="fxs-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="fxs-ring-center">{children}</div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div className="fxs-card" style={style}>
      {children}
    </div>
  );
}

function Bar({ pct, from = FX.violet, to = FX.fuchsia, h = 6 }) {
  return (
    <div className="fxs-bar" style={{ height: h }}>
      <div className="fxs-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
    </div>
  );
}

function Avatar({ hue, size = 26, ring }) {
  return (
    <span
      className="fxs-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${hue + 40} 70% 45%))`,
        boxShadow: ring ? `0 0 0 2px ${FX.bg}, 0 0 0 3.5px ${FX.fuchsia}` : "none",
      }}
    />
  );
}

/** Phone chrome: status bar on top, Flexyn tab bar on the bottom. */
function Screen({ tab, title, children }) {
  const tabs = ["Home", "Workout", "Hub", "Progress", "Food"];
  return (
    <div className="fxs-screen">
      <div className="fxs-statusbar">
        <span>9:41</span>
        <span className="fxs-statusbar-right">
          <span className="fxs-sig" />
          <span className="fxs-batt" />
        </span>
      </div>
      <div className="fxs-apphead">
        <span className="fxs-applogo">Flexyn</span>
        {title ? <span className="fxs-apptitle">{title}</span> : null}
      </div>
      <div className="fxs-screen-body">{children}</div>
      <div className="fxs-tabbar">
        {tabs.map((t) => (
          <span key={t} className={`fxs-tab${t === tab ? " is-active" : ""}`}>
            <span className="fxs-tab-dot" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Mock screens — one per slide                                      */
/* ---------------------------------------------------------------- */

function DashboardScreen() {
  return (
    <Screen tab="Home">
      <div className="fxs-row fxs-between">
        <div>
          <div className="fxs-dim fxs-xs">Good morning</div>
          <div className="fxs-strong">Sean 👋</div>
        </div>
        <span className="fxs-bell">
          🔔<span className="fxs-badge">3</span>
        </span>
      </div>

      <Card>
        <div className="fxs-row fxs-between">
          <div className="fxs-row" style={{ gap: 8 }}>
            <span className="fxs-flame">🔥</span>
            <div>
              <div className="fxs-strong">47-day streak</div>
              <div className="fxs-dim fxs-xs">Longest: 47 · Keep it alive</div>
            </div>
          </div>
          <span className="fxs-pill" style={{ color: FX.amber, borderColor: "rgba(251,191,36,0.4)" }}>
            Rescue ready
          </span>
        </div>
      </Card>

      <Card>
        <div className="fxs-row fxs-between" style={{ marginBottom: 6 }}>
          <span className="fxs-xs fxs-dim">Level 23 · Warrior</span>
          <span className="fxs-xs" style={{ color: FX.violet }}>2,140 / 3,000 XP</span>
        </div>
        <Bar pct={71} />
      </Card>

      <Card>
        <div className="fxs-xs fxs-dim" style={{ marginBottom: 7 }}>
          Daily quests
        </div>
        {[
          ["Log a workout", "+50 XP", true],
          ["Hit your protein goal", "+30 XP", true],
          ["Drink 8 glasses of water", "+20 XP", false],
        ].map(([q, xp, done]) => (
          <div key={q} className="fxs-row fxs-between fxs-quest">
            <span className="fxs-row" style={{ gap: 7 }}>
              <span className={`fxs-check${done ? " is-done" : ""}`}>{done ? "✓" : ""}</span>
              <span className={`fxs-xs${done ? " fxs-strike" : ""}`}>{q}</span>
            </span>
            <span className="fxs-xs" style={{ color: done ? FX.emerald : FX.faint }}>{xp}</span>
          </div>
        ))}
      </Card>
    </Screen>
  );
}

function WorkoutScreen() {
  return (
    <Screen tab="Workout" title="Push Day · Wk 3">
      <div className="fxs-prbanner">
        <span>🏆</span>
        <div>
          <div className="fxs-strong" style={{ color: "#1c1403" }}>New PR — Bench 102.5 kg</div>
          <div className="fxs-xs" style={{ color: "rgba(28,20,3,0.65)" }}>+2.5 kg · confetti fired 🎊</div>
        </div>
      </div>

      <Card>
        <div className="fxs-row fxs-between" style={{ marginBottom: 7 }}>
          <span className="fxs-strong">Bench Press</span>
          <span className="fxs-timer">
            <Ring size={30} stroke={3} pct={62} color={FX.cyan}>
              <span style={{ fontSize: 7.5, color: FX.cyan }}>1:24</span>
            </Ring>
          </span>
        </div>
        {[
          ["1", "100 kg × 8", "done"],
          ["2", "100 kg × 7", "done"],
          ["3", "102.5 kg × 5", "pr"],
        ].map(([n, s, state]) => (
          <div key={n} className="fxs-row fxs-between fxs-set">
            <span className="fxs-xs fxs-dim">Set {n}</span>
            <span className="fxs-xs">{s}</span>
            <span
              className="fxs-xs"
              style={{ color: state === "pr" ? FX.gold : FX.emerald, fontWeight: 600 }}
            >
              {state === "pr" ? "PR!" : "✓"}
            </span>
          </div>
        ))}
      </Card>

      <div className="fxs-voicebar">
        <span className="fxs-mic">🎙</span>
        <span className="fxs-xs fxs-dim">“one hundred five for three” — logged by voice</span>
      </div>
    </Screen>
  );
}

function HubScreen() {
  return (
    <Screen tab="Hub">
      <div className="fxs-row" style={{ gap: 8, marginBottom: 2 }}>
        {[265, 150, 30, 205, 330].map((h, i) => (
          <Avatar key={h} hue={h} size={30} ring={i < 3} />
        ))}
        <span className="fxs-story-add">+</span>
      </div>

      <div className="fxs-live">
        <span className="fxs-pulse" />
        <span className="fxs-xs">3 friends are training right now</span>
      </div>

      <Card>
        <div className="fxs-row" style={{ gap: 8, marginBottom: 6 }}>
          <Avatar hue={150} size={26} />
          <div>
            <div className="fxs-xs fxs-strong">Maya R.</div>
            <div className="fxs-xs fxs-faint">2h · Iron Crew</div>
          </div>
        </div>
        <div className="fxs-xs" style={{ marginBottom: 7 }}>
          Crushed leg day — 12,400 kg total volume 💪
        </div>
        <div className="fxs-postimg">
          <span className="fxs-xs" style={{ color: "rgba(245,243,255,0.7)" }}>🏋️ Workout recap card</span>
        </div>
        <div className="fxs-row" style={{ gap: 12, marginTop: 7 }}>
          <span className="fxs-xs fxs-dim">❤️ 24</span>
          <span className="fxs-xs fxs-dim">💬 6</span>
          <span className="fxs-xs fxs-dim">🔁 Share</span>
        </div>
      </Card>
    </Screen>
  );
}

function CompeteScreen() {
  return (
    <Screen tab="Progress" title="Compete">
      <Card>
        <div className="fxs-row fxs-between" style={{ marginBottom: 7 }}>
          <span className="fxs-strong">🥇 Gold League</span>
          <span className="fxs-xs" style={{ color: FX.amber }}>Ends in 2d 6h</span>
        </div>
        {[
          ["1", "Priya", "3,420", 25],
          ["2", "You", "3,180", 265],
          ["3", "Jake", "2,940", 205],
        ].map(([rank, name, xp, hue]) => (
          <div key={rank} className={`fxs-row fxs-between fxs-lbrow${name === "You" ? " is-you" : ""}`}>
            <span className="fxs-row" style={{ gap: 7 }}>
              <span className="fxs-xs fxs-dim" style={{ width: 10 }}>{rank}</span>
              <Avatar hue={hue} size={18} />
              <span className="fxs-xs">{name}</span>
            </span>
            <span className="fxs-xs" style={{ color: FX.violet }}>{xp} XP</span>
          </div>
        ))}
      </Card>

      <Card>
        <div className="fxs-row fxs-between" style={{ marginBottom: 6 }}>
          <span className="fxs-xs fxs-strong">😈 Nemesis: Jake</span>
          <span className="fxs-xs" style={{ color: FX.rose }}>240 XP ahead</span>
        </div>
        <Bar pct={78} from={FX.rose} to={FX.amber} />
        <div className="fxs-xs fxs-faint" style={{ marginTop: 5 }}>Overthrow him to claim the crown</div>
      </Card>

      <div className="fxs-duelchip">
        <span>⚔️</span>
        <span className="fxs-xs">Duel vs Sam — you lead by 2 workouts · 2d left</span>
      </div>
    </Screen>
  );
}

function NutritionScreen() {
  return (
    <Screen tab="Food">
      <Card>
        <div className="fxs-row fxs-between">
          {[
            ["Protein", 82, FX.violet, "132/160g"],
            ["Carbs", 64, FX.cyan, "205/320g"],
            ["Fat", 55, FX.amber, "48/88g"],
          ].map(([label, pct, color, val]) => (
            <div key={label} className="fxs-col-center">
              <Ring size={48} stroke={4.5} pct={pct} color={color}>
                <span style={{ fontSize: 8, color: FX.text }}>{pct}%</span>
              </Ring>
              <span className="fxs-xs fxs-dim" style={{ marginTop: 4 }}>{label}</span>
              <span className="fxs-xs fxs-faint">{val}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="fxs-row fxs-between">
          <div className="fxs-row" style={{ gap: 10 }}>
            <Ring size={42} stroke={4} pct={75} color={FX.cyan}>
              <span style={{ fontSize: 10 }}>💧</span>
            </Ring>
            <div>
              <div className="fxs-xs fxs-strong">Hydration</div>
              <div className="fxs-xs fxs-dim">6 of 8 glasses</div>
            </div>
          </div>
          <span className="fxs-pill" style={{ color: FX.cyan, borderColor: "rgba(34,211,238,0.4)" }}>+ Log</span>
        </div>
      </Card>

      <Card>
        {[
          ["🥣 Overnight oats", "Breakfast", "420 kcal"],
          ["🍗 Chicken bowl", "Lunch", "640 kcal"],
        ].map(([meal, when, kcal]) => (
          <div key={meal} className="fxs-row fxs-between fxs-set">
            <span className="fxs-xs">{meal}</span>
            <span className="fxs-xs fxs-faint">{when}</span>
            <span className="fxs-xs fxs-dim">{kcal}</span>
          </div>
        ))}
        <div className="fxs-scanbtn">▦ Scan a barcode</div>
      </Card>
    </Screen>
  );
}

function RecoveryScreen() {
  return (
    <Screen tab="Progress" title="Recovery">
      <div className="fxs-col-center" style={{ padding: "4px 0 2px" }}>
        <Ring size={86} stroke={7} pct={82} color={FX.emerald}>
          <div className="fxs-col-center">
            <span style={{ fontSize: 20, fontWeight: 700, color: FX.text, lineHeight: 1 }}>82</span>
            <span style={{ fontSize: 7, color: FX.dim }}>READINESS</span>
          </div>
        </Ring>
        <span className="fxs-xs" style={{ color: FX.emerald, marginTop: 5 }}>Ready to train hard</span>
      </div>

      <Card>
        <div className="fxs-row fxs-between" style={{ marginBottom: 6 }}>
          <span className="fxs-xs fxs-strong">😴 Sleep</span>
          <span className="fxs-xs" style={{ color: FX.cyan }}>7h 42m</span>
        </div>
        <Bar pct={86} from={FX.cyan} to={FX.violet} />
      </Card>

      <Card>
        <div className="fxs-xs fxs-dim" style={{ marginBottom: 7 }}>How do you feel today?</div>
        <div className="fxs-row fxs-between">
          {["😴", "😐", "🙂", "😄", "⚡"].map((m, i) => (
            <span key={m} className={`fxs-mood${i === 4 ? " is-active" : ""}`}>{m}</span>
          ))}
        </div>
      </Card>
    </Screen>
  );
}

function CoachScreen() {
  return (
    <Screen tab="Hub" title="Coach">
      <div className="fxs-bubble is-user">Build me a 4-day upper/lower split, I have dumbbells only</div>
      <div className="fxs-bubble is-coach">
        <div className="fxs-xs fxs-strong" style={{ marginBottom: 5 }}>Here's your split 💪</div>
        {["Day 1 — Upper push · 6 exercises", "Day 2 — Lower · 5 exercises", "Day 3 — Upper pull · 6 exercises"].map((d) => (
          <div key={d} className="fxs-xs fxs-dim fxs-planline">{d}</div>
        ))}
        <div className="fxs-savebtn">Save as program</div>
      </div>

      <div className="fxs-voicebar">
        <span className="fxs-mic is-rec">🎙</span>
        <span className="fxs-xs fxs-dim">Listening… dictate your question</span>
      </div>

      <div className="fxs-formchip">
        <span>📐</span>
        <span className="fxs-xs">Form Coach — live pose detection on device</span>
      </div>
    </Screen>
  );
}

function PlatformScreen() {
  return (
    <Screen tab="Home" title="Anywhere">
      <div className="fxs-notif">
        <div className="fxs-row" style={{ gap: 7 }}>
          <span className="fxs-notif-icon">F</span>
          <div>
            <div className="fxs-xs fxs-strong">Your 47-day streak needs you 🔥</div>
            <div className="fxs-xs fxs-faint">Flexyn · now</div>
          </div>
        </div>
      </div>
      <div className="fxs-notif" style={{ opacity: 0.85 }}>
        <div className="fxs-row" style={{ gap: 7 }}>
          <span className="fxs-notif-icon">F</span>
          <div>
            <div className="fxs-xs fxs-strong">¡Tu racha de 47 días te necesita! 🔥</div>
            <div className="fxs-xs fxs-faint">Flexyn · en tu idioma</div>
          </div>
        </div>
      </div>

      <Card>
        <div className="fxs-xs fxs-dim" style={{ marginBottom: 7 }}>Ships in 15 languages</div>
        <div className="fxs-langs">
          {["EN", "ES", "FR", "DE", "PT", "IT", "JA", "KO", "ZH", "AR", "HI", "RU", "TR", "PL", "NL"].map((l) => (
            <span key={l} className="fxs-lang">{l}</span>
          ))}
        </div>
      </Card>

      <div className="fxs-installbar">
        <span>📲</span>
        <span className="fxs-xs">Add to Home Screen — installs like a native app</span>
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------------- */
/* Slide metadata — the editorial captions                           */
/* ---------------------------------------------------------------- */

const SLIDES = [
  {
    key: "engine",
    kicker: "The retention loop",
    title: "A daily engine that pulls you back",
    blurb:
      "Streaks with a once-a-month rescue save, daily quests, XP and levels, and a shareable weekly recap. Every habit mechanic reinforces the next.",
    chips: ["47-day streaks", "Streak rescue", "Daily quests", "XP & levels", "Weekly recap cards"],
    accent: FX.amber,
    screen: DashboardScreen,
  },
  {
    key: "workout",
    kicker: "The core loop",
    title: "Logging that celebrates you",
    blurb:
      "Set logging with voice input, an in-flow rest timer, program and workout templates, and PR detection that fires a bespoke confetti-and-haptics celebration.",
    chips: ["Voice set logging", "Rest timer", "PR celebrations", "Program templates", "Workout calendar"],
    accent: FX.gold,
    screen: WorkoutScreen,
  },
  {
    key: "hub",
    kicker: "The social layer",
    title: "A Hub that feels alive",
    blurb:
      "Stories with emoji reactions, crews, a live activity rail showing who's training now, follow suggestions, friend leaderboards, and DMs.",
    chips: ["Stories + reactions", "Crews", "Live activity rail", "Friend leaderboards", "Messages"],
    accent: FX.fuchsia,
    screen: HubScreen,
  },
  {
    key: "compete",
    kicker: "The competition stack",
    title: "Six ways to pick a fight",
    blurb:
      "Weekly leagues, 1-v-1 duels, open bounties, crew wars, a personal nemesis to overthrow, and a gauntlet of escalating challenges — each with its own push notifications.",
    chips: ["Weekly leagues", "Duels", "Bounties", "Crew wars", "Nemesis", "Gauntlet"],
    accent: FX.rose,
    screen: CompeteScreen,
  },
  {
    key: "nutrition",
    kicker: "Fuel",
    title: "Nutrition without the chore",
    blurb:
      "Barcode scanning, macro rings, hydration tracking, and meal logging — with a first-meal celebration so even day one feels like a win.",
    chips: ["Barcode scan", "Macro tracking", "Hydration ring", "Meal log"],
    accent: FX.cyan,
    screen: NutritionScreen,
  },
  {
    key: "recovery",
    kicker: "The other 23 hours",
    title: "Recovery is part of training",
    blurb:
      "Sleep and mood logs roll up into a recovery score and a readiness card that tells you whether today is a push day or a rest day.",
    chips: ["Sleep log", "Mood log", "Recovery score", "Readiness card"],
    accent: FX.emerald,
    screen: RecoveryScreen,
  },
  {
    key: "coach",
    kicker: "Intelligence",
    title: "A coach in your pocket",
    blurb:
      "An AI coach that writes programs from a chat message or a voice note, plus a Form Coach that runs pose detection on-device to check your technique.",
    chips: ["AI program builder", "Voice dictation", "Form Coach (pose detection)", "Cardio route maps"],
    accent: FX.violet,
    screen: CoachScreen,
  },
  {
    key: "platform",
    kicker: "Under the hood",
    title: "Built like a product, shipped like one",
    blurb:
      "An installable PWA with a full Web Push pipeline — Postgres triggers fanning out through an edge function — localized server-side into 15 languages, with row-level security on every table.",
    chips: ["Installable PWA", "Web Push pipeline", "15 languages", "110+ SQL migrations", "430+ unit tests"],
    accent: FX.cyan,
    screen: PlatformScreen,
  },
];

/* ---------------------------------------------------------------- */
/* The carousel                                                      */
/* ---------------------------------------------------------------- */

const SWIPE_THRESHOLD = 0.18; // fraction of viewport width
const SWIPE_VELOCITY = 0.4; // px per ms

export default function FlexynShowcase() {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef(null);
  const drag = useRef({ startX: 0, startY: 0, lastX: 0, lastT: 0, active: false, horizontal: null });

  const count = SLIDES.length;
  const active = SLIDES[index];

  const goTo = useCallback(
    (i) => setIndex(Math.max(0, Math.min(count - 1, i))),
    [count]
  );
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  const onPointerDown = useCallback((e) => {
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      active: true,
      horizontal: null,
    };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Decide intent once: horizontal swipe vs vertical page scroll.
    if (d.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      d.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (d.horizontal === false) return;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    // Resist dragging past the ends.
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === count - 1);
    setDragPx(atEdge ? dx * 0.3 : dx);
  }, [index, count]);

  const endDrag = useCallback(
    (e) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      setDragging(false);
      const width = viewportRef.current ? viewportRef.current.offsetWidth : 320;
      const dx = e.clientX - d.startX;
      const dt = Math.max(1, e.timeStamp - d.lastT);
      const velocity = Math.abs(e.clientX - d.lastX) / dt;
      if (d.horizontal && (Math.abs(dx) > width * SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY)) {
        if (dx < 0) goTo(index + 1);
        else goTo(index - 1);
      }
      setDragPx(0);
    },
    [goTo, index]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    },
    [prev, next]
  );

  // Inject the scoped stylesheet once.
  useEffect(() => {
    if (document.getElementById("fxs-styles")) return;
    const el = document.createElement("style");
    el.id = "fxs-styles";
    el.textContent = FXS_CSS;
    document.head.appendChild(el);
  }, []);

  const ActiveNumber = String(index + 1).padStart(2, "0");

  return (
    <section className="fxs" aria-label="Flexyn feature showcase">
      {/* Section header removed — the case-study page provides its own. */}
      <div className="fxs-stage">
        {/* Phone carousel */}
        <div
          ref={viewportRef}
          className="fxs-viewport"
          role="group"
          aria-roledescription="carousel"
          aria-label={`Slide ${index + 1} of ${count}: ${active.title}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(e) => { if (drag.current.active) endDrag(e); }}
        >
          <div
            className={`fxs-track${dragging ? " is-dragging" : ""}`}
            style={{ transform: `translateX(calc(${-index * 100}% + ${dragPx}px))` }}
          >
            {SLIDES.map((s, i) => {
              const S = s.screen;
              return (
                <div key={s.key} className="fxs-slide" aria-hidden={i !== index}>
                  <div className={`fxs-phone${i === index ? " is-active" : ""}`}>
                    <div className="fxs-notch" />
                    <S />
                  </div>
                </div>
              );
            })}
          </div>

          <button className="fxs-arrow is-prev" onClick={prev} disabled={index === 0} aria-label="Previous feature">
            ←
          </button>
          <button className="fxs-arrow is-next" onClick={next} disabled={index === count - 1} aria-label="Next feature">
            →
          </button>
        </div>

        {/* Caption panel */}
        <div className="fxs-caption" key={active.key}>
          <div className="fxs-caption-top">
            <span className="fxs-num" style={{ color: "var(--color-accent, #bd3a1c)" }}>{ActiveNumber}</span>
            <span className="fxs-caption-kicker">{active.kicker}</span>
          </div>
          <h3 className="fxs-h3">{active.title}</h3>
          <p className="fxs-blurb">{active.blurb}</p>
          <ul className="fxs-chips">
            {active.chips.map((c) => (
              <li key={c} className="fxs-chip">{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dots */}
      <div className="fxs-dots" role="tablist" aria-label="Choose a feature">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={i === index}
            aria-label={s.title}
            className={`fxs-dot${i === index ? " is-active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
      <p className="fxs-hint">Swipe, drag, or use arrow keys</p>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Scoped styles. Reads the portfolio theme tokens with fallbacks.   */
/* ---------------------------------------------------------------- */

const FXS_CSS = `
.fxs {
  --p: var(--color-paper, #f4eee1);
  --p2: var(--color-paper-2, #ece4d1);
  --ink: var(--color-ink, #211b12);
  --ink2: var(--color-ink-2, #5c5340);
  --faint: var(--color-faint, #857b63);
  --line: var(--color-line, #d7ccb4);
  --accent: var(--color-accent, #bd3a1c);
  --serif: var(--font-display, "Fraunces", Georgia, serif);
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.5rem 1.25rem 0;
  color: var(--ink);
  font-family: var(--font-sans, "Inter", system-ui, sans-serif);
}

/* ---- editorial header ---- */
.fxs-header { max-width: 40rem; margin-bottom: 2.5rem; }
.fxs-kicker {
  font-size: .75rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--accent); font-weight: 600; margin-bottom: .6rem;
}
.fxs-h2 {
  font-family: var(--serif); font-weight: 600; letter-spacing: -.02em;
  font-size: clamp(1.9rem, 4.5vw, 2.75rem); line-height: 1.1; margin-bottom: .8rem;
}
.fxs-intro { color: var(--ink2); line-height: 1.6; font-size: 1rem; }

/* ---- stage: phone + caption side by side ---- */
.fxs-stage {
  display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  gap: 3rem; align-items: center;
}
@media (max-width: 760px) {
  .fxs-stage { grid-template-columns: 1fr; gap: 1.75rem; }
}

/* ---- carousel viewport ---- */
.fxs-viewport {
  position: relative; overflow: hidden; touch-action: pan-y;
  cursor: grab; user-select: none; -webkit-user-select: none;
  outline: none; border-radius: 1rem; padding: 1.25rem 0;
}
.fxs-viewport:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
.fxs-viewport:active { cursor: grabbing; }
.fxs-track {
  display: flex;
  transition: transform .45s cubic-bezier(.32,.72,.28,1);
}
.fxs-track.is-dragging { transition: none; }
@media (prefers-reduced-motion: reduce) { .fxs-track { transition: none; } }
.fxs-slide {
  flex: 0 0 100%; display: flex; justify-content: center;
  min-width: 0;
}

/* ---- phone frame ---- */
.fxs-phone {
  position: relative; width: 272px; height: 512px;
  border-radius: 2.6rem; padding: 9px;
  background: linear-gradient(160deg, #2a2438, #14101f 60%);
  box-shadow:
    0 24px 48px -16px rgba(33,27,18,.35),
    0 4px 12px rgba(33,27,18,.15),
    inset 0 1px 1px rgba(255,255,255,.14);
  transform: scale(.94); opacity: .55;
  transition: transform .45s cubic-bezier(.32,.72,.28,1), opacity .45s ease;
}
.fxs-phone.is-active { transform: scale(1); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .fxs-phone { transition: none; } }
.fxs-notch {
  position: absolute; top: 17px; left: 50%; transform: translateX(-50%);
  width: 84px; height: 18px; border-radius: 999px; background: #060409; z-index: 3;
}

/* ---- inside the phone ---- */
.fxs-screen {
  position: relative; width: 100%; height: 100%;
  border-radius: 2.05rem; overflow: hidden;
  background:
    radial-gradient(120% 60% at 80% -5%, rgba(139,92,246,.28), transparent 55%),
    radial-gradient(100% 50% at 10% 110%, rgba(217,70,239,.18), transparent 55%),
    ${FX.bg};
  color: ${FX.text}; display: flex; flex-direction: column;
  font-family: "Inter", system-ui, sans-serif;
}
.fxs-statusbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px 4px; font-size: 10px; font-weight: 600; color: ${FX.dim};
}
.fxs-statusbar-right { display: flex; gap: 4px; align-items: center; }
.fxs-sig { width: 12px; height: 7px; border-radius: 1px;
  background: linear-gradient(90deg, ${FX.dim} 60%, rgba(245,243,255,.2) 60%); }
.fxs-batt { width: 16px; height: 8px; border: 1px solid ${FX.dim}; border-radius: 2px;
  background: linear-gradient(90deg, ${FX.emerald} 70%, transparent 70%); }
.fxs-apphead {
  display: flex; align-items: baseline; gap: 8px; padding: 6px 14px 8px;
}
.fxs-applogo {
  font-weight: 800; font-size: 13px; letter-spacing: -.02em;
  background: linear-gradient(90deg, ${FX.violet}, ${FX.fuchsia});
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.fxs-apptitle { font-size: 10px; color: ${FX.dim}; }
.fxs-screen-body {
  flex: 1; padding: 2px 11px 10px; display: flex; flex-direction: column; gap: 9px;
  justify-content: center; min-height: 0; overflow: hidden;
}
.fxs-tabbar {
  display: flex; justify-content: space-around; align-items: center;
  padding: 7px 6px 14px; border-top: 1px solid rgba(255,255,255,.07);
  background: rgba(13,11,22,.8);
}
.fxs-tab {
  font-size: 7.5px; color: ${FX.faint}; display: flex; flex-direction: column;
  align-items: center; gap: 3px; font-weight: 500;
}
.fxs-tab-dot { width: 14px; height: 14px; border-radius: 5px; background: rgba(255,255,255,.08); }
.fxs-tab.is-active { color: ${FX.violet}; }
.fxs-tab.is-active .fxs-tab-dot {
  background: linear-gradient(135deg, ${FX.violet}, ${FX.fuchsia});
  box-shadow: 0 0 10px rgba(139,92,246,.5);
}

/* ---- shared mock primitives ---- */
.fxs-card {
  background: ${FX.card}; border: 1px solid ${FX.cardBorder};
  border-radius: 12px; padding: 9px 10px;
}
.fxs-row { display: flex; align-items: center; }
.fxs-between { justify-content: space-between; }
.fxs-col-center { display: flex; flex-direction: column; align-items: center; }
.fxs-xs { font-size: 9.5px; line-height: 1.35; }
.fxs-strong { font-weight: 700; font-size: 11px; }
.fxs-dim { color: ${FX.dim}; }
.fxs-faint { color: ${FX.faint}; }
.fxs-strike { text-decoration: line-through; color: ${FX.faint}; }
.fxs-ring { position: relative; display: inline-flex; flex: none; }
.fxs-ring-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.fxs-bar { border-radius: 999px; background: rgba(255,255,255,.1); overflow: hidden; }
.fxs-bar-fill { height: 100%; border-radius: 999px; }
.fxs-pill {
  font-size: 8px; font-weight: 600; padding: 3px 7px; border-radius: 999px;
  border: 1px solid; white-space: nowrap;
}
.fxs-avatar { border-radius: 999px; display: inline-block; flex: none; }
.fxs-bell { position: relative; font-size: 14px; }
.fxs-badge {
  position: absolute; top: -3px; right: -6px; background: ${FX.rose}; color: #fff;
  font-size: 7px; font-weight: 700; border-radius: 999px; padding: 1px 4px;
}
.fxs-flame { font-size: 20px; filter: drop-shadow(0 0 6px rgba(251,191,36,.5)); }
.fxs-quest { padding: 4px 0; }
.fxs-check {
  width: 13px; height: 13px; border-radius: 5px; border: 1px solid ${FX.faint};
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 8px; color: #fff; flex: none;
}
.fxs-check.is-done { background: ${FX.emerald}; border-color: ${FX.emerald}; color: #05281c; }

/* workout */
.fxs-prbanner {
  display: flex; gap: 8px; align-items: center; border-radius: 12px; padding: 9px 10px;
  background: linear-gradient(120deg, ${FX.gold}, ${FX.amber});
  box-shadow: 0 4px 14px rgba(234,179,8,.35); font-size: 16px;
}
.fxs-set { padding: 4.5px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.fxs-set:last-of-type { border-bottom: none; }
.fxs-voicebar {
  display: flex; gap: 8px; align-items: center; border-radius: 999px; padding: 7px 11px;
  border: 1px dashed rgba(139,92,246,.5); background: rgba(139,92,246,.1);
}
.fxs-mic { font-size: 12px; }
.fxs-mic.is-rec { animation: fxs-pulse 1.2s ease-in-out infinite; }

/* hub */
.fxs-story-add {
  width: 30px; height: 30px; border-radius: 999px; border: 1.5px dashed ${FX.faint};
  display: inline-flex; align-items: center; justify-content: center;
  color: ${FX.dim}; font-size: 13px; flex: none;
}
.fxs-live {
  display: flex; gap: 7px; align-items: center; padding: 6px 10px; border-radius: 999px;
  background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.3);
}
.fxs-pulse {
  width: 6px; height: 6px; border-radius: 999px; background: ${FX.emerald};
  animation: fxs-pulse 1.5s ease-in-out infinite;
}
.fxs-postimg {
  height: 64px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(139,92,246,.35), rgba(217,70,239,.3));
  border: 1px solid rgba(255,255,255,.08);
}

/* compete */
.fxs-lbrow { padding: 4px 5px; border-radius: 7px; }
.fxs-lbrow.is-you { background: rgba(139,92,246,.16); border: 1px solid rgba(139,92,246,.35); }
.fxs-duelchip {
  display: flex; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 11px;
  background: rgba(251,113,133,.1); border: 1px solid rgba(251,113,133,.3); font-size: 13px;
}

/* nutrition */
.fxs-scanbtn {
  margin-top: 7px; text-align: center; font-size: 9.5px; font-weight: 600;
  padding: 7px; border-radius: 9px; color: ${FX.cyan};
  border: 1px dashed rgba(34,211,238,.45); background: rgba(34,211,238,.07);
}

/* recovery */
.fxs-mood {
  font-size: 16px; opacity: .35; padding: 4px 6px; border-radius: 9px;
}
.fxs-mood.is-active {
  opacity: 1; background: rgba(52,211,153,.15);
  box-shadow: 0 0 0 1px rgba(52,211,153,.4);
}

/* coach */
.fxs-bubble {
  max-width: 88%; padding: 8px 10px; border-radius: 13px; font-size: 9.5px; line-height: 1.4;
}
.fxs-bubble.is-user {
  align-self: flex-end; background: linear-gradient(120deg, ${FX.violet}, ${FX.fuchsia});
  color: #fff; border-bottom-right-radius: 4px;
}
.fxs-bubble.is-coach {
  align-self: flex-start; background: ${FX.card}; border: 1px solid ${FX.cardBorder};
  border-bottom-left-radius: 4px;
}
.fxs-planline { padding: 2.5px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.fxs-savebtn {
  margin-top: 6px; text-align: center; font-size: 8.5px; font-weight: 700; color: #fff;
  padding: 5px; border-radius: 7px;
  background: linear-gradient(120deg, ${FX.violet}, ${FX.fuchsia});
}
.fxs-formchip {
  display: flex; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 11px;
  background: rgba(34,211,238,.08); border: 1px solid rgba(34,211,238,.3); font-size: 12px;
}

/* platform */
.fxs-notif {
  border-radius: 12px; padding: 9px 10px;
  background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(6px);
}
.fxs-notif-icon {
  width: 22px; height: 22px; border-radius: 6px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, ${FX.violet}, ${FX.fuchsia});
}
.fxs-langs { display: flex; flex-wrap: wrap; gap: 4px; }
.fxs-lang {
  font-size: 7.5px; font-weight: 600; letter-spacing: .06em; color: ${FX.dim};
  border: 1px solid rgba(255,255,255,.14); border-radius: 5px; padding: 2px 5px;
}
.fxs-installbar {
  display: flex; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 11px;
  background: rgba(52,211,153,.09); border: 1px solid rgba(52,211,153,.3); font-size: 12px;
}

/* ---- arrows ---- */
.fxs-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 38px; height: 38px; border-radius: 999px;
  background: var(--p); color: var(--ink);
  border: 1px solid var(--line);
  font-size: 15px; cursor: pointer; z-index: 2;
  box-shadow: 0 2px 8px rgba(33,27,18,.12);
  transition: background .15s ease, opacity .15s ease;
}
.fxs-arrow:hover:not(:disabled) { background: var(--p2); }
.fxs-arrow:disabled { opacity: .3; cursor: default; }
.fxs-arrow.is-prev { left: 2px; }
.fxs-arrow.is-next { right: 2px; }
@media (max-width: 760px) { .fxs-arrow { display: none; } }

/* ---- caption ---- */
.fxs-caption { animation: fxs-fadein .4s ease both; }
@media (prefers-reduced-motion: reduce) { .fxs-caption { animation: none; } }
.fxs-caption-top { display: flex; align-items: baseline; gap: .75rem; margin-bottom: .5rem; }
.fxs-num { font-family: var(--serif); font-style: italic; font-size: 1.4rem; }
.fxs-caption-kicker {
  font-size: .7rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--faint); font-weight: 600;
}
.fxs-h3 {
  font-family: var(--serif); font-weight: 600; letter-spacing: -.015em;
  font-size: clamp(1.35rem, 3vw, 1.8rem); line-height: 1.15; margin-bottom: .7rem;
}
.fxs-blurb { color: var(--ink2); line-height: 1.65; font-size: .95rem; margin-bottom: 1rem; }
.fxs-chips { display: flex; flex-wrap: wrap; gap: .45rem; list-style: none; padding: 0; margin: 0; }
.fxs-chip {
  font-size: .72rem; font-weight: 500; color: var(--ink2);
  border: 1px solid var(--line); background: var(--p2);
  border-radius: 999px; padding: .3rem .7rem;
}

/* ---- dots + hint ---- */
.fxs-dots { display: flex; justify-content: center; gap: .5rem; margin-top: 2rem; }
.fxs-dot {
  width: 8px; height: 8px; border-radius: 999px; border: none; padding: 0;
  background: var(--line); cursor: pointer; transition: all .25s ease;
}
.fxs-dot.is-active { width: 22px; background: var(--accent); }
.fxs-hint {
  text-align: center; font-size: .72rem; color: var(--faint); margin-top: .75rem;
}

@keyframes fxs-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .45; transform: scale(.82); }
}
@keyframes fxs-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
