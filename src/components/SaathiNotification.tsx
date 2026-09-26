import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Award, Bell, Flag, Heart, Moon, Sparkles, Users, MessageCircle, type LucideIcon } from "lucide-react";
import { SaathiCompanion, type CompanionExpression } from "./SaathiCompanion";
import { NOTIFICATION_EMOTION, type NotificationEmotion, type NotificationType } from "@/data/notifications";

const EXPRESSION: Record<NotificationEmotion, CompanionExpression> = {
  happy: "happy", calm: "idle", supportive: "supportive", excited: "excited",
  thinking: "thinking", listening: "listening", celebrating: "celebrating", sleepy: "sleepy",
};
const REACT: Record<NotificationEmotion, CompanionExpression> = {
  happy: "celebrating", calm: "happy", supportive: "listening", excited: "celebrating",
  thinking: "responding", listening: "happy", celebrating: "excited", sleepy: "happy",
};
const ICON: Record<NotificationType, LucideIcon> = {
  checkin: Bell, supportive: Heart, listener: MessageCircle, group: Users,
  milestone: Flag, badge: Award, streak: Sparkles, evening: Moon,
};
// One SAATHI surface; each type gets only a subtle tint.
const TINT: Record<NotificationType, string> = {
  checkin: "var(--primary)", supportive: "var(--teal)", listener: "var(--primary)", group: "var(--teal)",
  milestone: "var(--coral)", badge: "var(--coral)", streak: "var(--coral)", evening: "var(--primary)",
};

type Props = {
  type?: NotificationType;
  emotion?: NotificationEmotion;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  playKey?: number;
};

export function SaathiNotification({ type = "checkin", emotion, title, message, action, onAction, playKey = 0 }: Props) {
  const reduce = useReducedMotion();
  const mood = emotion ?? NOTIFICATION_EMOTION[type];
  const [tapped, setTapped] = useState(false);
  const Icon = ICON[type];
  const tint = TINT[type];

  const handle = () => {
    if (tapped) return;
    setTapped(true);
    window.setTimeout(() => { setTapped(false); onAction?.(); }, reduce ? 150 : 650);
  };

  return (
    <motion.div
      key={playKey}
      role="status"
      aria-label={`${title}. ${message}`}
      className="relative mr-4 mt-6 overflow-visible"
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        type="button"
        onClick={handle}
        animate={{ scale: tapped && !reduce ? 0.97 : 1 }}
        className="relative block min-h-20 w-full rounded-[24px] border border-border p-4 pr-[30%] text-left shadow-lg"
        style={{ background: `linear-gradient(135deg, var(--card) 55%, color-mix(in oklab, ${tint} 14%, var(--card)))`, boxShadow: `0 14px 30px -18px color-mix(in oklab, ${tint} 60%, transparent)` }}
      >
        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="size-3.5" style={{ color: tint }} aria-hidden /> SAATHI
        </span>
        <span className="block text-[15px] font-semibold leading-snug text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{message}</span>
        {action && <span className="mt-3 inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{action}</span>}
      </motion.button>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-7 w-[34%] max-w-32"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.4, rotate: 18 }}
        animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
        transition={reduce ? { duration: 0.2 } : { delay: 0.25, type: "spring", stiffness: 320, damping: 14 }}
      >
        <SaathiCompanion expression={tapped ? REACT[mood] : EXPRESSION[mood]} lively={mood === "calm"} className="h-auto w-full drop-shadow-md" />
      </motion.div>
    </motion.div>
  );
}
