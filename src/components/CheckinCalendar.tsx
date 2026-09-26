import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, MessageCircle, HeartHandshake, UsersRound, LifeBuoy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SaathiCompanion, type CompanionExpression } from "./SaathiCompanion";
import { CALENDAR_MOODS, MOOD_VALUE, loadCheckinHistory, type CalendarMood, type CheckinEntry } from "@/data/checkins";

const MOOD_STYLE: Record<CalendarMood, { cell: string; ink: string; dot: string }> = {
  Good: { cell: "bg-coral/15", ink: "text-coral", dot: "bg-coral" },
  Okay: { cell: "bg-primary/10", ink: "text-primary", dot: "bg-primary" },
  Low: { cell: "bg-muted", ink: "text-muted-foreground", dot: "bg-muted-foreground/60" },
  Difficult: { cell: "bg-foreground/10", ink: "text-foreground/70", dot: "bg-foreground/50" },
};
const EXPRESSION: Record<CalendarMood, CompanionExpression> = { Good: "happy", Okay: "listening", Low: "supportive", Difficult: "grounding" };
const iso = (d: Date) => d.toLocaleDateString("en-CA");

/** Tiny SAATHI face: ears + mouth shape that reflects the self-reported mood. */
export function MoodGlyph({ mood, className }: { mood: CalendarMood; className?: string }) {
  const mouth = { Good: "M8 13.2q4 3 8 0", Okay: "M8.6 13.8h6.8", Low: "M8.6 14.4q3.4-1.4 6.8 0", Difficult: "M9 14.6q3-2 6 0" }[mood];
  const eyes = mood === "Difficult" || mood === "Low" ? <><path d="M8 10.5q1.2.8 2.4 0M13.6 10.5q1.2.8 2.4 0" /></> : <><circle cx="9.2" cy="10.4" r=".9" fill="currentColor" /><circle cx="14.8" cy="10.4" r=".9" fill="currentColor" /></>;
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9 5.5 3.5 9.5 6.5M19 9l-.5-5.5-4 3" /><path d="M4.5 12a7.5 7 0 0 0 15 0c0-3.2-3.3-5.8-7.5-5.8S4.5 8.8 4.5 12Z" />{eyes}<path d={mouth} /></svg>;
}

export function CheckinCalendar({ onCheckIn, onTalk }: { onCheckIn: () => void; onTalk: () => void }) {
  const reduce = useReducedMotion();
  const today = new Date();
  const todayIso = iso(today);
  const [history, setHistory] = useState<Record<string, CheckinEntry>>({});
  useEffect(() => setHistory(loadCheckinHistory()), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [dir, setDir] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthEntries = useMemo(() => Object.values(history).filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).sort((a, b) => a.date.localeCompare(b.date)), [history, year, month]);
  const isFuture = (d: number) => new Date(year, month, d) > today;
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const move = (n: number) => { setDir(n); setSelected(null); setCursor(new Date(year, month + n, 1)); };

  const counts = CALENDAR_MOODS.map(m => ({ m, n: monthEntries.filter(e => e.mood === m).length }));
  const common = [...counts].sort((a, b) => b.n - a.n)[0];
  const streak = useMemo(() => { let s = 0; const d = new Date(today); if (!history[todayIso]) d.setDate(d.getDate() - 1); while (history[iso(d)]) { s++; d.setDate(d.getDate() - 1); } return s; }, [history, todayIso]);
  const monthName = cursor.toLocaleDateString("en-US", { month: "long" });
  const difficultShare = monthEntries.length ? monthEntries.filter(e => e.mood === "Low" || e.mood === "Difficult").length / monthEntries.length : 0;

  // Trend chart
  const W = 300, H = 110;
  const pts = monthEntries.map(e => ({ x: 12 + ((Number(e.date.slice(8)) - 1) / Math.max(days - 1, 1)) * (W - 24), y: 12 + (3 - MOOD_VALUE[e.mood]) * ((H - 24) / 3), e }));
  const path = pts.map((p, i) => { if (i === 0) return `M${p.x},${p.y}`; const prev = pts[i - 1]!; const cx = (prev.x + p.x) / 2; return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`; }).join(" ");

  const sel = selected ? history[selected] : undefined;
  const selDate = selected ? new Date(selected + "T12:00:00") : null;

  return <div className="p-5 pb-10">
    <div className="rounded-[26px] border border-primary/10 bg-primary-soft p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button>
        <AnimatePresence mode="wait" initial={false}><motion.h2 key={`${year}-${month}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? {} : { opacity: 0, y: -6 }} className="text-base font-semibold">{monthName} {year}</motion.h2></AnimatePresence>
        <Button variant="ghost" size="icon" aria-label="Next month" disabled={atCurrentMonth} onClick={() => move(1)}><ChevronRight /></Button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="relative mt-1.5 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div key={`${year}-${month}`} custom={dir} initial={reduce ? false : { x: dir * 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduce ? {} : { x: -dir * 60, opacity: 0 }} transition={{ duration: .3, ease: "easeOut" }} className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1; const key = iso(new Date(year, month, d)); const entry = history[key]; const isToday = key === todayIso; const future = isFuture(d);
              return <motion.button key={key} disabled={future} aria-label={`${monthName} ${d}${entry ? `, ${entry.mood}` : isToday ? ", not checked in yet" : ""}`} aria-pressed={selected === key}
                onClick={() => setSelected(selected === key ? null : key)}
                animate={{ scale: selected === key && !reduce ? 1.08 : 1 }} whileTap={reduce ? undefined : { scale: .94 }}
                className={cn("relative flex aspect-square flex-col items-center justify-center rounded-2xl text-xs transition-colors", entry ? MOOD_STYLE[entry.mood].cell : "bg-card/60", future && "opacity-35", selected === key && "ring-2 ring-primary")}>
                {isToday && <motion.span className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-primary/50" animate={reduce || entry ? {} : { opacity: [.35, 1, .35] }} transition={{ duration: 2.2, repeat: Infinity }} />}
                <span className={cn("leading-none", isToday && "font-semibold text-primary")}>{d}</span>
                {entry ? <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: reduce ? 0 : i * .012, type: "spring", stiffness: 380, damping: 18 }}><MoodGlyph mood={entry.mood} className={cn("mt-0.5 size-4", MOOD_STYLE[entry.mood].ink)} /></motion.span>
                  : isToday ? <span className="mt-0.5 text-[8px] font-semibold text-primary">Check in</span> : null}
              </motion.button>;
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">{CALENDAR_MOODS.map(m => <span key={m} className="flex items-center gap-1 text-[11px] text-muted-foreground"><MoodGlyph mood={m} className={cn("size-4", MOOD_STYLE[m].ink)} />{m}</span>)}</div>
    </div>

    <AnimatePresence mode="wait">
      {selected && selDate && <motion.section key={selected} initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? {} : { opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="mt-4 rounded-[24px] border border-border bg-card p-5 shadow-soft" aria-live="polite">
        <div className="flex items-start gap-3">
          <SaathiCompanion expression={sel ? EXPRESSION[sel.mood] : "sleepy"} className="size-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-primary">{selDate.toLocaleDateString("en-US", { weekday: "long" })}</p>
            <h3 className="text-lg font-semibold">{selDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</h3>
            {sel ? <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", MOOD_STYLE[sel.mood].cell, MOOD_STYLE[sel.mood].ink)}><MoodGlyph mood={sel.mood} className="size-4" />{sel.mood}</span> : <p className="mt-1 text-sm font-medium">No check-in</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close day details" onClick={() => setSelected(null)}><X className="size-4" /></Button>
        </div>
        {sel ? <>
          {sel.note && <blockquote className="mt-4 rounded-2xl bg-muted/60 p-3 text-sm leading-6">“{sel.note}”</blockquote>}
          <ul className="mt-4 space-y-2 text-sm">
            <Activity icon={MessageCircle} on={!!sel.talkedWithSaathi} yes="Talked with SAATHI" no="No SAATHI conversation" />
            <Activity icon={HeartHandshake} on={!!sel.talkedWithListener} yes="Talked with a listener" no="No listener chat" />
            <Activity icon={UsersRound} on={!!sel.joinedCommunity} yes="Joined a community space" no="No community activity" />
            <Activity icon={LifeBuoy} on={!!sel.requestedSupport} yes="Requested support" no="No human support requested" />
          </ul>
        </> : <>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Nothing recorded for this day. That's completely okay.</p>
          {selected === todayIso && <Button className="mt-4 w-full" onClick={onCheckIn}>Check in today</Button>}
        </>}
      </motion.section>}
    </AnimatePresence>

    <section className="mt-6 rounded-[24px] border border-border bg-card p-5">
      <h3 className="text-base font-semibold">{monthName}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="check-ins" value={String(monthEntries.length)} />
        <Stat label="most common" value={common && common.n ? common.m : "—"} />
        <Stat label="current streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
      </div>
      {monthEntries.length > 0 && <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">{counts.filter(c => c.n).map(c => <motion.span key={c.m} className={MOOD_STYLE[c.m].dot} initial={{ width: 0 }} animate={{ width: `${(c.n / monthEntries.length) * 100}%` }} transition={{ duration: reduce ? 0 : .7 }} />)}</div>}
      {monthEntries.length > 2 && difficultShare >= .5 && <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary-soft p-3 text-xs leading-5"><span>Your recent check-ins show more difficult days. Would talking help?</span><Button variant="link" className="h-auto p-0 text-xs" onClick={onTalk}>Talk</Button></div>}
    </section>

    <section className="mt-4 rounded-[24px] border border-border bg-card p-5">
      <h3 className="text-base font-semibold">Your month</h3>
      <p className="text-xs text-muted-foreground">Based on the moods you shared — not a diagnosis.</p>
      {pts.length > 1 ? <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
        <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">{CALENDAR_MOODS.map(m => <span key={m}>{m}</span>)}</div>
        <svg key={`${year}-${month}`} viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible">
          {[0, 1, 2, 3].map(i => <line key={i} x1="0" x2={W} y1={12 + i * ((H - 24) / 3)} y2={12 + i * ((H - 24) / 3)} className="stroke-border" strokeDasharray="3 4" />)}
          <motion.path d={path} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut" }} />
          {pts.map((p, i) => <motion.circle key={p.e.date} cx={p.x} cy={p.y} r="4" className={cn("stroke-card", p.e.mood === "Good" ? "fill-coral" : p.e.mood === "Okay" ? "fill-primary" : "fill-muted-foreground")} strokeWidth="2" initial={reduce ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: reduce ? 0 : .3 + i * .06 }} />)}
        </svg>
      </div> : <p className="mt-4 text-sm text-muted-foreground">A trend appears after a couple of check-ins this month.</p>}
    </section>
  </div>;
}

function Activity({ icon: Icon, on, yes, no }: { icon: typeof X; on: boolean; yes: string; no: string }) {
  return <li className={cn("flex items-center gap-2", !on && "text-muted-foreground")}><Icon className={cn("size-4", on && "text-primary")} />{on ? yes : no}</li>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-muted/50 px-2 py-3"><p className="text-base font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}
