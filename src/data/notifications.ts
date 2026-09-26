// Mock notification content. Kept separate from the visual component so a real delivery system can feed it later.
export type NotificationEmotion = "happy" | "calm" | "supportive" | "excited" | "thinking" | "listening" | "celebrating" | "sleepy";
export type NotificationType = "checkin" | "supportive" | "listener" | "group" | "milestone" | "badge" | "streak" | "evening";

export type NotificationData = { type: NotificationType; title: string; message: string; action: string };

export const NOTIFICATION_EMOTION: Record<NotificationType, NotificationEmotion> = {
  checkin: "calm", supportive: "supportive", listener: "listening", group: "happy",
  milestone: "excited", badge: "celebrating", streak: "celebrating", evening: "sleepy",
};

export const sampleNotifications: NotificationData[] = [
  { type: "checkin", title: "How are you feeling?", message: "Your check-in is ready.", action: "Check in" },
  { type: "supportive", title: "Take a moment", message: "Want to talk about how today has been?", action: "Talk to SAATHI" },
  { type: "listener", title: "Ananya replied", message: "Your listener is available to talk.", action: "Open chat" },
  { type: "group", title: "New activity", message: "Someone replied in your group.", action: "View group" },
  { type: "milestone", title: "Milestone reached!", message: "You completed another step in your journey.", action: "View journey" },
  { type: "badge", title: "Badge unlocked!", message: "You earned the Connected badge.", action: "View badge" },
  { type: "streak", title: "You're staying connected", message: "5 check-ins in a row.", action: "View progress" },
  { type: "evening", title: "Checking in?", message: "Take a moment for yourself before the day ends.", action: "Check in" },
];

export const emotionSamples: { emotion: NotificationEmotion; title: string; message: string }[] = [
  { emotion: "happy", title: "Happy", message: "Positive progress and kind messages." },
  { emotion: "calm", title: "Calm", message: "Everyday reminders and check-ins." },
  { emotion: "supportive", title: "Supportive", message: "Gentle presence on harder days." },
  { emotion: "excited", title: "Excited", message: "Milestones and journey steps." },
  { emotion: "thinking", title: "Thinking", message: "SAATHI is thinking…" },
  { emotion: "listening", title: "Listening", message: "Tell me more — I'm here." },
  { emotion: "celebrating", title: "Celebrating", message: "Badges and staying connected." },
  { emotion: "sleepy", title: "Sleepy", message: "Soft evening reminders." },
];
