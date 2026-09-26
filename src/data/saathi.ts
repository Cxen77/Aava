export type Listener = {
  id: string;
  name: string;
  initials: string;
  role: "Volunteer" | "Trained listener" | "Counsellor";
  languages: string[];
  topics: string[];
  availability: string;
  experience: string;
  training: string;
  bio: string;
};

export type Community = {
  id: string;
  name: string;
  description: string;
  members: string;
  activity: string;
  category: string;
  joined?: boolean;
};

export type FeedPost = { id: string; groupId: string; author: string; time: string; title: string; body: string; replies: number; likes: number };

export type ChatMessage = { id: string; from: "me" | "saathi" | "listener"; text: string; time: string };
export type GroupMessage = { id: string; sender: string; text: string; time: string; mine?: boolean };
export type GroupConversation = { id: string; members: number; unread: number; messages: GroupMessage[] };

export const user = { name: "Aarav", language: "English & Hindi", communication: "Text & voice", phone: "+91 ••••• ••842" };

export const listeners: Listener[] = [
  { id: "ananya", name: "Ananya Rao", initials: "AR", role: "Trained listener", languages: ["Hindi", "English"], topics: ["Loneliness", "Grief", "Social isolation"], availability: "Available now", experience: "2 years of peer support", training: "Active listening and safeguarding", bio: "I offer a calm, judgment-free space where you can share at your own pace." },
  { id: "kabir", name: "Kabir Mehta", initials: "KM", role: "Volunteer", languages: ["English", "Marathi"], topics: ["Family support", "Uncertainty"], availability: "Available in 15 min", experience: "8 months of community support", training: "SAATHI listener orientation", bio: "Sometimes being heard is the first step. I am here to listen without rushing you." },
  { id: "farah", name: "Dr. Farah Ali", initials: "FA", role: "Counsellor", languages: ["Hindi", "Urdu", "English"], topics: ["Trauma recovery", "Grief"], availability: "Next slot at 6:30 PM", experience: "6 years of counselling practice", training: "Licensed counselling psychologist", bio: "I support people through difficult transitions with a gentle, person-centred approach." },
];

export const communities: Community[] = [
  { id: "loneliness", name: "Living with loneliness", description: "A gentle space to feel heard and less alone.", members: "1.2k", activity: "18 new posts this week", category: "Loneliness", joined: true },
  { id: "grief", name: "Grief & remembrance", description: "Share memories, loss, and ways of carrying on.", members: "846", activity: "8 new posts this week", category: "Grief", joined: true },
  { id: "recovery", name: "Recovery & healing", description: "Make room for healing at your own pace.", members: "734", activity: "11 new posts this week", category: "Recovery", joined: true },
  { id: "family", name: "Family & social support", description: "Navigate relationships, boundaries, and care.", members: "605", activity: "6 new posts this week", category: "Family support" },
  { id: "case", name: "Court & case support", description: "Support through hearings, delays and difficult processes.", members: "420", activity: "4 new posts this week", category: "Court support" },
  { id: "uncertainty", name: "Dealing with uncertainty", description: "Finding steadiness during waiting and change.", members: "512", activity: "9 new posts this week", category: "Uncertainty" },
  { id: "hardship", name: "Rebuilding after hardship", description: "Small steps forward after a difficult chapter.", members: "670", activity: "13 new posts this week", category: "Recovery" },
  { id: "belonging", name: "Community & belonging", description: "Find people who understand the need to belong.", members: "892", activity: "15 new posts this week", category: "Social isolation" },
  { id: "financial", name: "Financial hardship & recovery", description: "Share practical encouragement through money pressures.", members: "390", activity: "7 new posts this week", category: "Financial hardship" },
  { id: "difficult", name: "Safe space for difficult days", description: "A quieter place to share without pressure.", members: "1.1k", activity: "21 new posts this week", category: "Difficult days" },
  { id: "strength", name: "Finding strength", description: "A space for encouragement through difficult stretches.", members: "503", activity: "10 new posts this week", category: "Recovery", joined: true },
];

export const groupConversations: GroupConversation[] = [
  { id: "loneliness", members: 128, unread: 2, messages: [
    { id: "gl1", sender: "Ananya", text: "Some days are harder than others.", time: "9:36 AM" },
    { id: "gl2", sender: "Aarav", text: "I've been feeling that too.", time: "9:38 AM", mine: true },
    { id: "gl3", sender: "Rahul", text: "What helped me was talking to someone.", time: "9:40 AM" },
    { id: "gl4", sender: "Ananya", text: "You're not the only one feeling this.", time: "2m ago" },
  ] },
  { id: "recovery", members: 86, unread: 1, messages: [
    { id: "gr1", sender: "Meera", text: "Taking things one day at a time has helped me.", time: "10:08 AM" },
    { id: "gr2", sender: "Rahul", text: "Has anyone found something that helped?", time: "15m ago" },
  ] },
  { id: "family", members: 54, unread: 0, messages: [
    { id: "gf1", sender: "Priya", text: "It helped to say what I needed clearly.", time: "11:20 AM" },
    { id: "gf2", sender: "Ananya", text: "Thank you everyone for sharing.", time: "1h ago" },
  ] },
  { id: "strength", members: 103, unread: 0, messages: [
    { id: "gs1", sender: "Rahul", text: "A little encouragement goes a long way.", time: "10:12 AM" },
    { id: "gs2", sender: "Meera", text: "Welcome to the group.", time: "2h ago" },
  ] },
  { id: "grief", members: 62, unread: 0, messages: [
    { id: "gg1", sender: "Riya", text: "I'm glad there's a place to remember together.", time: "Yesterday" },
  ] },
];

export const initialPosts: FeedPost[] = [
  { id: "p1", groupId: "loneliness", author: "Anonymous", time: "2h ago", title: "The quiet parts of the day", body: "Some days loneliness feels heavier than usual. I went for a short walk and noticed I felt a little less stuck. Does anyone else have a small thing that helps?", replies: 12, likes: 24 },
  { id: "p2", groupId: "recovery", author: "Meera", time: "4h ago", title: "Taking it one day at a time", body: "I've been trying to stay positive while dealing with everything going on. Today I let myself take a break instead. That felt important.", replies: 8, likes: 18 },
  { id: "p3", groupId: "case", author: "Anonymous", time: "6h ago", title: "Waiting for another date", body: "Another hearing was postponed. It helps to hear from people who understand how tiring the waiting can be.", replies: 6, likes: 11 },
  { id: "p4", groupId: "grief", author: "Riya", time: "Yesterday", title: "A memory I wanted to share", body: "I made my mother's favourite tea today. For a moment, it felt like sitting with her again.", replies: 15, likes: 32 },
  { id: "p5", groupId: "family", author: "Anonymous", time: "Yesterday", title: "Asking for space", body: "I told my family what kind of support I need, even though it was difficult to say out loud.", replies: 9, likes: 16 },
  { id: "p6", groupId: "financial", author: "Kiran", time: "2 days ago", title: "One practical step", body: "I finally asked a friend to help me look over my options. It was less overwhelming together.", replies: 5, likes: 14 },
];

export const conversationPreviews = [
  { id: "ananya", name: "Ananya Rao", initials: "AR", detail: "Trained listener · Hindi", preview: "Take care. We can talk again whenever you like.", time: "2h ago" },
  { id: "kabir", name: "Kabir Mehta", initials: "KM", detail: "Volunteer · English", preview: "I'm here if you want to talk more.", time: "Yesterday" },
];

export type BadgeTheme = "Self-care" | "Connection" | "Community";
export type BadgeMetric = "checks" | "chats" | "listeners" | "groups" | "posts" | "joined";
export type BadgeDefinition = { name: string; description: string; theme: BadgeTheme; metric: BadgeMetric; target: number; motif: "sunrise" | "leaf" | "path" | "bubbles" | "people" | "home" | "hands" | "stars" };
const badge = (name: string, description: string, theme: BadgeTheme, metric: BadgeMetric, target: number, motif: BadgeDefinition["motif"]): BadgeDefinition => ({name,description,theme,metric,target,motif});
export const journeyBadges: BadgeDefinition[] = [
  badge("First Step","You made space for your first check-in.","Self-care","checks",1,"sunrise"),
  badge("Reached Out","You started a conversation with SAATHI.","Connection","chats",1,"bubbles"),
  badge("Connected","You talked with a human listener.","Connection","listeners",1,"people"),
  badge("Found Your Space","You joined a supportive group.","Community","groups",1,"home"),
  badge("Staying Connected","You made space for seven check-ins.","Self-care","checks",7,"leaf"),
  badge("Shared Support","You shared something with your community.","Community","posts",1,"hands"),
  badge("Here Again","You checked in on two different days.","Self-care","checks",2,"path"),
  badge("Three Moments","You checked in on three different days.","Self-care","checks",3,"stars"),
  badge("A Little Space","You checked in on four different days.","Self-care","checks",4,"sunrise"),
  badge("Room to Breathe","You checked in on five different days.","Self-care","checks",5,"leaf"),
  badge("Showing Up","You checked in on six different days.","Self-care","checks",6,"path"),
  badge("Ten Moments","You checked in on ten different days.","Self-care","checks",10,"stars"),
  badge("Two Weeks of Moments","You checked in on fourteen different days.","Self-care","checks",14,"sunrise"),
  badge("Open Path","You checked in on twenty-one different days.","Self-care","checks",21,"path"),
  badge("Thirty Moments","You checked in on thirty different days.","Self-care","checks",30,"leaf"),
  badge("A Longer Path","You checked in on forty-five different days.","Self-care","checks",45,"stars"),
  badge("Another Conversation","You sent two messages to SAATHI.","Connection","chats",2,"bubbles"),
  badge("Finding Words","You sent three messages to SAATHI.","Connection","chats",3,"stars"),
  badge("Open Conversation","You sent five messages to SAATHI.","Connection","chats",5,"bubbles"),
  badge("Room to Talk","You sent ten messages to SAATHI.","Connection","chats",10,"people"),
  badge("Keeping in Touch","You sent twenty messages to SAATHI.","Connection","chats",20,"bubbles"),
  badge("A Listening Space","You sent two messages to a listener.","Connection","listeners",2,"people"),
  badge("Conversation Continued","You sent three messages to a listener.","Connection","listeners",3,"hands"),
  badge("Another Space","You joined two supportive groups.","Community","groups",2,"home"),
  badge("Three Spaces","You joined three supportive groups.","Community","groups",3,"stars"),
  badge("Open Doors","You joined five supportive groups.","Community","groups",5,"home"),
  badge("A Second Share","You shared two community posts.","Community","posts",2,"hands"),
  badge("Your Voice Here","You shared three community posts.","Community","posts",3,"bubbles"),
  badge("Stories Shared","You shared five community posts.","Community","posts",5,"hands"),
  badge("A Place to Begin","You joined SAATHI.","Community","joined",1,"sunrise"),
];

export const initialSaathiMessages: ChatMessage[] = [
  { id: "m1", from: "saathi", text: "Hi Aarav. I’m here with you. How has today felt so far?", time: "9:41 AM" },
  { id: "m2", from: "me", text: "A little heavier than usual.", time: "9:42 AM" },
  { id: "m3", from: "saathi", text: "Thank you for saying that. We can take this slowly. Would you like to share what has been weighing on you, or would quiet company feel better?", time: "9:42 AM" },
];

export const humanMessages: ChatMessage[] = [
  { id: "h1", from: "listener", text: "Hello, I’m Ananya. I’m here to listen, and there’s no pressure to explain everything at once.", time: "10:12 AM" },
  { id: "h2", from: "me", text: "Thank you. I’ve felt quite alone this week.", time: "10:13 AM" },
  { id: "h3", from: "listener", text: "I’m glad you reached out. What part of the week has felt hardest?", time: "10:13 AM" },
];

export const wellbeing = [
  { date: "Sep 18", state: "Good", note: "Felt rested and connected" },
  { date: "Sep 20", state: "Okay", note: "A busy, uneven day" },
  { date: "Sep 22", state: "Difficult", note: "Needed more quiet and support" },
  { date: "Sep 24", state: "Improving", note: "Reaching out helped" },
];

export const notifications = [
  { id: "n1", title: "A gentle check-in", body: "Take a moment for yourself when you’re ready.", time: "20 min", kind: "Check-in" },
  { id: "n2", title: "Ananya is available", body: "A listener you viewed is available now.", time: "1h", kind: "Support" },
  { id: "n3", title: "New reply in Living with loneliness", body: "Meera replied to your post.", time: "3h", kind: "Community" },
];

export const supportRequests = [
  { id: "r1", topic: "Loneliness", language: "Hindi", preference: "Text", waiting: "Waiting 3 min", status: "new" },
  { id: "r2", topic: "Family support", language: "English", preference: "Text", waiting: "Waiting 8 min", status: "new" },
];

export const history = [
  { name: "Anonymous user", topic: "Loneliness", date: "Today · 10:12 AM", duration: "24 min", status: "Completed" },
  { name: "Anonymous user", topic: "Grief", date: "Yesterday · 6:40 PM", duration: "18 min", status: "Completed" },
  { name: "Support request", topic: "Family support", date: "Sep 22 · 2:15 PM", duration: "Declined", status: "Closed" },
];
