// Mock + locally saved check-in history for the Check-in Calendar (Phase 1, UI only).
export type CalendarMood = "Good" | "Okay" | "Low" | "Difficult";
export type CheckinEntry = {
  date: string; // YYYY-MM-DD (local)
  mood: CalendarMood;
  note: string;
  talkedWithSaathi?: boolean;
  talkedWithListener?: boolean;
  joinedCommunity?: boolean;
  requestedSupport?: boolean;
};

export const CALENDAR_MOODS: CalendarMood[] = ["Good", "Okay", "Low", "Difficult"];
export const MOOD_VALUE: Record<CalendarMood, number> = { Good: 3, Okay: 2, Low: 1, Difficult: 0 };

export function toCalendarMood(choice: string): CalendarMood {
  if (choice === "Good") return "Good";
  if (choice === "Low" || choice === "Tired") return "Low";
  if (choice === "Difficult") return "Difficult";
  return "Okay";
}

const NOTES: Record<CalendarMood, string[]> = {
  Good: ["Had a long walk and felt lighter.", "Laughed a lot with friends today.", "Finished something I'd been putting off.", "Slept well and the morning felt easy."],
  Okay: ["A regular day, nothing big.", "Busy, but I managed.", "Felt calm most of the day.", "Quiet evening, just resting."],
  Low: ["Felt tired and a bit far away from people.", "Didn't have much energy today.", "Missing home a little.", "A slow, heavy kind of day."],
  Difficult: ["I've been feeling overwhelmed today.", "Exams are weighing on me.", "Hard conversation at home.", "Couldn't really settle my thoughts."],
};

const iso = (d: Date) => d.toLocaleDateString("en-CA");

function buildMock(): CheckinEntry[] {
  const out: CheckinEntry[] = [];
  const today = new Date();
  const pattern: (CalendarMood | null)[] = ["Good", null, "Okay", "Okay", null, "Low", "Good", null, "Difficult", "Okay", "Good", null, null, "Low", "Okay", "Good", "Good", null, "Difficult", "Low", null, "Okay", "Good", null];
  for (let i = 85; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const mood = pattern[(i * 7) % pattern.length];
    if (!mood) continue;
    const notes = NOTES[mood];
    out.push({
      date: iso(d), mood, note: notes[i % notes.length] ?? "",
      talkedWithSaathi: mood === "Difficult" || mood === "Low" || i % 4 === 0,
      talkedWithListener: mood === "Difficult" && i % 2 === 0,
      joinedCommunity: i % 5 === 0,
      requestedSupport: mood === "Difficult" && i % 3 === 0,
    });
  }
  return out;
}

const KEY = "saathi-mood-log";

export function loadCheckinHistory(): Record<string, CheckinEntry> {
  const map: Record<string, CheckinEntry> = {};
  for (const e of buildMock()) map[e.date] = e;
  try { Object.assign(map, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
  return map;
}

export function saveTodayCheckin(choice: string, note: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, CheckinEntry>;
    const date = iso(new Date());
    saved[date] = { ...saved[date], date, mood: toCalendarMood(choice || "Okay"), note: note.trim() || saved[date]?.note || "" };
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {}
}
