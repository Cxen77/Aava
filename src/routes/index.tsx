import { NotificationStudio } from "@/components/NotificationStudio";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Heart, BookHeart, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, Ellipsis, Eye, FileText, Flag, HeartHandshake, History, Home, Languages,
  LockKeyhole, LogOut, MessageCircle, Mic, PencilLine, Phone, Plus, Search, Send, Settings, Paperclip, Smile, VolumeX, Info, Camera,
  ShieldCheck, Sparkle, UserRound, UsersRound, Volume2, X,
} from "lucide-react";
import { Flower2, Sprout, House, Scale, Compass, Mountain, HandHeart, Wallet, CloudRain, Sunrise } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckinCalendar } from "@/components/CheckinCalendar";
import { saveTodayCheckin } from "@/data/checkins";
import { JourneyExperience } from "@/components/JourneyExperience";
import { SaathiCompanion, type CompanionExpression } from "@/components/SaathiCompanion";
import {
  communities, groupConversations, conversationPreviews, journeyBadges, history, humanMessages, initialPosts, initialSaathiMessages, listeners,
  notifications, supportRequests, user, wellbeing, type ChatMessage, type Listener, type Community as CommunityData, type FeedPost, type GroupMessage,
} from "@/data/saathi";

type Role = "user" | "listener";
type Screen = "splash" | "onboarding" | "login" | "home" | "checkin" | "talk" | "saathi-chat" | "handoff" | "listeners" | "listener-profile" | "human-chat" | "group-chat" | "wellbeing" | "milestones" | "community" | "group" | "create-post" | "support" | "emergency" | "notifications" | "notification-studio" | "profile" | "edit-profile" | "settings" | "checkin-history" | "reminders" | "privacy" | "consent" | "listener-home" | "requests" | "listener-messages" | "listener-history" | "listener-profile-edit";

const USER_NAV = [
  { screen: "home" as Screen, label: "Home", icon: Home },
  { screen: "talk" as Screen, label: "Talk", icon: MessageCircle },
  { screen: "community" as Screen, label: "Community", icon: UsersRound },
  { screen: "support" as Screen, label: "Support", icon: HeartHandshake },
  { screen: "profile" as Screen, label: "Profile", icon: UserRound },
];
const LISTENER_NAV = [
  { screen: "listener-home" as Screen, label: "Home", icon: Home },
  { screen: "requests" as Screen, label: "Requests", icon: HeartHandshake },
  { screen: "listener-messages" as Screen, label: "Messages", icon: MessageCircle },
  { screen: "listener-history" as Screen, label: "History", icon: History },
  { screen: "listener-profile-edit" as Screen, label: "Profile", icon: UserRound },
];
const ROOTS: Screen[] = ["home", "talk", "community", "support", "profile", "listener-home", "requests", "listener-messages", "listener-history", "listener-profile-edit"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAATHI — You're not alone" },
      { name: "description", content: "A calm wellbeing and human support mobile experience." },
      { property: "og:title", content: "SAATHI — You're not alone" },
      { property: "og:description", content: "A calm wellbeing and human support mobile experience." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: SaathiApp,
});

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className={cn("grid place-items-center rounded-md bg-primary text-primary-foreground", compact ? "h-8 w-8" : "h-14 w-14")}><HeartHandshake className={compact ? "size-4" : "size-7"} /></span>{!compact && <div><div className="text-2xl font-semibold">SAATHI</div><div className="text-xs text-muted-foreground">You&apos;re not alone.</div></div>}</div>;
}

function AppButton({ children, variant = "default", className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button variant={variant} className={cn("h-12 rounded-2xl px-5 text-[15px] active:scale-[.97] transition-transform", className)} {...props}>{children}</Button>;
}
function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = cn("rounded-[22px] border border-border/50 bg-card p-4 shadow-soft", onClick && "cursor-pointer transition-transform duration-200 active:scale-[.98] hover:-translate-y-0.5", className);
  return onClick ? <Button variant="ghost" className={cn(cls, "h-auto w-full justify-start whitespace-normal text-left hover:bg-card")} onClick={onClick}>{children}</Button> : <div className={cls}>{children}</div>;
}
function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warm" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium", tone === "accent" ? "bg-primary-soft text-primary" : tone === "warm" ? "bg-warm text-warm-foreground" : "bg-muted text-muted-foreground")}>{children}</span>;
}
function Status({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal"><span className="status-pulse h-2 w-2 rounded-full bg-teal" />{children}</span>; }
function Avatar({ initials, large = false, src }: { initials: string; large?: boolean; src?: string | undefined }) { return <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-avatar text-sm font-semibold text-avatar-foreground", large ? "h-20 w-20 text-xl" : "h-11 w-11")}>{src ? <img src={src} alt="" className="size-full object-cover" /> : initials}</span>; }

type ProfileInfo = { name: string; about: string; language: string; communication: string; photo: string; email?: string; authProvider?: "google" | "phone" | "email" };
const defaultProfile: ProfileInfo = { name: `${user.name} Sharma`, about: "", language: user.language, communication: user.communication, photo: "", email: "aarav.sharma@gmail.com", authProvider: "google" };
function loadProfile(): ProfileInfo { try { const raw = localStorage.getItem("saathi-profile"); if (raw) return { ...defaultProfile, ...(JSON.parse(raw) as Partial<ProfileInfo>) }; } catch {} return defaultProfile; }
function useProfile(): [ProfileInfo, (p: ProfileInfo) => void] {
  const [profile, setProfile] = useState<ProfileInfo>(loadProfile);
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ProfileInfo>;
      if (customEvent.detail) setProfile(customEvent.detail);
      else setProfile(loadProfile());
    };
    window.addEventListener("saathi:profile-changed", handleUpdate);
    return () => window.removeEventListener("saathi:profile-changed", handleUpdate);
  }, []);
  const save = (p: ProfileInfo) => {
    setProfile(p);
    try {
      localStorage.setItem("saathi-profile", JSON.stringify(p));
      window.dispatchEvent(new CustomEvent("saathi:profile-changed", { detail: p }));
    } catch {}
  };
  return [profile, save];
}
const profileInitials = (name: string) => name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "S";
function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="min-w-0 text-lg font-semibold">{title}</h2>{action && <button onClick={onAction} className="text-xs font-medium text-primary">{action}</button>}</div>; }
function Row({ icon: Icon, title, subtitle, onClick, danger = false }: { icon: typeof Home; title: string; subtitle?: string; onClick?: () => void; danger?: boolean }) { return <button onClick={onClick} className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 text-left last:border-0"><span className={cn("grid h-9 w-9 place-items-center rounded-md", danger ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}><Icon className="size-4" /></span><span className="min-w-0"><span className={cn("block text-sm font-medium", danger && "text-destructive")}>{title}</span>{subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>; }

function recordCheckIn(mood="", note="") {
 saveTodayCheckin(mood, note);
 try {
  const today=new Date().toLocaleDateString("en-CA");
  const previous=localStorage.getItem("saathi-checkin-date");
  if(previous===today) return {count:Number(localStorage.getItem("saathi-checkins")||"0"),streak:Number(localStorage.getItem("saathi-streak")||"1"),newDay:false};
  const yesterday=new Date(Date.now()-86400000).toLocaleDateString("en-CA");
  const streak=previous===yesterday?Number(localStorage.getItem("saathi-streak")||"0")+1:1;
  const count=Number(localStorage.getItem("saathi-checkins")||"0")+1;
  localStorage.setItem("saathi-checkins",String(count));localStorage.setItem("saathi-streak",String(streak));localStorage.setItem("saathi-checkin-date",today);
   const dates=JSON.parse(localStorage.getItem("saathi-journey-dates")||"{}");
   const earnedToday=journeyBadges.filter(b=>b.metric==="checks"&&b.target===count);
   for(const earned of earnedToday)dates[earned.name]=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"});
   if(count===1)dates["First check-in"]=dates["First Step"];
   if(count===3)dates["3 check-ins"]=dates["Three Moments"];
   if(count===7)dates["7 check-ins"]=dates["Staying Connected"];
   localStorage.setItem("saathi-journey-dates",JSON.stringify(dates));
   if(earnedToday[0])localStorage.setItem("saathi-pending-badge",earnedToday[0].name);
  return {count,streak,newDay:true};
 } catch {return {count:1,streak:1,newDay:true};}
}
function SaathiApp() {
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem("saathi-screen") as Screen | null;
      if (saved) return saved;
    } catch {}
    return "home";
  });
  const [historyStack, setHistoryStack] = useState<Screen[]>([]);
  const [role, setRole] = useState<Role>(() => {
    try {
      const saved = localStorage.getItem("saathi-role") as Role | null;
      if (saved === "listener" || saved === "user") return saved;
    } catch {}
    return "user";
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [language, setLanguage] = useState("English");
  const [communication, setCommunication] = useState("Both");
  const [selectedListener, setSelectedListener] = useState<Listener>(() => {
    const firstListener = listeners[0];
    if (!firstListener) throw new Error("SAATHI requires at least one mock listener");
    return firstListener;
  });
  const [selectedGroup, setSelectedGroup] = useState<CommunityData>(communities[0] ?? { id: "loneliness", name: "Living with loneliness", description: "", members: "", activity: "", category: "Loneliness" });
  const [available, setAvailable] = useState(true);
  const [joinedIds, setJoinedIds] = useState<string[]>(() => communities.filter(c => c.joined).map(c => c.id));
  useEffect(() => { try { const saved = localStorage.getItem("saathi-joined-groups"); if (saved) setJoinedIds(JSON.parse(saved)); } catch {} }, []);
  const joinGroup = (id: string) => { const next = [...new Set([...joinedIds, id])]; setJoinedIds(next); try { localStorage.setItem("saathi-joined-groups", JSON.stringify(next)); } catch {} toast.success("Joined this space"); };
  const [showExit, setShowExit] = useState(false);
  const [introReady, setIntroReady] = useState(true);

  const openGroup = (group: CommunityData) => { setSelectedGroup(group); go("group"); };
  const go = (next: Screen) => {
    setHistoryStack((s) => [...s, screen]);
    setScreen(next);
    try { localStorage.setItem("saathi-screen", next); } catch {}
    window.scrollTo(0, 0);
  };
  const back = () => {
    const next = historyStack.at(-1);
    if (next) {
      setHistoryStack((s) => s.slice(0, -1));
      setScreen(next);
      try { localStorage.setItem("saathi-screen", next); } catch {}
      window.scrollTo(0, 0);
    }
  };
  const root = role === "user" ? "home" : "listener-home";
  const enter = (nextRole: Role) => {
    setRole(nextRole);
    try { localStorage.setItem("saathi-role", nextRole); } catch {}
    setHistoryStack([]);
    const nextScreen = nextRole === "user" ? "home" : "listener-home";
    setScreen(nextScreen);
    try { localStorage.setItem("saathi-screen", nextScreen); } catch {}
  };
  const navigateTab = (next: Screen) => {
    setHistoryStack([]);
    setScreen(next);
    try { localStorage.setItem("saathi-screen", next); } catch {}
    window.scrollTo(0, 0);
  };

  if (screen === "splash") return <Splash ready={introReady} onContinue={() => enter("user")} onLogin={() => { setScreen("login"); try { localStorage.setItem("saathi-screen", "login"); } catch {} }} />;
  if (screen === "onboarding") return <Onboarding step={onboardingStep} setStep={setOnboardingStep} language={language} setLanguage={setLanguage} communication={communication} setCommunication={setCommunication} finish={() => enter("user")} />;
  if (screen === "login") return <Login enter={enter} />;

  const nav = role === "user" ? USER_NAV : LISTENER_NAV;
  const activeRoot = ROOTS.includes(screen) ? screen : (["saathi-chat","handoff","listeners","listener-profile","human-chat","group-chat"].includes(screen) ? "talk" : ["group","create-post"].includes(screen) ? "community" : ["checkin","wellbeing","milestones","notifications","notification-studio"].includes(screen) ? "home" : ["privacy","consent","reminders","edit-profile","settings","checkin-history"].includes(screen) ? "profile" : screen === "emergency" ? "support" : root);
  return (
    <div className="saathi-app app-stage min-h-dvh bg-canvas text-foreground">
      <div className="phone-shell relative mx-auto flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-background sm:my-5 sm:h-[calc(100dvh-2.5rem)] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-border sm:shadow-phone">
        <div className="z-30 flex items-center justify-between border-b border-border/40 bg-card/75 px-4 py-1.5 text-[11px] backdrop-blur">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="size-2 rounded-full bg-teal" />
            <strong className="tracking-tight text-primary">SAATHI</strong> · <span className="capitalize text-muted-foreground">{role} mode</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setScreen("login");
                try { localStorage.setItem("saathi-screen", "login"); } catch {}
              }}
              className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
              title="Google Account / Sign In"
            >
              <GoogleIcon className="size-3" />
              <span>Account</span>
            </button>
            <button
              onClick={() => enter(role === "user" ? "listener" : "user")}
              className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Switch to {role === "user" ? "Listener" : "User"}
            </button>
            <button
              onClick={() => go("notification-studio")}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              title="Notification Studio"
            >
              Studio
            </button>
          </div>
        </div>
        <main key={screen} className="screen-enter min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24" id="app-scroll">
          {screen === "home" && <UserHome go={go} openGroup={openGroup} />}
                     {screen === "checkin" && <CheckIn back={back} done={() => navigateTab("home")} />}{screen === "talk" && <TalkInbox go={go} joinedIds={joinedIds} openGroupChat={(item) => { setSelectedGroup(item); go("group-chat"); }} openListener={(item) => { setSelectedListener(item); go("human-chat"); }} />}
          {screen === "group-chat" && <GroupChat group={selectedGroup} back={back} />}
          {screen === "saathi-chat" && <SaathiChat back={back} go={go} />}
          {screen === "handoff" && <Handoff back={back} find={() => go("listeners")} continueChat={() => go("saathi-chat")} />}
          {screen === "listeners" && <ListenerDiscovery back={back} open={(item) => { setSelectedListener(item); go("listener-profile"); }} />}
          {screen === "listener-profile" && <ListenerProfile listener={selectedListener} back={back} start={() => go("human-chat")} />}
          {screen === "human-chat" && <HumanChat listener={selectedListener} back={back} showExit={() => setShowExit(true)} />}
          {screen === "wellbeing" && <Wellbeing back={back} milestones={() => go("milestones")} />}
          {screen === "milestones" && <Milestones back={back} />}
          {screen === "community" && <Community openGroup={openGroup} joinedIds={joinedIds} />}
          {screen === "group" && <CommunityGroup group={selectedGroup} joined={joinedIds.includes(selectedGroup.id)} join={() => joinGroup(selectedGroup.id)} back={back} create={() => go("create-post")} />}
          {screen === "create-post" && <CreatePost group={selectedGroup} back={back} done={() => { toast.success("Your post was added locally"); back(); }} />}
          {screen === "support" && <Support go={go} />}
          {screen === "emergency" && <Emergency back={back} />}
          {screen === "notifications" && <Notifications back={back} go={go} />}{screen === "notification-studio" && <><Header title="Notification Studio" back={back}/><NotificationStudio onNavigate={(t)=>{const m:Record<string,Screen>={checkin:"checkin",evening:"checkin",supportive:"saathi-chat",listener:"human-chat",group:"group-chat",milestone:"milestones",badge:"milestones",streak:"milestones"};go(m[t] ?? "home");}}/></>}
           {screen === "reminders" && <CheckInReminders back={back} />}
          {screen === "profile" && <Profile go={go} logout={() => { setScreen("login"); try { localStorage.setItem("saathi-screen", "login"); } catch {} }} />}
          {screen === "edit-profile" && <EditProfile back={back} />}
          {screen === "checkin-history" && <><Header title="Your check-ins" subtitle="See how you've been feeling over time." back={back}/><CheckinCalendar onCheckIn={() => go("checkin")} onTalk={() => go("saathi-chat")} /></>}
          {screen === "settings" && <SettingsScreen go={go} logout={() => { setScreen("login"); try { localStorage.setItem("saathi-screen", "login"); } catch {} }} back={back} />}
          {screen === "privacy" && <Privacy back={back} />}
          {screen === "consent" && <Consent back={back} />}
          {screen === "listener-home" && <ListenerHome go={go} available={available} setAvailable={setAvailable} />}
          {screen === "requests" && <Requests go={go} />}
          {screen === "listener-messages" && <ListenerMessages go={go} />}
          {screen === "listener-history" && <ListenerHistory />}
          {screen === "listener-profile-edit" && <ListenerProfileEdit available={available} setAvailable={setAvailable} logout={() => { setScreen("login"); try { localStorage.setItem("saathi-screen", "login"); } catch {} }} />}
        </main>
        <BottomNav items={nav} active={activeRoot} navigate={navigateTab} />
        {showExit && <ConfirmDialog title="End this conversation?" body="The conversation will be marked complete. You can still reach support again whenever you need." cancel={() => setShowExit(false)} confirm={() => { setShowExit(false); toast("Conversation ended"); navigateTab(role === "user" ? "support" : "listener-history"); }} />}
      </div>
    </div>
  );
}

function Splash({ ready, onContinue, onLogin }: { ready: boolean; onContinue: () => void; onLogin: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-8">
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-xl bg-primary text-primary-foreground shadow-mark">
          <HeartHandshake className="size-9" />
        </div>
        <h1 className="text-4xl font-semibold">SAATHI</h1>
        <p className="mt-2 text-muted-foreground">You&apos;re not alone.</p>
        <div className="mt-16 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full bg-primary transition-all duration-700", ready ? "w-full" : "w-1/3")} />
        </div>
        <div className="mt-8 flex flex-col items-center gap-2.5">
          <AppButton className="w-56" onClick={onContinue}>
            Enter SAATHI <ArrowRight />
          </AppButton>
          <Button
            variant="outline"
            className="h-11 w-56 gap-2 rounded-2xl border-border bg-card text-xs font-medium text-foreground shadow-soft hover:bg-muted"
            onClick={onLogin}
          >
            <GoogleIcon className="size-4" />
            <span>Sign in with Google</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const ONBOARDING = [
  { eyebrow: "WELCOME", title: "Support that stays with you", body: "SAATHI helps you stay connected with support throughout your journey.", icon: HeartHandshake },
  { eyebrow: "HOW IT HELPS", title: "A gentle space for every day", body: "Check in regularly, talk with SAATHI whenever you need, and reach a human supporter when you want one.", icon: MessageCircle },
  { eyebrow: "YOUR CONTROL", title: "Privacy, made understandable", body: "You control your participation. Sensitive information is handled carefully, and your choices can be changed anytime.", icon: ShieldCheck },
  { eyebrow: "LANGUAGE", title: "Choose what feels natural", body: "You can change your language later in your profile.", icon: Languages },
  { eyebrow: "COMMUNICATION", title: "How would you like to connect?", body: "Choose the way you feel most comfortable checking in.", icon: Volume2 },
];
function Onboarding({ step, setStep, language, setLanguage, communication, setCommunication, finish }: { step: number; setStep: (n: number) => void; language: string; setLanguage: (s: string) => void; communication: string; setCommunication: (s: string) => void; finish: () => void }) {
  const item = ONBOARDING[step] ?? ONBOARDING[0];
  if (!item) return null;
  const Icon = item.icon;
  return <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-background p-6 pt-10"><div className="flex items-center justify-between"><Logo compact /><button onClick={finish} className="text-sm text-muted-foreground">Skip</button></div><div className="mt-6 flex gap-1.5">{ONBOARDING.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />)}</div><div className="flex flex-1 flex-col justify-center py-10">{step < 3 ? <SaathiCompanion expression={step === 0 ? "curious" : step === 1 ? "listening" : "supportive"} className="mb-5 size-24"/> : <span className="mb-7 grid h-16 w-16 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-7" /></span>}<p className="text-xs font-semibold text-primary">{item.eyebrow}</p><h1 className="mt-3 max-w-sm text-3xl font-semibold leading-tight">{item.title}</h1><p className="mt-4 max-w-sm leading-7 text-muted-foreground">{item.body}</p>{step === 1 && <div className="mt-7 space-y-3">{[[CalendarDays,"Check in","Regular wellbeing conversations."],[MessageCircle,"Talk","Talk with SAATHI whenever you need."],[UsersRound,"Connect","Reach a human supporter when you want one."]].map(([I,t,b]) => { const Comp = I as typeof Home; return <div key={t as string} className="flex gap-3"><Comp className="mt-0.5 size-5 text-primary"/><div><b className="text-sm">{t as string}</b><p className="text-sm text-muted-foreground">{b as string}</p></div></div>; })}</div>}{step === 3 && <ChoiceGrid options={["English","हिन्दी","मराठी","தமிழ்"]} value={language} setValue={setLanguage} />}{step === 4 && <ChoiceGrid options={["Text","Voice","Both"]} value={communication} setValue={setCommunication} />}</div><div className="grid grid-cols-[auto_1fr] gap-3">{step > 0 && <Button variant="outline" className="h-12" onClick={() => setStep(step-1)}><ArrowLeft /></Button>}<AppButton onClick={() => step === ONBOARDING.length-1 ? finish() : setStep(step+1)}>{step === ONBOARDING.length-1 ? "Continue" : "Next"}<ArrowRight /></AppButton></div></div>;
}
function ChoiceGrid({ options, value, setValue }: { options: string[]; value: string; setValue: (s: string) => void }) { return <div className="mt-8 grid grid-cols-2 gap-3">{options.map((o) => <button key={o} onClick={() => setValue(o)} className={cn("flex min-h-14 items-center justify-between rounded-md border p-4 text-left text-sm font-medium", value === o ? "border-primary bg-primary-soft text-primary" : "border-border bg-card")}><span>{o}</span>{value === o && <Check className="size-4" />}</button>)}</div>; }

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

type GoogleAccount = {
  name: string;
  email: string;
  avatarBg: string;
  avatarText: string;
  photo?: string;
};

const GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    avatarBg: "bg-[#1a73e8]",
    avatarText: "AS",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  },
  {
    name: "Priya Patel",
    email: "priya.p@gmail.com",
    avatarBg: "bg-[#188038]",
    avatarText: "PP",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  },
  {
    name: "Kabir Mehta",
    email: "kabir.mehta@gmail.com",
    avatarBg: "bg-[#ea4335]",
    avatarText: "KM",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
];

function GoogleSignInModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (acc: GoogleAccount) => void;
}) {
  const [loadingAcc, setLoadingAcc] = useState<GoogleAccount | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  const pick = (account: GoogleAccount) => {
    setLoadingAcc(account);
    window.setTimeout(() => {
      onSelect(account);
      setLoadingAcc(null);
    }, 700);
  };

  const handleCustom = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    pick({
      name: customName.trim(),
      email: customEmail.trim(),
      avatarBg: "bg-[#1a73e8]",
      avatarText: customName.trim().slice(0, 2).toUpperCase(),
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-[26px] border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <GoogleIcon className="size-5" />
            <span className="text-sm font-semibold text-foreground">Sign in with Google</span>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-semibold leading-snug">Choose an account</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            to continue to <strong className="font-semibold text-foreground">SAATHI</strong>
          </p>
        </div>

        {loadingAcc ? (
          <div className="my-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-9 animate-spin rounded-full border-3 border-muted border-t-[#4285F4]" />
            <div>
              <p className="text-sm font-semibold text-foreground">Signing in as {loadingAcc.name}…</p>
              <p className="text-xs text-muted-foreground">{loadingAcc.email}</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-1.5">
            {GOOGLE_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => pick(acc)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-transparent p-3 text-left transition-all duration-150 hover:border-border hover:bg-muted/50 active:scale-[.985]"
              >
                <span
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold text-white shadow-xs",
                    acc.avatarBg
                  )}
                >
                  {acc.photo ? (
                    <img src={acc.photo} alt={acc.name} className="size-full object-cover" />
                  ) : (
                    acc.avatarText
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{acc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                </div>
              </button>
            ))}

            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-border/70 p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <span className="grid size-10 place-items-center rounded-full bg-muted text-foreground">
                  <Plus className="size-4" />
                </span>
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleCustom} className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground">Enter Google account details</p>
                <Input
                  autoFocus
                  placeholder="Your full name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-9 bg-card text-xs"
                />
                <Input
                  type="email"
                  placeholder="you@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="h-9 bg-card text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowCustom(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 bg-[#1a73e8] text-xs text-white hover:bg-[#1557b0]">
                    Continue
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          To continue, Google will share your name, email address, language preference, and profile picture with SAATHI.
        </div>
      </div>
    </div>,
    document.body
  );
}

function Login({ enter }: { enter: (r: Role) => void }) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [, saveProfile] = useProfile();

  const handleGoogleSuccess = (account: GoogleAccount) => {
    saveProfile({
      name: account.name,
      about: "Finding space for quiet moments.",
      language: "English & Hindi",
      communication: "Both",
      photo: account.photo || "",
      email: account.email,
      authProvider: "google",
    });
    setShowGoogleModal(false);
    toast.success(`Signed in as ${account.name} (${account.email})`);
    enter("user");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-background p-6 pt-12">
      <Logo />
      <div className="mt-14">
        <p className="text-xs font-semibold text-primary">WELCOME BACK</p>
        <h1 className="mt-2 text-3xl font-semibold">A quiet place to begin.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Continue with your phone number, email, or Google. This prototype does not create a real account.
        </p>
        <div className="mt-8 flex rounded-md bg-muted p-1">
          <button
            onClick={() => setMode("phone")}
            className={cn("h-10 flex-1 rounded text-sm font-medium", mode === "phone" && "bg-card shadow-soft")}
          >
            Phone
          </button>
          <button
            onClick={() => setMode("email")}
            className={cn("h-10 flex-1 rounded text-sm font-medium", mode === "email" && "bg-card shadow-soft")}
          >
            Email
          </button>
        </div>
        <label className="mt-5 block text-sm font-medium">
          {mode === "phone" ? "Phone number" : "Email address"}
        </label>
        <Input
          className="mt-2 h-12 bg-card"
          placeholder={mode === "phone" ? "+91 98765 43210" : "you@example.com"}
        />
        <AppButton className="mt-4 w-full" onClick={() => enter("user")}>
          Continue <ArrowRight />
        </AppButton>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="h-12 w-full gap-2.5 rounded-2xl border-border/80 bg-card font-medium text-foreground shadow-soft transition-all duration-200 hover:border-border hover:bg-muted/40 active:scale-[.98]"
            onClick={() => setShowGoogleModal(true)}
          >
            <GoogleIcon className="size-5 shrink-0" />
            <span>Sign in with Google</span>
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full gap-2 rounded-2xl border-border/80 bg-card text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-[.98]"
            onClick={() => enter("listener")}
          >
            <HeartHandshake className="size-5 text-primary" />
            <span>Continue as Listener</span>
          </Button>
        </div>
      </div>
      <p className="mt-auto pt-8 text-center text-xs leading-5 text-muted-foreground">
        By continuing, you agree to the prototype privacy and consent choices.
      </p>

      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelect={handleGoogleSuccess}
      />
    </div>
  );
}

function Header({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: () => void; action?: ReactNode }) { return <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-5 pb-4 pt-5 backdrop-blur"><div>{back ? <Button aria-label="Go back" variant="ghost" size="icon" onClick={back}><ArrowLeft /></Button> : <Logo compact />}</div><div className="min-w-0"><h1 className="truncate text-lg font-semibold">{title}</h1>{subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}</div><div>{action}</div></header>; }
function BottomNav({ items, active, navigate }: { items: typeof USER_NAV; active: Screen; navigate: (s: Screen) => void }) { return <nav className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/40 bg-card/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:rounded-b-[28px]">{items.map(({screen,label,icon:Icon}) => <button key={screen} onClick={() => navigate(screen)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium transition-all duration-200 active:scale-90", active === screen ? "bg-primary-soft text-primary nav-active" : "text-muted-foreground hover:text-primary")}><Icon className="size-5" strokeWidth={active === screen ? 2.3 : 1.8}/><span>{label}</span></button>)}</nav>; }

function FeedCard({ post, group, openGroup }: { post: FeedPost; group: CommunityData; openGroup: (g: CommunityData) => void }) {
  const [liked, setLiked] = useState(false);
  const [replies, setReplies] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  return <article className="feed-enter rounded-[22px] border border-border/50 bg-card p-4 shadow-soft transition-transform duration-200 active:scale-[.985]">
    <div className="flex items-center gap-2"><span className={cn("grid size-9 shrink-0 place-items-center rounded-full",communityIcon(group.id).tone)}><CommunityIcon id={group.id} className="size-4"/></span><Button variant="link" className="h-auto min-w-0 p-0 text-xs font-semibold text-primary" onClick={() => openGroup(group)}>{group.name}</Button><span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{post.time}</span></div>
    <div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">{post.author}</span><span className="size-1 rounded-full bg-border"/><span className="text-xs text-muted-foreground">{group.category}</span></div>
    <h3 className="mt-3 text-base font-semibold leading-snug">{post.title}</h3><p className="mt-2 text-sm leading-6 text-foreground/80">{post.body}</p>
    <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
      <Button variant="ghost" size="sm" aria-label={`${liked ? "Unlike" : "Like"} ${post.title}`} onClick={() => setLiked(!liked)} className={cn("gap-1.5 text-xs transition-transform active:scale-90",liked&&"text-coral like-pop")}><Heart className={cn("size-4",liked&&"fill-current")}/>{post.likes+(liked?1:0)}</Button>
      <Button variant="ghost" size="sm" onClick={() => setShowReplies(!showReplies)} className="gap-1.5 text-xs"><MessageCircle className="size-4"/>{post.replies+replies.length} replies</Button>
      <Button variant="ghost" size="icon" className="ml-auto size-9" aria-label={`Report ${post.title}`} title="Report post" onClick={() => toast("Post reported for moderator review (prototype)")}><Ellipsis className="size-4"/></Button>
    </div>
    <div className={cn("reply-panel overflow-hidden transition-all duration-300",showReplies ? "mt-3 max-h-80 border-t border-border pt-3 opacity-100" : "max-h-0 opacity-0")} aria-hidden={!showReplies}><p className="text-xs text-muted-foreground">{post.replies} community replies</p>{replies.map((reply,i) => <p key={i} className="mt-2 rounded-md bg-muted p-3 text-sm">{reply}</p>)}<form onSubmit={(e) => { e.preventDefault(); if(draft.trim()) { setReplies([...replies,draft.trim()]); setDraft(""); toast.success("Reply added locally"); } }} className="mt-3 flex gap-2"><Input aria-label="Write a reply" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a kind reply…" className="h-10"/><Button type="submit" size="icon" aria-label="Send reply" className="size-10 shrink-0"><Send className="size-4"/></Button></form></div>
  </article>;
}
const MOOD_MESSAGES:Record<string,string>={Good:"Nice to hear that.",Okay:"That's okay. I'm here.",Low:"Want to talk about it?",Difficult:"Let's take this one step at a time."};
function WarmthSymbol({className="size-5"}:{className?:string}){return <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true"><path d="M16 27C8 23 7 17 10 13c3 1 5 4 6 6 1-5 4-9 8-13 2 9 4 17-8 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M14 24c-2-3-1-5 2-8 0 3 3 4 2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
type ReminderPreferences={enabled:boolean;time:string;frequency:"daily"|"weekdays"|"weekends";pausedUntil:string;dismissedDate:string};
const REMINDER_DEFAULTS:ReminderPreferences={enabled:false,time:"19:00",frequency:"daily",pausedUntil:"",dismissedDate:""};
function loadReminderPreferences():ReminderPreferences{try{return {...REMINDER_DEFAULTS,...JSON.parse(localStorage.getItem("saathi-reminders")||"{}")}}catch{return REMINDER_DEFAULTS}}
function saveReminderPreferences(next:ReminderPreferences){try{localStorage.setItem("saathi-reminders",JSON.stringify(next))}catch{toast.error("Reminder choices could not be saved on this device")}}
function reminderDue(p:ReminderPreferences,checkedToday:boolean,now:Date){const today=now.toLocaleDateString("en-CA");const day=now.getDay();return p.enabled&&!checkedToday&&p.dismissedDate!==today&&(!p.pausedUntil||p.pausedUntil<today)&&now.toTimeString().slice(0,5)>=p.time&&(p.frequency==="daily"||p.frequency==="weekdays"&&day>0&&day<6||p.frequency==="weekends"&&(day===0||day===6))}
function ChatAvatar({expression,latest}:{expression:CompanionExpression;latest:boolean}){const reduce=useReducedMotion();const react:Record<string,{rotate?:number[];scale?:number[];y?:number[]}>={thinking:{rotate:[0,-8,8,0]},curious:{rotate:[0,12,0],y:[0,-3,0]},responding:{scale:[1,1.18,1],y:[0,-4,0]},happy:{scale:[1,1.22,.95,1],y:[0,-6,0]},supportive:{scale:[1,1.08,1]},handoff:{rotate:[0,-10,0]},listening:{rotate:[0,6,0]},voice:{scale:[1,1.12,1,1.12,1]},welcoming:{rotate:[0,-12,10,0],y:[0,-4,0]}};return <motion.div key={latest?expression:"old"} className="relative mt-1 size-9 shrink-0" initial={reduce?false:{scale:.6,opacity:0}} animate={reduce?{opacity:1}:{opacity:1,...(react[expression]??{scale:[1,1.1,1]})}} transition={{duration:.7,ease:"easeOut"}}>{latest&&!reduce&&<motion.span className="absolute inset-0 rounded-full bg-primary/20" initial={{scale:.8,opacity:.7}} animate={{scale:1.7,opacity:0}} transition={{duration:.9}}/>}<SaathiCompanion expression={expression} lively={!latest} className="relative size-9"/></motion.div>}
function CheckInReminders({back}:{back:()=>void}){const [prefs,setPrefs]=useState<ReminderPreferences>(REMINDER_DEFAULTS);useEffect(()=>setPrefs(loadReminderPreferences()),[]);const update=(change:Partial<ReminderPreferences>)=>{const next={...prefs,...change};setPrefs(next);saveReminderPreferences(next)};const today=new Date().toLocaleDateString("en-CA");const tomorrow=new Date(Date.now()+86400000).toLocaleDateString("en-CA");return <><Header title="Check-in reminders" subtitle="At your own pace" back={back}/><div className="p-5"><div className="flex items-start gap-3 border-b border-border pb-6"><SaathiCompanion expression="supportive" className="size-16 shrink-0"/><div><h2 className="text-lg font-semibold">A gentle nudge, only if you want one</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Welcome whenever you're ready. Pausing or skipping a reminder never changes your check-ins or badges.</p></div></div><div className="mt-6 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Remind me to check in</p><p className="mt-1 text-xs text-muted-foreground">Off by default · shown while SAATHI is open</p></div><Switch aria-label="Enable check-in reminders" checked={prefs.enabled} onCheckedChange={v=>update({enabled:v,pausedUntil:""})}/></div><div className="mt-7 space-y-5"><label className="block text-sm font-medium">Time<input aria-label="Reminder time" type="time" value={prefs.time} disabled={!prefs.enabled} onChange={e=>update({time:e.target.value})} className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-3 text-foreground disabled:opacity-50"/></label><fieldset disabled={!prefs.enabled}><legend className="text-sm font-medium">When</legend><div className="mt-2 grid grid-cols-3 gap-2">{(["daily","weekdays","weekends"] as const).map(f=><Button key={f} variant={prefs.frequency===f?"default":"outline"} aria-pressed={prefs.frequency===f} disabled={!prefs.enabled} className="h-11 px-1 text-xs capitalize" onClick={()=>update({frequency:f})}>{f}</Button>)}</div></fieldset></div>{prefs.enabled&&<div className="mt-8 border-t border-border pt-6"><p className="text-sm font-semibold">Take a break whenever you need</p><p className="mt-1 text-xs text-muted-foreground">Your journey stays exactly as it is.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>update({pausedUntil:tomorrow})}>Pause until tomorrow</Button><Button variant="outline" onClick={()=>update({pausedUntil:new Date(Date.now()+7*86400000).toLocaleDateString("en-CA")})}>Pause for a week</Button>{prefs.pausedUntil&&<Button variant="ghost" onClick={()=>update({pausedUntil:""})}>Resume</Button>}</div>{prefs.pausedUntil&&<p role="status" className="mt-3 text-xs text-muted-foreground">Paused through {prefs.pausedUntil}. You can still check in any time.</p>}<Button variant="ghost" className="mt-4 px-0 text-muted-foreground" onClick={()=>update({dismissedDate:today})}>Dismiss today's reminder</Button>{prefs.dismissedDate===today&&<p role="status" className="text-xs text-muted-foreground">No more reminder today. Your progress is unchanged.</p>}</div>}<p className="mt-7 text-xs leading-5 text-muted-foreground">This prototype only shows reminders in the app while it is open; it does not send phone notifications.</p></div></>}
function WarmthCelebration({count,newDay}:{count:number;newDay:boolean}){
 const reduce=useReducedMotion();
 const [displayCount,setDisplayCount]=useState(reduce||!newDay?count:Math.max(0,count-1));
 useEffect(()=>{if(reduce||!newDay)return;const timer=window.setTimeout(()=>setDisplayCount(count),1250);return()=>window.clearTimeout(timer)},[count,newDay,reduce]);
 return <div role="status" aria-label={`${count} ${count===1?"day":"days"} of warmth`} className="relative mx-auto my-3 flex w-full max-w-72 flex-col items-center overflow-visible">
   <div className="relative grid size-48 place-items-center" aria-hidden="true">
     {!reduce&&<><motion.span className="absolute inset-7 rounded-full border-[3px] border-coral/60" initial={{scale:.45,opacity:0}} animate={{scale:[.45,1.45],opacity:[.9,0]}} transition={{duration:1.6,delay:.45}}/><motion.span className="absolute inset-7 rounded-full border-2 border-teal/45" initial={{scale:.45,opacity:0}} animate={{scale:[.45,1.5],opacity:[.75,0]}} transition={{duration:1.7,delay:.9}}/>{Array.from({length:12},(_,i)=>{const angle=(i/12)*Math.PI*2;return <motion.span key={i} className={cn("absolute left-1/2 top-1/2 rounded-full",i%3===0?"size-2.5 bg-teal":"size-2 bg-coral")} initial={{x:0,y:0,scale:0,opacity:0}} animate={{x:Math.cos(angle)*80,y:Math.sin(angle)*80,scale:[0,1.5,.5],opacity:[0,1,0]}} transition={{duration:1.5,delay:.8+i*.06,ease:"easeOut"}}/>})}</>}
     <motion.span className="absolute grid size-36 place-items-center rounded-full border-4 border-coral/25 bg-warm text-warm-foreground shadow-soft" initial={reduce?false:{scale:.25,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:120,damping:9,delay:.25}}>
       <motion.span initial={reduce?false:{y:38,scale:.2,rotate:-22,opacity:0}} animate={reduce?{y:0,scale:1,rotate:0,opacity:1}:{y:[38,-14,0],scale:[.2,1.22,1],rotate:[-22,9,0],opacity:1}} transition={{duration:1.25,delay:.45,times:[0,.65,1]}}><WarmthSymbol className="size-20"/></motion.span>
     </motion.span>
   </div>
   <div className="-mt-1 flex min-h-14 items-baseline gap-2 text-warm-foreground"><AnimatePresence mode="wait" initial={false}><motion.span key={displayCount} className="inline-block min-w-8 text-5xl font-bold tabular-nums" initial={reduce?false:{y:28,scale:.6,opacity:0}} animate={{y:0,scale:1,opacity:1}} exit={reduce?{}:{y:-25,scale:.7,opacity:0}} transition={{type:"spring",stiffness:220,damping:14}}>{displayCount}</motion.span></AnimatePresence><span className="text-base font-semibold">{count===1?"day":"days"} of warmth</span></div>
 </div>
}
function UserHome({go,openGroup}:{go:(s:Screen)=>void;openGroup:(g:CommunityData)=>void}){
  const [feeling,setFeeling]=useState("");const [checkin,setCheckin]=useState({count:0,streak:0,today:false});const [reminder,setReminder]=useState<ReminderPreferences>(REMINDER_DEFAULTS);const [currentTime,setCurrentTime]=useState<Date|null>(null);const reduce=useReducedMotion();
  useEffect(()=>{try{setCheckin({count:Number(localStorage.getItem("saathi-checkins")||"0"),streak:Number(localStorage.getItem("saathi-streak")||"0"),today:localStorage.getItem("saathi-checkin-date")===new Date().toLocaleDateString("en-CA")});setReminder(loadReminderPreferences())}catch{}},[]);
  useEffect(()=>{setCurrentTime(new Date());const timer=window.setInterval(()=>setCurrentTime(new Date()),60000);return()=>window.clearInterval(timer)},[]);
  const expression:CompanionExpression=feeling==="Good"?"happy":feeling==="Okay"?"listening":feeling==="Low"?"supportive":feeling==="Difficult"?"grounding":checkin.today?"celebrating":"curious";
  const [profile]=useProfile();
 return <div className="px-5 pb-8 pt-7">
 <header className="home-greeting grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="text-sm text-muted-foreground">Good morning,</p><h1 className="text-[32px] font-semibold leading-tight">{profile.name.split(" ")[0]}<span className="text-coral">.</span></h1></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Open notifications" className="relative size-11 rounded-full" onClick={()=>go("notifications")}><Bell className="size-5"/><span className="notification-ping absolute right-2 top-2 size-2 rounded-full bg-coral"/></Button><Button variant="ghost" size="icon" className="size-11 rounded-full p-0" aria-label="Open profile" onClick={()=>go("profile")}><Avatar initials={profileInitials(profile.name)} src={profile.photo||undefined}/></Button></div></header>
  <section className="feature-enter relative mt-6 overflow-hidden rounded-[26px] border border-primary/10 bg-primary-soft p-5 shadow-soft"><div className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-full bg-card/45 blur-2xl"/><div className="relative flex items-center justify-between gap-2 text-[11px] font-semibold uppercase text-primary"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-coral"/>Today's check-in</span>{checkin.streak>0&&<motion.span key={checkin.streak} initial={reduce?false:{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-1 text-[10px] normal-case text-warm-foreground"><WarmthSymbol className="size-4"/>{checkin.streak} {checkin.streak===1?"day":"days"} of warmth</motion.span>}</div><div className="relative mt-1 flex items-center gap-2"><div className="min-w-0 flex-1"><h2 className="text-xl font-semibold leading-tight">How are you feeling today?</h2><AnimatePresence mode="wait"><motion.p key={feeling||"default"} initial={reduce?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={reduce?{}:{opacity:0,y:-5}} className="mt-2 min-h-9 text-xs leading-5 text-muted-foreground" aria-live="polite">{feeling?MOOD_MESSAGES[feeling]:"Whatever today feels like, there's room for it here."}</motion.p></AnimatePresence></div><AnimatePresence mode="wait"><motion.div key={expression} className="relative size-24 shrink-0" initial={reduce?false:{scale:.82,opacity:.55}} animate={{scale:1,opacity:1}} exit={reduce?{}:{scale:.86,opacity:0}} transition={{type:"spring",stiffness:260,damping:18}}><SaathiCompanion expression={expression} lively className="size-24"/>{feeling&&!reduce&&<motion.span className="absolute inset-1 -z-0 rounded-full border-2 border-coral/35" initial={{scale:.65,opacity:.8}} animate={{scale:1.25,opacity:0}} transition={{duration:.8}}/>}</motion.div></AnimatePresence></div><div className="relative mt-2 grid grid-cols-4 gap-2">{["Good","Okay","Low","Difficult"].map(x=><motion.div key={x} animate={feeling===x&&!reduce?{scale:1.055}:{scale:1}} transition={{type:"spring",stiffness:400,damping:20}}><Button aria-pressed={feeling===x} size="sm" variant={feeling===x?"default":"outline"} onClick={()=>setFeeling(x)} className="h-11 w-full min-w-0 rounded-xl px-1 text-xs">{x}</Button></motion.div>)}</div><div className="relative mt-4 flex items-center justify-between gap-2"><Button variant="link" className="h-8 px-0 text-primary" onClick={()=>go("checkin")}>{checkin.today?"Check in again":"Continue check-in"}<ArrowRight className="size-4"/></Button>{checkin.today&&<span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal"><CheckCircle2 className="size-3.5"/> Complete today</span>}</div></section>
  {currentTime&&reminderDue(reminder,checkin.today,currentTime)&&<div role="status" className="mt-3 flex items-start gap-3 rounded-[22px] border border-border bg-card p-4 shadow-soft"><SaathiCompanion expression="supportive" className="size-12 shrink-0"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">A moment for yourself?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">You can check in whenever you feel ready.</p><div className="mt-2 flex flex-wrap gap-2"><Button variant="link" className="h-8 px-0 text-primary" onClick={()=>go("checkin")}>Check in <ArrowRight className="size-3"/></Button><Button variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={()=>{const next={...reminder,dismissedDate:new Date().toLocaleDateString("en-CA")};setReminder(next);saveReminderPreferences(next)}}>Not today</Button></div></div></div>}
   <Button variant="ghost" className="mt-1 h-9 w-full justify-center text-xs text-primary" onClick={()=>go("checkin-history")}><CalendarDays className="size-4"/> View all check-ins</Button>
   <Card onClick={()=>go("saathi-chat")} className="feature-enter mt-3 border-primary/10 bg-card !p-5"><div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4"><span className="ai-mark grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><HeartHandshake className="size-6"/></span><div className="min-w-0"><p className="text-base font-semibold">Talk to SAATHI</p><p className="text-xs text-muted-foreground">Tell me what’s on your mind.</p></div><ArrowRight className="size-4 text-primary"/></div></Card>
 <div className="mt-8"><SectionTitle title="For you" action="Explore groups" onAction={()=>go("community")}/><p className="-mt-2 mb-4 text-xs text-muted-foreground">Stories and support from moderated spaces</p><div className="space-y-3">{initialPosts.map(post=>{const group=communities.find(c=>c.id===post.groupId);return group?<FeedCard key={post.id} post={post} group={group} openGroup={openGroup}/>:null})}</div></div><Button variant="outline" className="mt-6 h-11 w-full" onClick={()=>go("listeners")}><HeartHandshake className="size-4"/> Find a listener</Button></div>
}
function CheckIn({back,done}:{back:()=>void;done:()=>void}){
 const [step,setStep]=useState(0);const [choice,setChoice]=useState("");const [firstMood,setFirstMood]=useState("");const [text,setText]=useState("");const [recording,setRecording]=useState(false);const [result,setResult]=useState<ReturnType<typeof recordCheckIn>|null>(null);const [celebrationKey,setCelebrationKey]=useState(0);const reduce=useReducedMotion();const questions=["How are you feeling today?","How has your day been?","Is there anything bothering you?"];
 if(result)return <><Header title="Daily check-in" back={back}/><div className="flex min-h-[66dvh] flex-col items-center justify-center p-6 text-center"><div className="relative"><SaathiCompanion key={celebrationKey} expression="celebrating" className="size-32"/>{!reduce&&[0,1,2,3].map(i=><motion.span key={`${celebrationKey}-${i}`} className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-coral" initial={{opacity:1,scale:0}} animate={{opacity:0,scale:1.5,x:(i%2?1:-1)*(50+i*8),y:i<2?-55:35}} transition={{duration:.9,delay:i*.12}}/>)}</div><motion.div className="w-full max-w-sm" initial={reduce?false:{opacity:0,y:16}} animate={{opacity:1,y:0}}><p className="mt-1 text-xs font-semibold uppercase text-teal">A moment for yourself</p><h2 className="mt-2 text-2xl font-semibold">Check-in complete</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You're staying connected. However today feels, showing up is enough.</p><WarmthCelebration key={celebrationKey} count={result.streak} newDay={result.newDay}/><p className="mt-1 text-xs font-medium text-teal">{result.count} {result.count===1?"check-in":"check-ins"} completed</p>{!result.newDay&&<p className="mt-2 text-xs text-muted-foreground">Already checked in today. You're always welcome back.</p>}<Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={()=>setCelebrationKey(key=>key+1)}>Replay moment</Button><AppButton className="mt-5 w-full" onClick={done}>Back to Home <ArrowRight/></AppButton></motion.div></div></>;
 return <><Header title="Daily check-in" subtitle={`Question ${step+1} of 3`} back={back}/><div className="p-5"><div className="mb-8 flex gap-2">{questions.map((_,i)=><span key={i} className="h-1 flex-1 overflow-hidden rounded bg-muted"><motion.span className="block h-full origin-left bg-primary" initial={false} animate={{scaleX:i<=step?1:0}} transition={{duration:reduce?0:.45}}/></span>)}</div><div className="flex items-center gap-2"><SaathiCompanion expression={choice==="Good"?"happy":choice==="Low"||choice==="Difficult"?"supportive":step===2?"listening":"curious"} className="size-20"/><div><p className="text-xs font-semibold text-primary">TAKE YOUR TIME</p><p className="mt-1 text-xs text-muted-foreground">There's no right answer.</p></div></div><h2 className="mt-5 text-2xl font-semibold leading-tight">{questions[step]}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Share only what feels comfortable.</p>{step<2?<div className="mt-8 grid grid-cols-2 gap-3">{["Good","Calm","Okay","Tired","Low","Difficult"].map(x=><motion.div key={x} animate={choice===x&&!reduce?{scale:1.035}:{scale:1}}><Button variant={choice===x?"secondary":"outline"} aria-pressed={choice===x} onClick={()=>setChoice(x)} className="min-h-14 w-full text-sm">{x}</Button></motion.div>)}</div>:<Textarea className="mt-8 min-h-36 bg-card" placeholder="Write what’s on your mind..." value={text} onChange={e=>setText(e.target.value)}/>}<Button variant={recording?"secondary":"outline"} onClick={()=>setRecording(!recording)} className="mt-5 h-12 w-full"><Mic className="size-4"/>{recording?"Listening… tap to stop":"Respond with voice (optional)"}</Button><div className="mt-10 grid grid-cols-[auto_1fr] gap-3"><Button variant="ghost" className="h-12" onClick={()=>step===2?setResult(recordCheckIn(firstMood,text)):setStep(step+1)}>Skip</Button><AppButton onClick={()=>{if(step===2)setResult(recordCheckIn(firstMood,text));else{if(step===0)setFirstMood(choice);setStep(step+1);setChoice("");}}}>{step===2?"Finish check-in":"Continue"}<ArrowRight/></AppButton></div></div></>;
}

function TalkInbox({go,joinedIds,openGroupChat,openListener}:{go:(s:Screen)=>void;joinedIds:string[];openGroupChat:(g:CommunityData)=>void;openListener:(l:Listener)=>void}){
 const [tab,setTab]=useState<"chats"|"groups">("chats");
 const [preview,setPreview]=useState("How are you feeling today?");
 const [humanPreviews,setHumanPreviews]=useState<Record<string,string>>({});
 const [groupPreviews,setGroupPreviews]=useState<Record<string,GroupMessage[]>>({});
 const [readGroups,setReadGroups]=useState<string[]>([]);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("saathi-chat")||"null") as ChatMessage[]|null;if(saved?.length)setPreview(saved.at(-1)?.text ?? "How are you feeling today?");const next:Record<string,string>={};for(const listener of listeners){const messages=JSON.parse(localStorage.getItem(`saathi-human-${listener.id}`)||"null") as ChatMessage[]|null;if(messages?.length)next[listener.id]=messages.at(-1)?.text ?? ""}setHumanPreviews(next);const groupNext:Record<string,GroupMessage[]>={};for(const group of communities){const stored=localStorage.getItem(`saathi-group-${group.id}`);if(stored)groupNext[group.id]=JSON.parse(stored)}setGroupPreviews(groupNext);setReadGroups(JSON.parse(localStorage.getItem("saathi-read-groups")||"[]"))}catch{}},[]);
 const conversations=listeners.filter(l=>conversationPreviews.some(c=>c.id===l.id)||humanPreviews[l.id]);
 return <><Header title="Talk" subtitle="Conversations & spaces" action={<Button variant="ghost" size="icon" title="Find a listener" aria-label="Find a listener" onClick={()=>go("listeners")}><Plus/></Button>}/><div className="px-5 pt-5"><div role="tablist" aria-label="Talk sections" className="grid grid-cols-2 rounded-2xl bg-primary-soft p-1">{(["chats","groups"] as const).map(x=><Button role="tab" aria-selected={tab===x} key={x} variant="ghost" onClick={()=>setTab(x)} className={cn("relative h-10 rounded-xl capitalize",tab===x&&"text-primary")}>{tab===x&&<motion.span layoutId="talk-tab" className="absolute inset-0 rounded-xl bg-card shadow-soft" transition={{type:"spring",stiffness:380,damping:30}}/>}<span className="relative">{x}</span></Button>)}</div><AnimatePresence mode="wait" initial={false}>{tab==="chats"?<motion.div key="chats" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}} className="mt-6"><p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Your conversations</p><div className="divide-y divide-border"><Button variant="ghost" onClick={()=>go("saathi-chat")} className="h-auto w-full justify-start gap-3 rounded-none px-0 py-4 text-left"><SaathiCompanion expression="welcoming" lively className="!size-16 shrink-0"/><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">SAATHI</span><span className="text-[10px] text-muted-foreground">Now</span></span><span className="block text-xs text-primary">AI support companion · Pinned</span><span className="mt-1 block truncate text-xs text-muted-foreground">{preview}</span></span></Button>{conversations.map(listener=>{const convo=conversationPreviews.find(c=>c.id===listener.id);return <Button key={listener.id} variant="ghost" onClick={()=>openListener(listener)} className="h-auto w-full justify-start gap-3 rounded-none px-0 py-4 text-left"><Avatar initials={listener.initials}/><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{listener.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{humanPreviews[listener.id]?"Now":convo?.time}</span></span><span className="block text-xs text-primary">{listener.role} · {listener.languages[0]}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{humanPreviews[listener.id]??convo?.preview}</span></span></Button>})}</div><Button variant="outline" className="mt-5 h-11 w-full" onClick={()=>go("listeners")}><Plus className="size-4"/> Find a listener</Button></motion.div>:<motion.div key="groups" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}} className="mt-6"><p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Group conversations</p><div className="divide-y divide-border">{joinedIds.map(id=>{const group=communities.find(c=>c.id===id);if(!group)return null;const info=groupConversations.find(g=>g.id===id);const messages=groupPreviews[id]??info?.messages??[];const last=messages.at(-1);const unread=readGroups.includes(id)?0:info?.unread??0;return <Button key={id} variant="ghost" onClick={()=>openGroupChat(group)} className="h-auto w-full justify-start gap-3 rounded-none px-0 py-4 text-left"><span className={cn("relative grid size-12 shrink-0 place-items-center rounded-2xl",communityIcon(group.id).tone)}><CommunityIcon id={group.id} className="!size-5"/><span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-teal"/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{group.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{last?.time??"Now"}</span></span><span className="block text-xs text-primary">{info?.members??48} members</span><span className="mt-1 block truncate text-xs text-muted-foreground">{last?`${last.mine?"You":last.sender}: ${last.text}`:"The conversation is ready"}</span></span>{unread>0&&<motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:440,damping:19}} className="grid size-6 shrink-0 place-items-center rounded-full bg-coral text-[11px] font-semibold text-primary-foreground" aria-label={`${unread} unread messages`}>{unread}</motion.span>}</Button>})}</div>{joinedIds.length===0&&<Empty title="No group conversations yet" body="Join a community to start talking with others."/>}<Button variant="outline" className="mt-5 h-11 w-full" onClick={()=>go("community")}>Explore communities <ArrowRight className="size-4"/></Button></motion.div>}</AnimatePresence></div></>;
}
function GroupChat({group,back}:{group:CommunityData;back:()=>void}){
 const info=groupConversations.find(g=>g.id===group.id);
 const [messages,setMessages]=useState<GroupMessage[]>(()=>info?.messages??[]);
 const [text,setText]=useState("");
 const [typing,setTyping]=useState(false);
 const [recording,setRecording]=useState(false);
 const [seconds,setSeconds]=useState(0);
 const [showInfo,setShowInfo]=useState(false);
 const [search,setSearch]=useState(false);
 const [query,setQuery]=useState("");
 const [muted,setMuted]=useState(false);
 const [newMessage,setNewMessage]=useState(false);
 const scrollRef=useRef<HTMLDivElement>(null);
 const inputRef=useRef<HTMLInputElement>(null);
 const reduce=useReducedMotion();
 useEffect(()=>{try{const saved=localStorage.getItem(`saathi-group-${group.id}`);setMessages(saved?JSON.parse(saved):info?.messages??[]);const read=JSON.parse(localStorage.getItem("saathi-read-groups")||"[]") as string[];localStorage.setItem("saathi-read-groups",JSON.stringify([...new Set([...read,group.id])]));}catch{}},[group.id]);
 useEffect(()=>{if(!recording)return;const timer=window.setInterval(()=>setSeconds(v=>v+1),1000);return()=>window.clearInterval(timer)},[recording]);
 useEffect(()=>{if(query)return;const el=scrollRef.current;if(el)el.scrollTo({top:el.scrollHeight,behavior:reduce?"instant":"smooth"})},[messages.length,typing,query,reduce]);
 useEffect(()=>{if(messages.length<1||query)return;const el=scrollRef.current;if(el&&el.scrollHeight-el.scrollTop-el.clientHeight>130)setNewMessage(true)},[messages.length,query]);
 const save=(next:GroupMessage[])=>{setMessages(next);try{localStorage.setItem(`saathi-group-${group.id}`,JSON.stringify(next))}catch{toast.error("This message could not be saved on your device")}};
 const send=(e:FormEvent)=>{e.preventDefault();if(!text.trim()){inputRef.current?.focus();return}save([...messages,{id:crypto.randomUUID(),sender:user.name,text:text.trim(),time:"Now",mine:true}]);setText("");setTyping(true);window.setTimeout(()=>setTyping(false),1700)};
 const visible=messages.filter(m=>!query||`${m.sender} ${m.text}`.toLowerCase().includes(query.toLowerCase()));
 return <div className="flex h-full min-h-0 flex-col"><header className="z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/95 px-3 py-3 backdrop-blur"><Button variant="ghost" size="icon" aria-label="Go back" onClick={back}><ArrowLeft/></Button><Button variant="ghost" onClick={()=>setShowInfo(true)} className="h-auto min-w-0 justify-start gap-2 px-0 text-left"><span className={cn("relative grid size-10 shrink-0 place-items-center rounded-2xl",communityIcon(group.id).tone)}><CommunityIcon id={group.id} className="!size-5"/><span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-teal"/></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{group.name}</span><span className="block text-[11px] text-muted-foreground">{info?.members??48} members · Group conversation</span></span></Button><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label="Search messages" title="Search messages" onClick={()=>setSearch(!search)}><Search className="size-4"/></Button><Button variant="ghost" size="icon" aria-label={muted?"Turn notifications on":"Mute notifications"} title="Notification settings" onClick={()=>{setMuted(!muted);toast(muted?"Notifications on (preview)":"Notifications muted (preview)")}}>{muted?<VolumeX className="size-4"/>:<Bell className="size-4"/>}</Button><Button variant="ghost" size="icon" aria-label="Group info" title="Group info" onClick={()=>setShowInfo(true)}><Info className="size-4"/></Button></div></header>
 <AnimatePresence>{search&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden border-b border-border px-4"><Input autoFocus aria-label="Search group messages" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search messages…" className="my-2 bg-card"/></motion.div>}</AnimatePresence>
 <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5"><div className="mx-auto mb-6 w-fit rounded-full bg-primary-soft px-3 py-1.5 text-[11px] text-primary"><ShieldCheck className="mr-1 inline size-3"/> A moderated space · Share only what feels safe</div><AnimatePresence initial={false}>{visible.map(m=><motion.div key={m.id} initial={reduce?false:{opacity:0,y:16,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} transition={{type:"spring",stiffness:370,damping:30}} className={cn("mb-4 flex gap-2",m.mine&&"justify-end")}>{!m.mine&&<motion.span whileHover={reduce?{}:{scale:1.08}} className="grid size-8 shrink-0 place-items-center rounded-full bg-avatar text-[10px] font-bold text-avatar-foreground">{m.sender.slice(0,1)}</motion.span>}<div className="max-w-[78%]"><p className={cn("mb-1 text-[11px] font-semibold",m.mine?"text-right text-primary":"text-teal")}>{m.mine?"You":m.sender}</p><div className={cn("rounded-[20px] px-4 py-2.5 text-sm leading-6",m.mine?"rounded-br-md bg-primary text-primary-foreground":"rounded-bl-md bg-card shadow-soft")}>{m.text}</div><p className={cn("mt-1 text-[10px] text-muted-foreground",m.mine&&"text-right")}>{m.time} {m.mine&&<Check className="inline size-3"/>}</p></div></motion.div>)}</AnimatePresence>{typing&&<motion.div role="status" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mb-4 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-avatar text-xs text-avatar-foreground">M</span><span className="rounded-[20px] bg-card px-4 py-3 text-teal shadow-soft"><span className="typing-dot"/> <span className="typing-dot"/> <span className="typing-dot"/></span><span className="sr-only">A member is typing</span></motion.div>}{visible.length===0&&<p className="py-12 text-center text-sm text-muted-foreground">No messages found.</p>}</div>
 <AnimatePresence>{newMessage&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex justify-center"><Button variant="secondary" size="sm" className="rounded-full shadow-soft" onClick={()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:reduce?"instant":"smooth"});setNewMessage(false)}}>New message <ArrowRight className="size-3 rotate-90"/></Button></motion.div>}</AnimatePresence>
 <form onSubmit={send} className="shrink-0 border-t border-border bg-card p-3"><div className="flex items-center gap-1.5"><Button type="button" variant="ghost" size="icon" aria-label="Add emoji" title="Emoji" onClick={()=>{setText(v=>v+" 🤍");inputRef.current?.focus()}}><Smile className="size-5"/></Button><Button type="button" variant="ghost" size="icon" aria-label="Add attachment" title="Attachment" onClick={()=>toast("Attachments are a preview only")}><Paperclip className="size-5"/></Button>{recording?<span role="status" className="flex min-w-0 flex-1 items-center gap-2 text-xs text-coral"><span className="flex h-6 items-center gap-0.5">{Array.from({length:6},(_,i)=><span key={i} className="wave-bar"/>)}</span>{Math.floor(seconds/60).toString().padStart(2,"0")}:{(seconds%60).toString().padStart(2,"0")} · preview</span>:<Input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} aria-label="Message group" placeholder="Message group…" className="h-11 min-w-0 flex-1 bg-muted"/>}<Button type="button" variant={recording?"secondary":"ghost"} size="icon" aria-label={recording?"Stop recording preview":"Record voice message"} title="Voice message" onClick={()=>{if(recording)toast("Voice messages are a preview only");setRecording(!recording);setSeconds(0)}}><Mic className="size-5"/></Button><motion.div animate={reduce?{}:{scale:text.trim()?1.07:1}} transition={{type:"spring",stiffness:450,damping:23}}><Button type="submit" size="icon" disabled={recording} aria-label="Send group message" className="size-11 rounded-2xl"><Send className="size-4"/></Button></motion.div></div></form>
 {createPortal(<AnimatePresence>{showInfo&&<motion.div role="dialog" aria-modal="true" aria-label="Group info" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center" onClick={()=>setShowInfo(false)}><motion.div initial={reduce?false:{y:90}} animate={{y:0}} exit={{y:90}} transition={{type:"spring",stiffness:340,damping:32}} className="w-full max-w-[460px] rounded-t-[26px] bg-card p-6 sm:rounded-[26px]" onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between"><span className="grid size-14 place-items-center rounded-2xl bg-teal-soft text-teal"><UsersRound/></span><Button variant="ghost" size="icon" aria-label="Close group info" onClick={()=>setShowInfo(false)}><X/></Button></div><h2 className="mt-4 text-xl font-semibold">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{info?.members??48} members · Moderated</p><p className="mt-4 text-sm leading-6">{group.description}</p><p className="mt-4 text-xs text-muted-foreground">Respect privacy, be kind, and report content that feels unsafe.</p><Button variant="outline" className="mt-5 w-full" onClick={()=>setShowInfo(false)}>Close</Button></motion.div></motion.div>}</AnimatePresence>,document.body)}</div>;
}

function SaathiChat({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  const [messages,setMessages]=useLocalMessages();
  const [text,setText]=useState("");
  const [typing,setTyping]=useState(false);
  const [recording,setRecording]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [emptyError,setEmptyError]=useState(false);
   const [chatMoment,setChatMoment]=useState<"greeting"|"composing"|"sent"|"thinking"|"responding"|"inviting"|"positive"|"supportive"|"voice">("greeting");
   const expression: CompanionExpression=chatMoment==="voice"?"voice":typing||chatMoment==="thinking"?"thinking":chatMoment==="composing"?"listening":chatMoment==="sent"?"curious":chatMoment==="responding"?"responding":chatMoment==="positive"?"happy":chatMoment==="supportive"?"supportive":chatMoment==="inviting"?"handoff":"welcoming";
  const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(!recording)return;const timer=window.setInterval(()=>setSeconds(v=>v+1),1000);return()=>window.clearInterval(timer)},[recording]);
  const send=(value=text)=>{
    if(!value.trim()){setEmptyError(true);inputRef.current?.focus();return}
    if(typing)return;
    const msg={id:crypto.randomUUID(),from:"me" as const,text:value.trim(),time:new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})};
    setMessages(prev=>[...prev,msg]);setText("");setEmptyError(false);setChatMoment("sent");setTyping(true);window.setTimeout(()=>setChatMoment(current=>current==="sent"?"thinking":current),350);
    window.setTimeout(()=>{const invite=value.toLowerCase().includes("talk")||value.toLowerCase().includes("struggling");setMessages(prev=>[...prev,{id:crypto.randomUUID(),from:"saathi",text:invite?"I hear you. You don’t have to carry this alone. Would connecting with a human listener feel helpful right now?":"Thank you for sharing that. I’m here with you — we can take the next moment slowly.",time:new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}]);setTyping(false);setChatMoment("responding");window.setTimeout(()=>setChatMoment(invite?"inviting":value==="I'm feeling better"?"positive":"supportive"),1500);inputRef.current?.focus()},900);
  };
  return <div className="flex min-h-[calc(100dvh-5.25rem)] flex-col"><Header title="SAATHI" subtitle="AI support companion" back={back} action={<Button variant="ghost" size="icon" aria-label="Find a listener" title="Find a listener" onClick={()=>go("handoff")}><UsersRound className="size-5"/></Button>}/><div className="flex-1 p-5"><div className="mb-5 flex items-center gap-2 rounded-2xl bg-primary-soft p-3 text-xs text-primary"><SaathiCompanion expression={expression} className="size-12 shrink-0"/><span>This mock conversation stays on this device.</span><LockKeyhole className="ml-auto size-4 shrink-0"/></div>{messages.length===0&&<div className="py-14 text-center"><SaathiCompanion expression="curious" className="mx-auto size-24"/><h2 className="mt-6 text-lg font-semibold">A space to begin</h2><p className="mt-2 text-sm text-muted-foreground">Share what feels comfortable. SAATHI is here to listen.</p></div>}<AnimatePresence initial={false}>{messages.map(m=><div key={m.id} className={m.from==="saathi"?"flex items-start gap-1":""}>{m.from==="saathi"&&<ChatAvatar expression={m.id===messages.at(-1)?.id?expression:"listening"} latest={m.id===messages.at(-1)?.id}/>}<div className="min-w-0 flex-1"><ChatBubble message={m}/></div></div>)}</AnimatePresence>{typing&&<div role="status" className="mb-4 flex items-center gap-2 text-primary"><SaathiCompanion expression="thinking" className="size-11 shrink-0"/><span className="flex gap-1 rounded-[20px] bg-muted px-4 py-4"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span><span className="sr-only">SAATHI is thinking</span></div>}<div className="mt-4 flex flex-wrap gap-2">{["Tell me more","I'm feeling better","I'm having a difficult day","I want to talk to someone"].map(q=><Button variant="outline" size="sm" key={q} onClick={()=>send(q)} className="rounded-xl text-xs active:scale-95">{q}</Button>)}</div>{messages.at(-1)?.text.includes("human listener")&&<Card className="mt-5 border-primary/30"><p className="font-semibold">Would you like human support?</p><p className="mt-1 text-sm text-muted-foreground">Connect with someone comfortable discussing what you&apos;re going through.</p><AppButton className="mt-4 w-full" onClick={()=>go("handoff")}>Talk to someone</AppButton></Card>}</div><form onSubmit={(e)=>{e.preventDefault();send()}} className="sticky bottom-0 border-t border-border/50 bg-card p-3"><div className="flex items-center gap-2"><Button type="button" variant={recording?"secondary":"ghost"} size="icon" className={cn("shrink-0 rounded-2xl",recording&&"text-coral status-pulse")} aria-label={recording?"Stop recording preview":"Record voice message"} onClick={()=>{if(recording)toast("Voice messages are a preview only");setRecording(!recording);setChatMoment(recording?"supportive":"voice");setSeconds(0)}}><Mic/></Button>{recording?<span role="status" className="flex flex-1 items-center gap-2 text-xs text-coral"><span className="flex h-6 items-center gap-0.5">{Array.from({length:6},(_,i)=><span key={i} className="wave-bar"/>)}</span>{Math.floor(seconds/60).toString().padStart(2,"0")}:{(seconds%60).toString().padStart(2,"0")} · preview only</span>:<Input ref={inputRef} autoFocus value={text} onChange={e=>{setText(e.target.value);setEmptyError(false);if(!typing)setChatMoment(e.target.value?"composing":"greeting")}} placeholder="Message SAATHI…" aria-invalid={emptyError} className="h-11 min-w-0 flex-1 bg-muted"/>}<Button type="submit" size="icon" disabled={typing||recording} className={cn("h-11 w-11 shrink-0 rounded-2xl transition-transform",text.trim()&&"shadow-mark scale-105")} aria-label="Send message"><Send/></Button></div>{emptyError&&<p role="alert" className="pl-12 pt-1 text-xs text-coral">Write a message before sending.</p>}</form></div>;
}
function useLocalMessages(){const [messages,setMessagesState]=useState<ChatMessage[]>(initialSaathiMessages);useEffect(()=>{try{const v=localStorage.getItem("saathi-chat");if(v)setMessagesState(JSON.parse(v) as ChatMessage[]);}catch{}},[]);const setMessages=(next:ChatMessage[]|((p:ChatMessage[])=>ChatMessage[]))=>setMessagesState(prev=>{const value=typeof next==="function"?next(prev):next;try{localStorage.setItem("saathi-chat",JSON.stringify(value));}catch{}return value;});return [messages,setMessages] as const;}
function ChatBubble({message}:{message:ChatMessage}){const mine=message.from==="me";const reduce=useReducedMotion();return <motion.div initial={reduce?false:{opacity:0,y:12,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{type:"spring",stiffness:360,damping:29}} className={cn("mb-4 flex",mine?"justify-end":"justify-start")}><div className={cn("max-w-[84%]",mine?"text-right":"text-left")}><div className={cn("rounded-[20px] px-4 py-3 text-sm leading-6",mine?"rounded-br-md bg-primary text-primary-foreground":"rounded-bl-md bg-muted text-foreground")}>{message.text}</div><span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">{message.time}{mine&&<Check className="size-3" aria-label="Sent"/>}</span></div></motion.div>}

function Handoff({back,find,continueChat}:{back:()=>void;find:()=>void;continueChat:()=>void}){return <><Header title="Human support" back={back}/><div className="p-5"><div className="mt-5 grid h-16 w-16 place-items-center rounded-lg bg-primary-soft text-primary"><UsersRound className="size-7"/></div><h2 className="mt-7 text-3xl font-semibold">Talk to someone</h2><p className="mt-4 leading-7 text-muted-foreground">You can connect with a human listener who is comfortable talking about what you&apos;re going through.</p><Card className="mt-8"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary"/><div><p className="text-sm font-semibold">You stay in control</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose a listener, see their role and training, and end the conversation whenever you wish.</p></div></div></Card><AppButton className="mt-8 w-full" onClick={find}>Find a listener <ArrowRight/></AppButton><Button variant="ghost" className="mt-2 h-12 w-full" onClick={continueChat}>Continue with SAATHI</Button></div></>}
function ListenerDiscovery({back,open}:{back:()=>void;open:(l:Listener)=>void}){const [topic,setTopic]=useState("All topics");const [lang,setLang]=useState(false);const [availableOnly,setAvailableOnly]=useState(false);const topics=["All topics","Loneliness","Grief","Family support","Social isolation","Uncertainty"];const matches=listeners.filter(l=>(topic==="All topics"||l.topics.includes(topic))&&(!lang||l.languages.includes("Hindi"))&&(!availableOnly||l.availability==="Available now"));return <><Header title="Find someone to talk to" back={back}/><div className="p-5"><div className="flex gap-2 overflow-x-auto pb-2"><Button variant={lang?"default":"outline"} size="sm" onClick={()=>setLang(!lang)} className="shrink-0">Hindi</Button><Button variant={availableOnly?"default":"outline"} size="sm" onClick={()=>setAvailableOnly(!availableOnly)} className="shrink-0">Available now</Button></div><div className="mt-3 flex gap-2 overflow-x-auto pb-2">{topics.map(x=><Button key={x} variant={topic===x?"default":"outline"} size="sm" onClick={()=>setTopic(x)} className="shrink-0">{x}</Button>)}</div><p className="my-4 text-xs text-muted-foreground">{matches.length} supportive people match your preferences</p><div className="space-y-3">{matches.map(l=><Card key={l.id} className="feed-enter border-primary/15"><div className="flex items-start gap-3"><span className="relative"><Avatar initials={l.initials}/>{l.availability==="Available now"&&<span className="status-pulse absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-teal"/>}</span><div className="min-w-0 flex-1"><h3 className="font-semibold">{l.name}</h3><p className="text-xs text-muted-foreground">{l.role} · {l.languages.join(" · ")}</p></div></div><div className="mt-4 flex flex-wrap gap-1.5">{l.topics.map(t=><Badge key={t} tone="accent">{t}</Badge>)}</div><div className="mt-4 flex items-center justify-between gap-2"><Status>{l.availability}</Status><Button variant="outline" size="sm" onClick={()=>open(l)}>Talk to {l.name.split(" ")[0]} <ArrowRight className="size-3"/></Button></div></Card>)}{matches.length===0&&<Empty title="No listeners found" body="Try another topic or remove a filter."/>}</div></div></>}

function ListenerProfile({listener,back,start}:{listener:Listener;back:()=>void;start:()=>void}){const [connecting,setConnecting]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);const connect=()=>{if(connecting)return;setConnecting(true);timer.current=setTimeout(start,700)};return <><Header title="Listener profile" back={back}/><div className="p-5 text-center"><Avatar initials={listener.initials} large/><h2 className="mt-4 text-2xl font-semibold">{listener.name}</h2><Badge tone="accent">{listener.role}</Badge><div className="mt-3"><Status>{listener.availability}</Status></div><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-muted-foreground">{listener.bio}</p><div className="mt-7 space-y-3 text-left"><InfoCard title="Languages" value={listener.languages.join(" · ")} icon={Languages}/><InfoCard title="Comfortable talking about" value={listener.topics.join(" · ")} icon={MessageCircle}/><InfoCard title="Experience" value={listener.experience} icon={Clock3}/><InfoCard title="Training" value={listener.training} icon={ShieldCheck}/></div><p className="mt-5 text-xs leading-5 text-muted-foreground">Roles and training are shown clearly. A volunteer or trained listener is not presented as a healthcare professional.</p><AppButton className="mt-6 w-full" disabled={connecting} onClick={connect}>{connecting?<>Opening your conversation <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></>:<>Start conversation <MessageCircle/></>}</AppButton>{connecting&&<p role="status" className="mt-3 text-xs text-muted-foreground">Connecting you with {listener.name}…</p>}</div></>}
function InfoCard({title,value,icon:Icon}:{title:string;value:string;icon:typeof Home}){return <Card><div className="flex gap-3"><Icon className="size-5 text-primary"/><div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div></Card>}
function HumanChat({listener,back,showExit}:{listener:Listener;back:()=>void;showExit:()=>void}){const [messages,setMessages]=useState<ChatMessage[]>([]);const [text,setText]=useState("");const [sending,setSending]=useState(false);const [emptyError,setEmptyError]=useState(false);const inputRef=useRef<HTMLInputElement>(null);useEffect(()=>{try{const saved=localStorage.getItem(`saathi-human-${listener.id}`);setMessages(saved?JSON.parse(saved):listener.id==="ananya"?humanMessages:[])}catch{setMessages([])}},[listener.id]);const send=(e:FormEvent)=>{e.preventDefault();if(!text.trim()){setEmptyError(true);inputRef.current?.focus();return}if(sending)return;const next=[...messages,{id:crypto.randomUUID(),from:"me" as const,text:text.trim(),time:new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}];setSending(true);setMessages(next);setText("");setEmptyError(false);try{localStorage.setItem(`saathi-human-${listener.id}`,JSON.stringify(next))}catch{toast.error("This message could not be saved on your device")}window.setTimeout(()=>{setSending(false);inputRef.current?.focus()},400)};return <div className="flex min-h-[calc(100dvh-5.25rem)] flex-col"><Header title={listener.name} subtitle={`${listener.role} · ${listener.languages[0]}`} back={back} action={<Button variant="ghost" size="sm" onClick={showExit} className="text-destructive">End</Button>}/><div className="flex-1 p-5"><div className="mb-5 flex justify-center gap-2 text-xs"><Button size="sm" variant="ghost" onClick={()=>toast("Report options opened")}><Flag className="size-3"/>Report</Button><Button size="sm" variant="ghost" onClick={()=>toast("Support options opened")}><CircleHelp className="size-3"/>Support</Button></div>{messages.length===0&&<div className="py-16 text-center"><Avatar initials={listener.initials} large/><h2 className="mt-5 text-lg font-semibold">Start a conversation with {listener.name.split(" ")[0]}</h2><p className="mt-2 text-sm text-muted-foreground">Take your time. Share only what feels right.</p></div>}<AnimatePresence initial={false}>{messages.map(m=><ChatBubble key={m.id} message={m}/>)}</AnimatePresence>{sending&&<p role="status" className="text-right text-xs text-muted-foreground">Sending…</p>}</div><form onSubmit={send} className="sticky bottom-0 border-t border-border/50 bg-card p-3"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><Input ref={inputRef} autoFocus value={text} onChange={e=>{setText(e.target.value);setEmptyError(false)}} aria-invalid={emptyError} placeholder="Write a message…" className="h-11 bg-muted"/><Button type="submit" size="icon" disabled={sending} className="h-11 w-11 rounded-2xl" aria-label="Send message"><Send/></Button></div>{emptyError&&<p role="alert" className="pt-1 text-xs text-coral">Write a message before sending.</p>}</form></div>}

function Wellbeing({back,milestones}:{back:()=>void;milestones:()=>void}){return <><Header title="My wellbeing" back={back}/><div className="p-5"><p className="text-sm leading-6 text-muted-foreground">A simple view of how your recent check-ins have changed over time.</p><div className="relative mt-7 space-y-0 before:absolute before:bottom-6 before:left-[7px] before:top-6 before:w-px before:bg-border">{wellbeing.map((x,i)=><div key={x.date} className="relative grid grid-cols-[auto_1fr] gap-4 pb-6"><span className={cn("relative z-10 mt-1.5 h-4 w-4 rounded-full border-4 border-background",i===wellbeing.length-1?"bg-primary":"bg-muted-foreground")}/><div><div className="flex items-center justify-between"><p className="text-sm font-semibold">{x.state}</p><span className="text-xs text-muted-foreground">{x.date}</span></div><p className="mt-1 text-sm text-muted-foreground">{x.note}</p></div></div>)}</div><Card className="mt-2 border-primary/20 bg-primary-soft"><Badge tone="accent">Recent patterns</Badge><p className="mt-3 text-sm leading-6">Your recent check-ins show some changes compared with earlier this week. Reaching out appears alongside an improving check-in.</p><p className="mt-3 text-xs text-muted-foreground">This is a wellbeing reflection, not a diagnosis or medical assessment.</p></Card><Button variant="outline" className="mt-5 h-12 w-full" onClick={milestones}><Sparkle/> View gentle milestones</Button></div></>}
function Milestones({back}:{back:()=>void}){const activity=useJourneyActivity();return <><Header title="Your milestones" back={back}/><div className="p-5"><JourneyExperience activity={activity} badgesOnly/></div></>}

const COMMUNITY_ICONS:Record<string,{icon:typeof Home}>= {loneliness:{icon:Heart},grief:{icon:Flower2},recovery:{icon:Sprout},family:{icon:House},case:{icon:Scale},uncertainty:{icon:Compass},hardship:{icon:Mountain},belonging:{icon:HandHeart},financial:{icon:Wallet},difficult:{icon:CloudRain},strength:{icon:Sunrise}};
const COMMUNITY_TONE="bg-primary-soft text-primary";
function communityIcon(id:string){return {...(COMMUNITY_ICONS[id]??{icon:UsersRound}),tone:COMMUNITY_TONE}}
function CommunityIcon({id,className}:{id:string;className?:string}){const I=communityIcon(id).icon;return <I className={className}/>}
function GroupRow({group,open}:{group:CommunityData;open:()=>void}){return <Card onClick={open} className="feed-enter transition-all hover:border-primary/30"><div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"><span className={cn("grid size-12 place-items-center rounded-2xl",communityIcon(group.id).tone)}><CommunityIcon id={group.id} className="size-5"/></span><div className="min-w-0"><p className="font-semibold">{group.name}</p><p className="mt-1 text-xs text-muted-foreground">{group.members} members · {group.activity}</p><span className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary"><ShieldCheck className="size-3"/> Moderated · Community rules</span></div><ChevronRight className="size-4 text-muted-foreground"/></div></Card>}
function Community({openGroup,joinedIds}:{openGroup:(g:CommunityData)=>void;joinedIds:string[]}){const [query,setQuery]=useState("");const [category,setCategory]=useState("All");const categories=["All","Loneliness","Grief","Recovery","Family support","Court support","Social isolation"];const matches=communities.filter(c=>(category==="All"||c.category===category)&&(c.name.toLowerCase().includes(query.toLowerCase())||c.description.toLowerCase().includes(query.toLowerCase())));return <><Header title="Community" subtitle="Moderated spaces"/><div className="p-5"><div className="community-banner mb-5 rounded-[26px] bg-ink p-5 text-ink-foreground"><ShieldCheck className="size-5"/><h2 className="mt-3 text-lg font-semibold">Kindness, privacy, and respect</h2><p className="mt-2 text-sm leading-6 opacity-75">Every group is moderated. Share only what feels safe for you.</p></div><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input aria-label="Search communities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a space for you" className="h-10 bg-card pl-9"/></div><div className="mt-4 flex gap-2 overflow-x-auto pb-2">{categories.map(x=><Button key={x} size="sm" variant={x===category?"default":"outline"} onClick={()=>setCategory(x)} className="shrink-0">{x}</Button>)}</div>{!query&&category==="All"?<><h2 className="mb-3 mt-6 text-lg font-semibold">Joined</h2><div className="space-y-2">{communities.filter(c=>joinedIds.includes(c.id)).map(c=><GroupRow key={c.id} group={c} open={()=>openGroup(c)}/>)}</div><h2 className="mb-3 mt-7 text-lg font-semibold">Explore</h2><div className="space-y-2">{communities.filter(c=>!joinedIds.includes(c.id)).map(c=><GroupRow key={c.id} group={c} open={()=>openGroup(c)}/>)}</div></>:<><h2 className="mb-3 mt-6 text-lg font-semibold">Results</h2><div className="space-y-2">{matches.map(c=><GroupRow key={c.id} group={c} open={()=>openGroup(c)}/>)}{matches.length===0&&<Empty title="No groups found" body="Try another search or category."/>}</div></>}</div></>}
function CommunityGroup({group,joined,join,back,create}:{group:CommunityData;joined:boolean;join:()=>void;back:()=>void;create:()=>void}){const [posts,setPosts]=useState<FeedPost[]>([]);useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("saathi-posts")||"[]") as FeedPost[];setPosts([...saved,...initialPosts].filter(p=>p.groupId===group.id))}catch{setPosts(initialPosts.filter(p=>p.groupId===group.id))}},[group.id]);return <><Header title={group.name} subtitle={`${group.members} members · Moderated`} back={back}/><div className="p-5"><div className="rounded-[22px] bg-primary-soft p-4"><p className="text-sm font-semibold">{group.description}</p><p className="mt-2 text-xs text-primary"><ShieldCheck className="mr-1 inline size-3"/> Moderated · {group.activity}</p>{!joined&&<Button onClick={join} size="sm" className="mt-3"><Plus className="size-4"/> Join this space</Button>}<details className="mt-3 text-xs"><summary className="cursor-pointer font-medium text-primary">Community rules</summary><p className="mt-2 leading-5 text-muted-foreground">Be kind, protect privacy, avoid sharing identifying details, and report anything that feels unsafe. This is a peer space, not emergency support.</p></details></div><div className="mt-5 space-y-3">{posts.map(p=><FeedCard key={p.id} post={p} group={group} openGroup={()=>{}}/>)}{posts.length===0&&<Empty title="A quieter space today" body="Be the first to share something when you're ready."/>}</div><Button onClick={create} variant="outline" className="sticky bottom-3 mt-5 h-12 w-full justify-start bg-card shadow-soft"><PencilLine className="size-4"/>Write something…</Button></div></>}
function CreatePost({group,back,done}:{group:CommunityData;back:()=>void;done:()=>void}){const [title,setTitle]=useState("");const [body,setBody]=useState("");const [anon,setAnon]=useState(false);const post=()=>{if(!title.trim()||!body.trim()){toast.error("Add a title and message first");return;}try{const prev=JSON.parse(localStorage.getItem("saathi-posts")||"[]");localStorage.setItem("saathi-posts",JSON.stringify([{id:crypto.randomUUID(),groupId:group.id,author:anon?"Anonymous":"Aarav",time:"Now",title:title.trim(),body:body.trim(),replies:0,likes:0},...prev]));}catch{}done()};return <><Header title="Create a post" subtitle={group.name} back={back}/><div className="p-5"><label className="text-sm font-medium">Title</label><Input value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 h-12 bg-card" placeholder="Give your post a gentle title"/><label className="mt-6 block text-sm font-medium">Message</label><Textarea value={body} onChange={e=>setBody(e.target.value)} className="mt-2 min-h-44 bg-card" placeholder="Share what feels comfortable…"/><Card className="mt-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Post anonymously</p><p className="mt-1 text-xs text-muted-foreground">Your name won&apos;t appear with this post.</p></div><Switch checked={anon} onCheckedChange={setAnon}/></div></Card><div className="mt-7 grid grid-cols-2 gap-3"><Button variant="outline" className="h-12" onClick={back}>Cancel</Button><AppButton onClick={post}>Post</AppButton></div></div></>}

function Support({go}:{go:(s:Screen)=>void}){return <><Header title="I need support" subtitle="Choose what feels right"/><div className="p-5"><div className="border-b border-border pb-6"><p className="text-sm leading-6 text-muted-foreground">You don't need to decide everything now. Start with the kind of support you want.</p></div><h2 className="mb-2 mt-6 text-xs font-semibold uppercase text-muted-foreground">Talk with someone</h2><div className="divide-y divide-border"><SupportOption icon={UsersRound} title="Talk to a listener" body="Someone trained to listen, at your pace." onClick={()=>go("listeners")}/><SupportOption icon={BookHeart} title="Talk to a counsellor" body="View mock professional support options." onClick={()=>go("listeners")}/></div><h2 className="mb-2 mt-8 text-xs font-semibold uppercase text-muted-foreground">Requests</h2><div className="divide-y divide-border"><SupportOption icon={FileText} title="Request support" body="Leave a request for follow-up." onClick={()=>toast.success("Mock support request created")}/><SupportOption icon={Clock3} title="My support requests" body="See recent requests and updates." onClick={()=>toast("No active requests right now")}/></div><div className="mt-8 border-t border-border pt-5"><Button variant="ghost" onClick={()=>go("emergency")} className="h-auto w-full justify-start gap-4 rounded-xl border border-destructive/25 bg-card p-4 text-left hover:bg-destructive-soft"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-destructive-soft text-destructive"><Phone className="size-5"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Emergency help</span><span className="mt-1 block whitespace-normal text-xs text-muted-foreground">Urgent and immediate support options</span></span><ChevronRight className="size-4 text-destructive"/></Button><p className="mt-3 text-xs leading-5 text-muted-foreground">This is a prototype; emergency actions are not connected to services.</p></div></div></>}
function SupportOption({icon:Icon,title,body,onClick}:{icon:typeof Home;title:string;body:string;onClick:()=>void}){return <Button variant="ghost" onClick={onClick} className="h-auto min-h-20 w-full justify-start gap-3 rounded-none px-1 py-4 text-left hover:bg-muted/40"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block whitespace-normal text-xs text-muted-foreground">{body}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground"/></Button>}
function Emergency({back}:{back:()=>void}){return <><Header title="Emergency support" back={back}/><div className="p-5"><div className="rounded-lg border border-destructive/25 bg-destructive-soft p-5"><Phone className="size-6 text-destructive"/><h2 className="mt-4 text-xl font-semibold">Immediate help</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">If you feel that you are in immediate danger or need urgent help, use the appropriate emergency or support services available in your area.</p></div><div className="mt-6 space-y-3"><Card><p className="text-sm font-semibold">Local emergency services</p><p className="mt-1 text-xs text-muted-foreground">Call your local emergency number</p><Button variant="outline" className="mt-4 h-10 w-full" onClick={()=>toast("Mock call action")}>Call now <Phone/></Button></Card><Card><p className="text-sm font-semibold">Trusted person</p><p className="mt-1 text-xs text-muted-foreground">Contact someone you trust and tell them where you are.</p><Button variant="outline" className="mt-4 h-10 w-full" onClick={()=>toast("Mock contact action")}>Choose contact</Button></Card></div><p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Prototype only — these are placeholder actions and are not connected to emergency services.</p></div></>}
function Notifications({back,go}:{back:()=>void;go:(s:Screen)=>void}){return <><Header title="Notifications" back={back} action={<button className="text-xs font-medium text-primary" onClick={()=>toast("Marked all as read")}>Mark read</button>}/><div className="px-5"><Button variant="outline" className="mt-4 w-full" onClick={()=>go("reminders")}><Bell className="size-4"/> Check-in reminders</Button><Button variant="ghost" className="mt-2 w-full" onClick={()=>go("notification-studio")}>Open Notification Studio</Button><div className="mt-4 divide-y divide-border">{notifications.map((n,i)=><div key={n.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-5"><span className={cn("mt-1 h-2 w-2 rounded-full",i===0?"bg-primary":"bg-muted-foreground/30")}/><div><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{n.title}</p><span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span></div><p className="mt-1 text-sm text-muted-foreground">{n.body}</p><Badge>{n.kind}</Badge></div></div>)}</div></div></>}

function useJourneyActivity(){
 const [activity,setActivity]=useState({checks:0,chats:0,listeners:0,groups:0,posts:0,joined:1});
 useEffect(()=>{try{const checks=Number(localStorage.getItem("saathi-checkins")||"0");const messages=JSON.parse(localStorage.getItem("saathi-chat")||"null") as ChatMessage[]|null;const chats=messages?.filter(m=>m.from==="me"&&!initialSaathiMessages.some(initial=>initial.id===m.id)).length??0;const listenerCount=listeners.reduce((total,l)=>{const raw=localStorage.getItem(`saathi-human-${l.id}`);if(!raw)return total;const history=JSON.parse(raw) as ChatMessage[];return total+history.filter(m=>m.from==="me"&&!humanMessages.some(initial=>initial.id===m.id)).length},0);const posts=(JSON.parse(localStorage.getItem("saathi-posts")||"[]") as FeedPost[]).length;const groupIds=JSON.parse(localStorage.getItem("saathi-joined-groups")||"null") as string[]|null;setActivity({checks,chats,listeners:listenerCount,groups:groupIds?.length??communities.filter(c=>c.joined).length,posts,joined:1})}catch{}},[]);
 return activity;
}
function Profile({go,logout}:{go:(s:Screen)=>void;logout:()=>void}){
  const activity=useJourneyActivity();
  const [profile]=useProfile();
  return <><Header title="Profile" subtitle="Your space" action={<Button variant="ghost" size="icon" aria-label="Open settings" onClick={()=>go("settings")}><Settings className="size-5"/></Button>}/><div className="p-5"><div className="flex items-center gap-4"><Avatar initials={profileInitials(profile.name)} src={profile.photo||undefined} large/><div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{profile.name}</h2><p className="text-sm text-muted-foreground">{profile.about||"Your journey with SAATHI"}</p></div><Button variant="outline" size="sm" className="shrink-0" onClick={()=>go("edit-profile")}><PencilLine className="size-4"/> Edit</Button></div>
  {profile.email && (
    <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-soft">
      <div className="flex items-center gap-3">
        <GoogleIcon className="size-5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">Google Account</span>
            <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[9px] font-medium text-teal">Connected</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={logout}>
        Switch
      </Button>
    </div>
  )}
  <JourneyExperience activity={activity} onNavigate={go}/><Button variant="outline" className="mt-5 w-full" onClick={()=>go("checkin-history")}><CalendarDays className="size-4"/> Check-in history</Button><Button variant="outline" className="mt-2 w-full" onClick={()=>go("wellbeing")}>View wellbeing reflections <ArrowRight className="size-4"/></Button><Button variant="ghost" className="mt-2 w-full text-primary" onClick={()=>go("milestones")}>View badge collection <Sparkle className="size-4"/></Button></div></>;
}

function SettingsScreen({go,logout,back}:{go:(s:Screen)=>void;logout:()=>void;back:()=>void}){
  const [profile]=useProfile();
  return <><Header title="Settings" subtitle="Account & preferences" back={back}/><div className="p-5">
    {profile.email && (
      <div className="mb-5 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Connected Account</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar initials={profileInitials(profile.name)} src={profile.photo||undefined} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
              <GoogleIcon className="size-3.5 shrink-0" />
            </div>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={logout}>
            Switch
          </Button>
        </div>
      </div>
    )}
    <div className="divide-y divide-border"><Row icon={UserRound} title="Personal information" subtitle="Name, photo, language, and how you talk" onClick={()=>go("edit-profile")}/><Row icon={ShieldCheck} title="Privacy" subtitle="How your information is handled" onClick={()=>go("privacy")}/><Row icon={CheckCircle2} title="Consent" subtitle="Review and change your choices" onClick={()=>go("consent")}/><Row icon={Bell} title="Check-in reminders" subtitle="Choose a time or take a break" onClick={()=>go("reminders")}/><Row icon={Bell} title="Notifications" subtitle="Reminders and updates" onClick={()=>go("notifications")}/><Row icon={History} title="Support history" subtitle="Past conversations and requests" onClick={()=>go("talk")}/></div><Button variant="ghost" className="mt-6 w-full justify-start text-destructive" onClick={logout}><LogOut className="size-4"/> Sign out</Button><p className="mt-4 text-xs leading-5 text-muted-foreground">In this prototype, your choices stay on this device only.</p></div></>;
}

function EditProfile({back}:{back:()=>void}){
 const [profile,saveProfile]=useProfile();
 const [draft,setDraft]=useState<ProfileInfo>(profile);
 const fileRef=useRef<HTMLInputElement|null>(null);
 const pickPhoto=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){toast("Please choose a photo under 2 MB");return}const reader=new FileReader();reader.onload=()=>setDraft(d=>({...d,photo:String(reader.result)}));reader.readAsDataURL(file)};
 const save=()=>{const name=draft.name.trim();if(!name){toast("Please add a name — it can be any name you like");return}saveProfile({...draft,name,about:draft.about.trim()});toast.success("Profile updated");back()};
 return <><Header title="Edit profile" subtitle="Only you can see this" back={back}/><div className="p-5">
 <div className="flex flex-col items-center"><div className="relative"><Avatar initials={profileInitials(draft.name)} src={draft.photo||undefined} large/><Button variant="secondary" size="icon" className="absolute -bottom-1 -right-1 size-8 rounded-full shadow-soft" aria-label="Change photo" onClick={()=>fileRef.current?.click()}><Camera className="size-4"/></Button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto}/><Button variant="ghost" size="sm" className="mt-3 text-primary" onClick={()=>fileRef.current?.click()}>{draft.photo?"Change photo":"Add a photo"}</Button>{draft.photo&&<Button variant="ghost" size="sm" className="text-muted-foreground" onClick={()=>setDraft(d=>({...d,photo:""}))}>Remove photo</Button>}</div>
 <div className="mt-6 space-y-5">
 <div><label htmlFor="edit-name" className="text-sm font-medium">Name</label><Input id="edit-name" className="mt-2 h-12" value={draft.name} maxLength={40} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="Any name you feel comfortable with"/><p className="mt-1.5 text-xs text-muted-foreground">This can be a nickname — whatever feels safe.</p></div>
 <div><label htmlFor="edit-about" className="text-sm font-medium">About you <span className="font-normal text-muted-foreground">(optional)</span></label><Textarea id="edit-about" className="mt-2 min-h-24" value={draft.about} maxLength={140} onChange={e=>setDraft(d=>({...d,about:e.target.value}))} placeholder="A short line about yourself, only if you'd like"/></div>
 <div><label htmlFor="edit-language" className="text-sm font-medium">Language</label><Input id="edit-language" className="mt-2 h-12" value={draft.language} maxLength={60} onChange={e=>setDraft(d=>({...d,language:e.target.value}))}/></div>
 <div><label htmlFor="edit-communication" className="text-sm font-medium">Preferred communication</label><Input id="edit-communication" className="mt-2 h-12" value={draft.communication} maxLength={60} onChange={e=>setDraft(d=>({...d,communication:e.target.value}))}/></div>
 </div>
 <AppButton className="mt-7 w-full" onClick={save}>Save changes</AppButton><Button variant="ghost" className="mt-2 w-full" onClick={back}>Cancel</Button>
 <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">In this prototype, your details stay on this device only.</p></div></>;
}

const privacySections=["What SAATHI monitors","Why information is used","Who may access information","When information may be shared","Community privacy","AI conversation privacy"];
function Privacy({back}:{back:()=>void}){const [expanded,setExpanded]=useState(0);return <><Header title="Privacy" back={back}/><div className="p-5"><Card className="mb-5 border-primary/20 bg-primary-soft"><LockKeyhole className="size-5 text-primary"/><p className="mt-3 text-sm leading-6">Your conversations and check-ins are private. In this prototype, they remain on this browser only.</p></Card><div className="divide-y divide-border">{privacySections.map((x,i)=><button key={x} onClick={()=>setExpanded(expanded===i?-1:i)} className="w-full py-4 text-left"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{x}</span><ChevronRight className={cn("size-4 transition-transform",expanded===i&&"rotate-90")}/></div>{expanded===i&&<p className="mt-3 pr-5 text-sm leading-6 text-muted-foreground">SAATHI uses only the information you choose to share to support your experience. You can change this choice at any time. Information is never shown publicly without your action.</p>}</button>)}</div></div></>}
function Consent({back}:{back:()=>void}){const items=["Wellbeing check-ins","AI conversations","Human listener connection","Community participation","Support escalation"];const [enabled,setEnabled]=useState<Record<string,boolean>>(Object.fromEntries(items.map(x=>[x,true])));return <><Header title="Consent & control" back={back}/><div className="p-5"><p className="text-sm leading-6 text-muted-foreground">Choose what SAATHI may use. Turning something off will not prevent you from accessing urgent support.</p><Card className="mt-6">{items.map((x,i)=><div key={x} className="flex items-center justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{x}</p><p className="mt-1 text-xs text-muted-foreground">{i===4?"Allow a support handoff when you ask for it.":"Allow this part of your SAATHI experience."}</p></div><Switch checked={Boolean(enabled[x])} onCheckedChange={v=>setEnabled({...enabled,[x]:v})}/></div>)}</Card><AppButton className="mt-6 w-full" onClick={()=>toast.success("Consent choices saved locally")}>Save choices</AppButton></div></>}

function ListenerHome({go,available,setAvailable}:{go:(s:Screen)=>void;available:boolean;setAvailable:(v:boolean)=>void}){return <><div className="p-5 pt-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div><p className="text-sm text-muted-foreground">Listener dashboard</p><h1 className="text-2xl font-semibold">Good evening, Ananya</h1></div><Avatar initials="AR"/></div><Card className="mt-7 border-primary/20 bg-primary-soft"><div className="flex items-center justify-between"><div><Status>{available?"Available now":"Unavailable"}</Status><p className="mt-2 text-sm text-muted-foreground">People can {available?"now":"not currently"} request your support.</p></div><Switch checked={available} onCheckedChange={setAvailable}/></div></Card><div className="mt-5 grid grid-cols-3 gap-3">{[["2","Pending"],["1","Active"],["3","Today"]].map(([n,l])=><Card key={l} className="p-3 text-center"><p className="text-2xl font-semibold">{n}</p><p className="mt-1 text-[10px] text-muted-foreground">{l}</p></Card>)}</div><div className="mt-7"><SectionTitle title="Pending requests" action="View all" onAction={()=>go("requests")}/><Card onClick={()=>go("requests")}><Badge tone="warm">Waiting 3 min</Badge><h3 className="mt-3 font-semibold">Someone needs support</h3><p className="mt-2 text-sm text-muted-foreground">Loneliness · Hindi · Text preferred</p></Card></div><div className="mt-7"><SectionTitle title="Active conversation"/><Card onClick={()=>go("listener-messages")}><div className="flex gap-3"><Avatar initials="A"/><div><p className="text-sm font-semibold">Anonymous user</p><p className="mt-1 text-xs text-muted-foreground">“Thank you. I’ve felt quite alone…”</p><Status>Active now</Status></div></div></Card></div><Card className="mt-7"><p className="text-sm font-semibold">Listener reminder</p><p className="mt-2 text-sm leading-6 text-muted-foreground">You can pause availability whenever you need. Caring for your own capacity matters too.</p></Card></div></>}
function Requests({go}:{go:(s:Screen)=>void}){const [requests,setRequests]=useState(supportRequests);return <><Header title="Support requests" subtitle={`${requests.length} waiting`}/><div className="space-y-3 p-5">{requests.length===0?<Empty title="No requests waiting" body="New requests will appear here while you are available."/>:requests.map(r=><Card key={r.id}><div className="flex items-center justify-between"><Badge tone="warm">{r.waiting}</Badge><span className="text-xs text-muted-foreground">New</span></div><h2 className="mt-4 font-semibold">User needs support</h2><div className="mt-4 grid grid-cols-3 gap-2">{[["Topic",r.topic],["Language",r.language],["Preferred",r.preference]].map(([a,b])=><div key={a} className="rounded-md bg-muted p-2"><p className="text-[10px] text-muted-foreground">{a}</p><p className="mt-1 text-xs font-medium">{b}</p></div>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" className="h-10" onClick={()=>{setRequests(requests.filter(x=>x.id!==r.id));toast("Request declined")}}>Decline</Button><Button className="h-10" onClick={()=>{toast.success("Request accepted");go("listener-messages")}}>Accept</Button></div></Card>)}</div></>}
function ListenerMessages({go}:{go:(s:Screen)=>void}){return <><Header title="Messages" subtitle="1 active conversation"/><div className="p-5"><Card onClick={()=>go("human-chat")}><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3"><Avatar initials="A"/><div className="min-w-0"><p className="text-sm font-semibold">Anonymous user</p><p className="truncate text-xs text-muted-foreground">I’ve felt quite alone this week.</p><Status>Active now</Status></div><span className="text-[10px] text-muted-foreground">10:13</span></div></Card><Empty className="mt-7" title="No other conversations" body="Accepted requests will appear here."/></div></>}
function ListenerHistory(){return <><Header title="History" subtitle="Past support activity"/><div className="divide-y divide-border px-5">{history.map((h,i)=><div key={i} className="py-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{h.name}</p><Badge>{h.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{h.topic} · {h.date}</p><p className="mt-1 text-xs text-muted-foreground">{h.duration}</p></div>)}</div></>}
function ListenerProfileEdit({available,setAvailable,logout}:{available:boolean;setAvailable:(v:boolean)=>void;logout:()=>void}){return <><Header title="Listener profile" subtitle="Visible to people seeking support"/><div className="p-5 text-center"><Avatar initials="AR" large/><h2 className="mt-4 text-xl font-semibold">Ananya Rao</h2><Badge tone="accent">Trained listener</Badge><div className="mt-7 text-left"><Card><Row icon={Languages} title="Languages" subtitle="Hindi · English"/><Row icon={MessageCircle} title="Topics" subtitle="Loneliness · Grief"/><Row icon={UserRound} title="About me" subtitle="A calm, judgment-free space"/><Row icon={Clock3} title="Experience" subtitle="2 years of peer support"/><Row icon={ShieldCheck} title="Training" subtitle="Active listening and safeguarding"/><div className="flex items-center justify-between py-4"><div><p className="text-sm font-medium">Availability</p><p className="text-xs text-muted-foreground">{available?"Available":"Unavailable"}</p></div><Switch checked={available} onCheckedChange={setAvailable}/></div></Card><Button variant="outline" className="mt-5 h-12 w-full" onClick={()=>toast.success("Profile saved locally")}><PencilLine/> Edit profile</Button><Button variant="ghost" className="mt-2 h-12 w-full text-destructive" onClick={logout}><LogOut/> Sign out</Button></div></div></>}
function Empty({title,body,className}:{title:string;body:string;className?:string}){return <div className={cn("rounded-lg border border-dashed border-border p-8 text-center",className)}><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted"><MessageCircle className="size-4 text-muted-foreground"/></span><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></div>}
function ConfirmDialog({title,body,cancel,confirm}:{title:string;body:string;cancel:()=>void;confirm:()=>void}){return <div className="absolute inset-0 z-50 grid place-items-end bg-overlay p-4 sm:place-items-center sm:rounded-[28px]" onClick={cancel}><div className="w-full rounded-lg bg-card p-5 shadow-phone" onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between"><h2 className="text-lg font-semibold">{title}</h2><Button variant="ghost" size="icon" onClick={cancel}><X/></Button></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p><div className="mt-6 grid grid-cols-2 gap-3"><Button variant="outline" className="h-11" onClick={cancel}>Cancel</Button><Button variant="destructive" className="h-11" onClick={confirm}>End</Button></div></div></div>}
