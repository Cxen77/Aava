# SAATHI — Handover for the Expo + NestJS Build
> *"AI maintains the connection. Humans provide the care."*

This document turns the approved, working SAATHI mobile prototype (built in Lovable) into an actionable, enterprise-grade build plan for the production stack: **Expo (React Native) + NestJS + PostgreSQL/Prisma**, with **hosted cloud infrastructure (zero local servers)**.

This handover document, alongside the documentation in [`docs/`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/docs), is intended for the engineering team. The prototype in this repository is the approved reference for how the application looks, reads, feels, and moves.

---

## Table of Contents
1. [Non-Negotiable Product & Safety Rules](#1-non-negotiable-product--safety-rules)
2. [Stack & Hosting Architecture (Cloud-Only)](#2-stack--hosting-architecture-cloud-only)
3. [Repository Layout](#3-repository-layout)
4. [Reusing & Porting the Prototype](#4-reusing--porting-the-prototype)
5. [Prisma Data Model](#5-prisma-data-model)
6. [Auth & Authorization](#6-auth--authorization)
7. [REST API Specification (/v1)](#7-rest-api-specification-v1)
8. [AI Layer & Clinical Safety Guardrails](#8-ai-layer--clinical-safety-guardrails)
9. [Distress Monitoring → Human Review Pipeline](#9-distress-monitoring--human-review-pipeline)
10. [Realtime Gateway (Socket.IO + Redis)](#10-realtime-gateway-socketio--redis)
11. [Notifications & Reminders](#11-notifications--reminders)
12. [Content Moderation](#12-content-moderation)
13. [Environment Configuration](#13-environment-configuration)
14. [Delivery Phases & Milestones](#14-delivery-phases--milestones)
15. [Seed Data Specification](#15-seed-data-specification)
16. [Verification & Acceptance Criteria](#16-verification--acceptance-criteria)

---

## 1. Non-Negotiable Product & Safety Rules

1. **SAATHI never diagnoses.**
   - No AI or system output may name depression, PTSD, clinical anxiety, bipolar disorder, or any psychiatric pathology.
   - Always mirror and use the user's own self-reported words (e.g., *"Your recent check-ins show more difficult days."*).
2. **The AI is a supportive companion, not a therapist.**
   - It maintains emotional presence, validates experiences gently, and always maintains an immediate visual affordance to reach human listeners, counsellors, and emergency crisis hotlines.
3. **Distress signals only lead to human review.**
   - The automated system never takes punitive or irreversible actions on its own.
   - Algorithms flag patterns for human caseworkers; only authorized human caseworkers decide on outreach.
4. **No shaming or pressure.**
   - A missed day is never framed as a failure.
   - The companion mascot is never sad, disappointed, or guilting.
   - Streaks are celebrated as **"warmth"**, never fire or anxiety-inducing counters.
5. **One check-in per user per local calendar day.**
   - Enforced by database constraint (`@@unique([userId, localDate])`).
   - Coming back to the app on the same day is welcomed, but warmth and badges do not increment multiple times in a single day.
6. **Group conversations and community posts are distinct data types.**
   - **Talk** (`GroupConversation`, `GroupMessage`) uses locally/server-persisted realtime chat threads.
   - **Community** (`Community`, `Post`, `Comment`) owns discovery, forum topics, and asynchronous discussion threads.
7. **Reminders & notifications are strictly opt-in.**
   - Users can pause or dismiss reminders at any time without resetting streaks, warmth, or journey progress.
8. **Accessibility & Reduced Motion.**
   - Every animation across the companion mascot, badge celebrations, journey paths, and page transitions must respect the operating system's reduced-motion preference (`useReducedMotion()`).

---

## 2. Stack & Hosting Architecture (Cloud-Only)

> [!IMPORTANT]
> Nothing runs on local developer hardware in production or staging. All infrastructure components run on managed cloud platforms.

| Layer | Technology Choice | Production Hosting Platform | Notes |
| :--- | :--- | :--- | :--- |
| **Mobile App** | Expo SDK (latest), TypeScript, Expo Router, NativeWind (Tailwind v3/v4), TanStack Query, Zustand, Reanimated, react-native-svg, lucide-react-native | EAS Build / EAS Update | Single codebase targeting iOS and Android. Reads `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL`. Zero client secrets. |
| **API Backend** | NestJS (REST + Socket.IO gateway), TypeScript, class-validator / class-transformer DTOs | Render, Railway, or Fly.io | Modular monolith architecture. Prefix `/v1`. Rate-limiting with `@nestjs/throttler`. |
| **Database** | PostgreSQL + Prisma ORM | Neon or Supabase Postgres | Serverless/managed Postgres with connection pooling (PgBouncer/Supabase pooler). Automatic Prisma migrations. |
| **Realtime** | Socket.IO with `@socket.io/redis-adapter` | Upstash Redis | Horizontally scalable WebSocket pub/sub for chat, groups, typing indicators, and presence. |
| **Worker Queue** | BullMQ | Upstash Redis | Asynchronous distress signal processing, wellbeing baseline analysis, and scheduled notification cron. |
| **Storage** | S3-Compatible Object Store (`@aws-sdk/client-s3`) | Cloudflare R2 / AWS S3 | Encrypted storage for user avatars and voice notes using presigned PUT/GET URLs. |
| **Push Delivery**| Expo Push Service via `NotificationService` | Expo Application Services | Server-side push token dispatch for opt-in check-in reminders and listener replies. |
| **AI Layer** | `AIService` abstraction (`OpenAIProvider`, `GeminiProvider`, `MockProvider`) | OpenAI / Anthropic / Google Gemini | Selected via `AI_PROVIDER` env. Server-Sent Events (SSE) streaming with pre- and post-generation safety guardrails. |

---

## 3. Repository Layout

The production monorepo (managed via pnpm or npm workspaces) is organized as follows:

```text
saathi/
├── apps/
│   ├── mobile/                           # Expo React Native App
│   │   ├── app/                          # Expo Router file-based routes
│   │   │   ├── _layout.tsx               # Root layout: ThemeProvider, QueryClient, AuthProvider
│   │   │   ├── (auth)/                   # Authentication route group
│   │   │   │   ├── login.tsx             # Email/Password + Google Sign-In
│   │   │   │   └── register.tsx          # Registration + consent flow
│   │   │   └── (tabs)/                   # Main authenticated tab navigation
│   │   │       ├── _layout.tsx           # Tab bar: Home, Talk, Community, Support, Profile
│   │   │       ├── home.tsx              # Companion, daily check-in, warmth streak, quick feed
│   │   │       ├── talk.tsx              # SAATHI AI chat + Human listener chats + Group chats
│   │   │       ├── community.tsx         # Communities directory, post feed, discussion
│   │   │       ├── support.tsx           # Listeners, counsellors, emergency crisis card
│   │   │       └── profile.tsx           # Journey milestones, badge collection, check-in calendar
│   │   ├── src/
│   │   │   ├── api/                      # Typed API client, TanStack Query hooks, Socket.IO client
│   │   │   ├── components/               # Ported reusable components
│   │   │   │   ├── SaathiCompanion.tsx   # react-native-svg + Reanimated cat (14 expressions)
│   │   │   │   ├── BadgeArtwork.tsx      # Illustrated badge collectible artwork
│   │   │   │   ├── CheckinCalendar.tsx   # Monthly calendar grid + cubic trend chart
│   │   │   │   ├── JourneyExperience.tsx # Milestone curved path + badge collection
│   │   │   │   └── SaathiNotification.tsx# In-app toast/banner notifications
│   │   │   ├── store/                    # Zustand stores: session, user preferences, offline queue
│   │   │   └── theme/                    # NativeWind colors, typography, elevations
│   │   ├── tailwind.config.js            # Hex-converted SAATHI tokens
│   │   └── app.json                      # Expo configuration & plugins
│   └── api/                              # NestJS Backend Application
│       ├── src/
│       │   ├── common/                   # Shared guards, interceptors, filters
│       │   │   ├── guards/               # JwtAuthGuard, RolesGuard, RateLimitGuard
│       │   │   ├── filters/              # GlobalHttpExceptionFilter (uniform { data, error })
│       │   │   └── interceptors/         # TransformInterceptor, AuditLogInterceptor
│       │   ├── modules/                  # Feature domain modules
│       │   │   ├── auth/                 # Argon2id password, JWT access/refresh, Google OAuth
│       │   │   ├── users/                # User profiles, preferences, consent records
│       │   │   ├── checkins/             # Check-in logging, calendar query, trend aggregation
│       │   │   ├── ai/                   # AIService, streaming SSE, safety prompt & output guard
│       │   │   ├── conversations/        # 1:1 AI and listener conversations + message history
│       │   │   ├── listeners/            # Listener directory, availability, request dispatch
│       │   │   ├── groups/               # Group rooms, memberships, Socket.IO gateway
│       │   │   ├── communities/          # Community directory, member subscriptions
│       │   │   ├── posts/                # Community posts, comments, reactions
│       │   │   ├── wellbeing/            # Wellbeing signal processor, baseline deviation detection
│       │   │   ├── alerts/               # Caseworker alerts, triage states, audit logging
│       │   │   ├── notifications/        # Push dispatcher + 15-minute cron reminder worker
│       │   │   ├── journey/              # Milestone progress evaluator
│       │   │   ├── badges/               # Badge awarding engine & user collection
│       │   │   ├── support/              # Support requests & crisis resource directory
│       │   │   ├── moderation/           # Content screening, keyword filtering, reports
│       │   │   ├── admin/                # Caseworker dashboard, user management, audit review
│       │   │   └── storage/              # S3 presigned URL generation (avatars, audio)
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── prisma/
│           ├── schema.prisma             # Full Prisma schema
│           └── seed.ts                   # Production-grade mock seed data
├── packages/
│   └── shared/                           # Shared types, Zod DTO schemas, enums
│       ├── src/
│       │   ├── enums.ts                  # Role, Mood, SignalLevel, AlertStatus, NotificationType
│       │   ├── dtos/                     # Shared Zod validation schemas
│       │   └── types.ts                  # SafeProfile, CalendarDay, ChatTurn, ResponseEnvelope
│       └── package.json
└── docs/                                 # Architectural & Operational Documentation
    ├── ARCHITECTURE.md                   # Full system architecture & data flows
    ├── API.md                            # Comprehensive REST v1 & Socket.IO contract
    ├── SAFETY.md                         # Clinical safety, guardrails & distress signal rules
    ├── DEPLOYMENT.md                     # EAS, Render/Railway, Neon, Upstash, R2 setup
    └── PORTING_GUIDE.md                  # Prototype-to-React-Native implementation guide
```

---

## 4. Reusing & Porting the Prototype

The prototype codebase in this repository contains the exact visual, structural, and behavioral specifications. Here is how each prototype file translates into the target stack:

| Prototype File | Target Implementation | Porting Notes |
| :--- | :--- | :--- |
| [`src/components/SaathiCompanion.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/SaathiCompanion.tsx) | `apps/mobile/src/components/SaathiCompanion.tsx` | Port SVG paths to `react-native-svg` (`Svg`, `Path`, `Circle`, `G`). Port Motion keyframes to `react-native-reanimated` (`useAnimatedStyle`, `withRepeat`, `withTiming`). Preserve the **14 exact expression names** as the public API: `idle`, `happy`, `thinking`, `listening`, `supportive`, `grounding`, `celebrating`, `curious`, `welcoming`, `responding`, `voice`, `handoff`, `excited`, `sleepy`. Chat cat reacts exclusively to UI events, never to sentiment inference. |
| [`src/components/BadgeArtwork.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/BadgeArtwork.tsx) | `apps/mobile/src/components/BadgeArtwork.tsx` | Port SVG badge silhouettes and the 8 motif paths (`sunrise`, `leaf`, `path`, `bubbles`, `people`, `home`, `hands`, `stars`) to `react-native-svg`. Badge definitions in [`src/data/saathi.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/data/saathi.ts) become seed rows in the `Badge` table. |
| [`src/components/CheckinCalendar.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/CheckinCalendar.tsx) + [`src/data/checkins.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/data/checkins.ts) | `apps/mobile/src/components/CheckinCalendar.tsx` | Screen feeds from `GET /v1/checkins/calendar?month=YYYY-MM`. The smooth trend curve uses `react-native-svg` with cubic Bézier path strings calculated identically to the prototype. |
| [`src/components/JourneyExperience.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/JourneyExperience.tsx) | `apps/mobile/src/components/JourneyExperience.tsx` | Driven by `GET /v1/journey` and `GET /v1/badges/me`. Curved milestone progress path renders via `react-native-svg` with spring animated unlock modals. |
| [`src/components/SaathiNotification.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/SaathiNotification.tsx) + [`src/data/notifications.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/data/notifications.ts) | `apps/mobile/src/components/SaathiNotification.tsx` | Renders in-app notification banners. The 8 notification categories become the `NotificationType` enum. Notification copy matches the reassuring tone of the prototype. |
| [`src/data/saathi.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/data/saathi.ts) | `apps/api/prisma/seed.ts` | Source data for trained listeners, 11 communities, 5 group chat threads, 24+ badges, 8 journey milestones, and sample posts. |
| [`src/styles.css`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/styles.css) (OKLCH Color Tokens) | `apps/mobile/tailwind.config.js` | Converted from OKLCH to sRGB Hex values for NativeWind: Primary Indigo (`#4b3ea6`), Primary Soft (`#e8e6ff`), Ink (`#322b70`), Coral (`#dd6b5d`), Mint Teal (`#007759`), Teal Soft (`#cff6e7`), Warm (`#ffe7d9`), Background (`#f5f4fd`), Foreground (`#16192b`). |

---

## 5. Prisma Data Model

The core database schema is formalized in [`docs/schema.prisma`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/docs/schema.prisma):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  LISTENER
  CASEWORKER
  ADMIN
}

enum Mood {
  GOOD
  OKAY
  LOW
  DIFFICULT
}

enum ConversationKind {
  AI
  LISTENER
}

enum SignalLevel {
  NONE
  WATCH
  ATTENTION
  URGENT
}

enum AlertStatus {
  NEW
  REVIEWING
  CONTACTED
  RESOLVED
  DISMISSED
}

enum ListenerRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
  CLOSED
}

enum ReportStatus {
  OPEN
  ACTIONED
  DISMISSED
}

model User {
  id               String               @id @default(uuid())
  email            String               @unique
  passwordHash     String?
  googleId         String?              @unique
  roles            UserRole[]
  profile          Profile?
  preference       UserPreference?
  consents         Consent[]
  checkIns         CheckIn[]
  conversations    Conversation[]       @relation("UserConversations")
  listenerConvs    Conversation[]       @relation("ListenerConversations")
  groupMemberships GroupMember[]
  groupMessages    GroupMessage[]
  posts            Post[]
  comments         Comment[]
  reactions        Reaction[]
  wellbeingSignals WellbeingSignal[]
  alerts           Alert[]              @relation("UserAlerts")
  assignedAlerts   Alert[]              @relation("CaseworkerAlerts")
  supportRequests  SupportRequest[]
  reportsFiled     ModerationReport[]   @relation("ReporterUser")
  notifications    Notification[]
  badges           UserBadge[]
  journeyProgress  UserJourneyProgress[]
  refreshTokens    RefreshToken[]
  auditLogs        AuditLog[]           @relation("ActorLogs")
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  deletedAt        DateTime?
}

model UserRole {
  id     String @id @default(uuid())
  userId String
  role   Role
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
}

model Profile {
  userId        String   @id
  displayName   String
  about         String?
  avatarKey     String?
  language      String   @default("English")
  communication String   @default("Both")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPreference {
  userId          String    @id
  reminderEnabled Boolean   @default(false)
  reminderTime    String?   // "HH:mm" in local timezone
  reminderDays    Int[]     // 0=Sun, 1=Mon, ..., 6=Sat
  pausedUntil     DateTime?
  timezone        String    @default("Asia/Kolkata")
  pushToken       String?
  reducedMotion   Boolean   @default(false)
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Consent {
  id        String   @id @default(uuid())
  userId    String
  kind      String   // "TERMS", "SAFETY_REVIEW", "ANALYTICS"
  granted   Boolean
  version   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model CheckIn {
  id        String   @id @default(uuid())
  userId    String
  localDate String   // YYYY-MM-DD in user's local timezone
  mood      Mood
  rawChoice String   // "Good" | "Calm" | "Okay" | "Tired" | "Low" | "Difficult"
  note      String?
  voiceKey  String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, localDate]) // Enforces strictly 1 check-in per user per local calendar day
  @@index([userId, createdAt])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Conversation {
  id         String           @id @default(uuid())
  kind       ConversationKind
  userId     String
  listenerId String?
  summary    String?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  user       User             @relation("UserConversations", fields: [userId], references: [id], onDelete: Cascade)
  listener   User?            @relation("ListenerConversations", fields: [listenerId], references: [id])
  messages   Message[]

  @@index([userId])
  @@index([listenerId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String?      // Null if sent by AI companion
  role           String       // "user" | "companion" | "listener"
  body           String
  readAt         DateTime?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}

model ListenerProfile {
  userId      String    @id
  bio         String
  languages   String[]
  topics      String[]
  available   Boolean   @default(false)
  verifiedAt  DateTime?
}

model ListenerRequest {
  id         String                @id @default(uuid())
  userId     String
  listenerId String
  status     ListenerRequestStatus @default(PENDING)
  note       String?
  createdAt  DateTime              @default(now())
  updatedAt  DateTime              @updatedAt
}

model Group {
  id          String         @id @default(uuid())
  name        String
  icon        String
  description String
  members     GroupMember[]
  messages    GroupMessage[]
}

model GroupMember {
  groupId  String
  userId   String
  joinedAt DateTime @default(now())
  group    Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([groupId, userId])
}

model GroupMessage {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  body      String
  hiddenAt  DateTime?
  createdAt DateTime  @default(now())
  group     Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([groupId, createdAt])
}

model Community {
  id          String   @id @default(uuid())
  name        String
  icon        String
  description String
  posts       Post[]
}

model Post {
  id          String    @id @default(uuid())
  communityId String
  authorId    String
  title       String?
  body        String
  anonymous   Boolean   @default(false)
  hiddenAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments    Comment[]
  reactions   Reaction[]

  @@index([communityId, createdAt])
}

model Comment {
  id        String    @id @default(uuid())
  postId    String
  authorId  String
  body      String
  hiddenAt  DateTime?
  createdAt DateTime  @default(now())
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model Reaction {
  postId String
  userId String
  kind   String // "like", "heart", "warmth"
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId, kind])
}

model WellbeingSignal {
  id             String      @id @default(uuid())
  userId         String
  level          SignalLevel
  confidence     Float
  signals        String[]
  explanation    String      // Strictly descriptive, non-diagnostic
  recommendation String
  createdAt      DateTime    @default(now())
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}

model Alert {
  id         String      @id @default(uuid())
  userId     String
  signalId   String
  reason     String
  status     AlertStatus @default(NEW)
  assigneeId String?
  notes      String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  user       User        @relation("UserAlerts", fields: [userId], references: [id], onDelete: Cascade)
  assignee   User?       @relation("CaseworkerAlerts", fields: [assigneeId], references: [id])

  @@index([status, createdAt])
}

model SupportRequest {
  id        String   @id @default(uuid())
  userId    String
  kind      String   // "LISTENER", "COUNSELLOR", "CRISIS"
  message   String?
  status    String   @default("OPEN")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ModerationReport {
  id         String       @id @default(uuid())
  reporterId String
  targetType String       // "POST", "COMMENT", "GROUP_MESSAGE"
  targetId   String
  reason     String
  status     ReportStatus @default(OPEN)
  createdAt  DateTime     @default(now())
  reporter   User         @relation("ReporterUser", fields: [reporterId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String    // "checkin" | "supportive" | "listener" | "group" | "milestone" | "badge" | "streak" | "evening"
  title     String
  body      String
  deepLink  String?
  readAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
}

model Badge {
  id          String      @id
  name        String      @unique
  theme       String      // "Self-care" | "Connection" | "Community"
  metric      String      // "checks" | "chats" | "listeners" | "groups" | "posts" | "joined"
  target      Int
  description String
  motif       String      // "sunrise" | "leaf" | "path" | "bubbles" | "people" | "home" | "hands" | "stars"
  users       UserBadge[]
}

model UserBadge {
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge    Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@id([userId, badgeId])
}

model JourneyMilestone {
  id        String                @id
  order     Int                   @unique
  title     String
  condition String
  section   String                // "home" | "talk" | "community" | "support"
  metric    String
  target    Int
  users     UserJourneyProgress[]
}

model UserJourneyProgress {
  userId      String
  milestoneId String
  reachedAt   DateTime         @default(now())
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  milestone   JourneyMilestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)

  @@id([userId, milestoneId])
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String
  action    String
  entity    String
  entityId  String
  payload   Json?
  createdAt DateTime @default(now())
  actor     User     @relation("ActorLogs", fields: [actorId], references: [id])

  @@index([entity, entityId])
}
```

> **Note on Views & Computed Aggregates:**
> `MoodEntry` and `WellbeingTrend` from earlier product specs are implemented as derived SQL queries over the `CheckIn` table rather than redundant tables.

---

## 6. Auth & Authorization

1. **Authentication Flow:**
   - **Email + Password:** Scrypt / Argon2id password hashing via `@node-rs/argon2`.
   - **Google Sign-In:** Mobile invokes `expo-auth-session` → sends `idToken` to `POST /v1/auth/google` → NestJS verifies via Google Auth Library.
2. **Tokens:**
   - Short-lived Access JWT: **15-minute expiration**. Contains `{ sub: userId, email: string }`.
   - Rotating Refresh Token: **30-day expiration**, hashed in `RefreshToken` table. Stored on mobile in `expo-secure-store`. Revoked on logout or reuse.
3. **Role-Based Access Control (RBAC):**
   - User roles live in `UserRole` table (`USER`, `LISTENER`, `CASEWORKER`, `ADMIN`), never directly in the user profile.
   - Guarded by `@Roles(Role.CASEWORKER)` with `RolesGuard`. Caseworker and Admin routes verify current roles against the database on each privileged request.
4. **Row-Level Ownership:**
   - Every service query automatically filters by `userId` from the verified JWT.
   - Listeners may only access conversations where `listenerId === req.user.id`.

---

## 7. REST API Specification (/v1)

All endpoints return the uniform response envelope:
```typescript
type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};
```

### Core Endpoint Summary

| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/auth/register` | Register new account with email & password | Public |
| `POST` | `/v1/auth/login` | Authenticate with credentials | Public |
| `POST` | `/v1/auth/google` | Verify Google ID token and establish session | Public |
| `POST` | `/v1/auth/refresh` | Rotate refresh token and issue new 15m access JWT | Public (Refresh Token) |
| `POST` | `/v1/auth/logout` | Invalidate active refresh token | Authenticated |
| `GET` | `/v1/me` | Fetch user profile, roles, and preferences | Authenticated |
| `PATCH`| `/v1/me/profile` | Update profile information | Authenticated |
| `POST` | `/v1/me/avatar` | Generate presigned S3/R2 upload URL for avatar | Authenticated |
| `GET` | `/v1/me/preferences`| Fetch reminder, timezone, and motion preferences | Authenticated |
| `PUT` | `/v1/me/preferences`| Update reminder times, pause settings, push token | Authenticated |
| `POST` | `/v1/checkins` | Save daily check-in (enforces 1 per local calendar day) | Authenticated |
| `GET` | `/v1/checkins/today` | Fetch today's check-in status and warmth streak | Authenticated |
| `GET` | `/v1/checkins/calendar`| Fetch monthly calendar entries & trend aggregates | Authenticated |
| `POST` | `/v1/ai/chat` | Stream supportive companion response (Server-Sent Events) | Authenticated |
| `GET` | `/v1/ai/conversations/:id` | Fetch conversation history and turns | Authenticated |
| `GET` | `/v1/listeners` | Directory of verified human listeners | Authenticated |
| `POST` | `/v1/listeners/:id/request`| Request 1:1 conversation with listener | Authenticated |
| `GET` | `/v1/groups` | List group chats user is eligible for or in | Authenticated |
| `POST` | `/v1/groups/:id/join`| Join a group conversation | Authenticated |
| `GET` | `/v1/groups/:id/messages`| Fetch group chat history (paginated) | Authenticated |
| `POST` | `/v1/groups/:id/messages`| Send a message to group (broadcasts via Socket) | Authenticated |
| `GET` | `/v1/communities` | Browse community categories and topics | Authenticated |
| `GET` | `/v1/communities/:id/posts`| Fetch asynchronous community feed posts | Authenticated |
| `POST` | `/v1/communities/:id/posts`| Create new discussion post (subject to moderation) | Authenticated |
| `POST` | `/v1/posts/:id/comments`| Add comment to a community post | Authenticated |
| `POST` | `/v1/posts/:id/reactions`| Add/toggle reaction on a post | Authenticated |
| `GET` | `/v1/journey` | Get user journey milestone progress | Authenticated |
| `GET` | `/v1/badges/me` | Get user earned badges & progress toward locked | Authenticated |
| `POST` | `/v1/reports` | Submit moderation report on content | Authenticated |
| `GET` | `/v1/caseworker/alerts` | List distress alerts requiring review | Caseworker / Admin |
| `PATCH`| `/v1/caseworker/alerts/:id` | Triage alert (`REVIEWING`, `CONTACTED`, `RESOLVED`)| Caseworker / Admin |

*Refer to [`docs/API.md`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/docs/API.md) for full schemas and DTO definitions.*

---

## 8. AI Layer & Clinical Safety Guardrails

### 1. `AIService` Interface
```typescript
export interface SafeProfile {
  displayName: string;
  language: string;
  communication: string;
}

export interface ChatTurn {
  role: "user" | "companion";
  content: string;
  timestamp: string;
}

export interface CheckInInput {
  mood: "Good" | "Okay" | "Low" | "Difficult";
  rawChoice: string;
  note?: string;
}

export interface SuggestionContext {
  recentMood: string;
  conversationContext: string;
}

export interface AIService {
  generateSupportResponse(ctx: { history: ChatTurn[]; profile: SafeProfile }): AsyncIterable<string>;
  analyzeCheckIn(c: CheckInInput): Promise<{ themes: string[]; supportiveReply: string }>;
  analyzeConversationSignals(turns: ChatTurn[]): Promise<{ cues: string[]; confidence: number }>;
  summarizeConversation(turns: ChatTurn[]): Promise<string>;
  generateSupportSuggestions(ctx: SuggestionContext): Promise<string[]>;
}
```

### 2. Dual-Layer Safety Interceptor
- **Pre-Call Crisis Interceptor:** Scans input message for explicit self-harm, suicidal ideation, or acute crisis keywords. If detected:
  1. Instantly returns a compassionate crisis banner and emergency hotline info (e.g., Tele-MANAS `14416`, Kiran `1800-599-0019`).
  2. Dispatches an immediate `URGENT` wellbeing signal for caseworker triage.
  3. Bypasses generative LLM hallucination risk entirely.
- **System Prompt Non-Negotiables:** Enforces companion role (*"You are SAATHI, an empathetic non-clinical companion. You never diagnose. You never use medical terms like clinical depression, generalized anxiety disorder, PTSD, or trauma diagnosis. You validate gently and mirror the user's feelings."*).
- **Post-Generation Output Guard:** Regular expression and keyword filter screens every generated token stream. If any prohibited psychiatric diagnostic term is detected:
  1. The term is rewritten to non-clinical empathetic language (e.g., *"clinical depression"* → *"a heavy, difficult time"*).
  2. A `SafetyEvent` is recorded in the audit log for model alignment review.
- **Streaming over SSE:** Responses stream directly to the mobile client using Server-Sent Events (`POST /v1/ai/chat`). Both user and companion turns are persisted to PostgreSQL once the stream finishes.

---

## 9. Distress Monitoring → Human Review Pipeline

```text
User CheckIn / Message / SupportRequest
             │ (Asynchronous BullMQ worker on Upstash Redis)
             ▼
WellbeingAnalysisService
  ├─ Evaluates self-reported trend against user's 30-day baseline
  ├─ Detects sudden drop in engagement or check-in frequency
  └─ Evaluates non-clinical conversational cues
             │
             ▼
DistressSignalService
  └─ Computes: SignalLevel (NONE | WATCH | ATTENTION | URGENT)
               Confidence score (0.0 – 1.0)
               Descriptive signals (e.g. ["CONSECUTIVE_DIFFICULT_DAYS", "ISOLATION_CUE"])
             │
             ▼
RiskExplanationService
  └─ Generates objective, descriptive rationale (zero diagnostic jargon)
     "Recent self-reported activity differs from the user's recent pattern."
             │
             ▼
       WellbeingSignal Table
             │ Threshold check (configured per level in ALERT_THRESHOLDS_JSON)
             ▼
        AlertService ──► Creates Alert(status: NEW)
                               │
                               ▼
                   Caseworker Admin Dashboard
                 (Human caseworker investigates,
                  contacts user or resolves alert)
                               │
                               ▼
                       AuditLog Entry
```

### Ethical Guarantees:
- **Zero Automated Sanctions:** The algorithm never locks accounts, contacts family, or calls authorities without human evaluation.
- **Transparent Consent:** Users are informed during onboarding that aggregate participation patterns may be reviewed by trained staff to ensure user safety.
- **No Risk Scores Shown to Users:** Users never see an internal "risk score", preventing anxiety, gamification, or stigma.

---

## 10. Realtime Gateway (Socket.IO + Redis)

- **Namespaces:**
  - `/chat`: Direct 1:1 human listener conversations.
  - `/groups`: Group conversation channels.
- **Handshake Authentication:** The client sends the Bearer JWT in `socket.handshake.auth.token`. Sockets without valid tokens are rejected with `UnauthorizedException`.
- **Rooms & Membership:**
  - `/chat` rooms: `conv:<conversationId>`. Sockets can only join if `userId === user.id || userId === listenerId`.
  - `/groups` rooms: `group:<groupId>`. Sockets can only join if an active `GroupMember` record exists.
- **Events:**
  - Client → Server: `typing:start`, `typing:stop`, `message:read`, `presence:heartbeat`.
  - Server → Client: `message:new`, `message:read`, `typing:update`, `presence:update`, `notification:new`.
- **Architectural Rule:** Messages are **always written through REST endpoints first** (`POST /v1/groups/:id/messages`, `POST /v1/conversations/:id/messages`) to guarantee database atomicity, moderation scanning, and signal capture. The WebSocket gateway exclusively broadcasts committed messages.

---

## 11. Notifications & Reminders

1. **`NotificationService`:**
   - Saves record to `Notification` table.
   - If user opted in (`reminderEnabled: true`), has registered an Expo push token, and current timestamp is not inside `pausedUntil`, pushes payload via Expo Push Service.
2. **Scheduled Reminder Worker:**
   - Runs every 15 minutes via BullMQ cron.
   - Evaluates active users matching the current local time window according to their stored timezone (`Asia/Kolkata` default).
   - Skips users who have already checked in today (`CheckIn` exists for today's `localDate`).
   - Uses the warm, reassuring copy from the prototype:
     - *"How are you feeling? Your check-in is ready."*
     - *"Take a moment for yourself before the day ends."*

---

## 12. Content Moderation

1. **Pre-Save Screening (`ModerationService.screen()`):**
   - Executed on every community post, comment, and group message before database commit.
   - **Tier 1:** Instant regex blocklist for harassment, explicit hate speech, and doxxing.
   - **Tier 2:** AI moderation endpoint check (OpenAI Moderation / Gemini Safety attributes).
   - **Outcomes:** `ALLOWED`, `HELD_FOR_REVIEW`, or `BLOCKED`.
2. **Crisis Handling in Moderation:**
   - Content expressing self-harm is **never blocked silently**.
   - The user is immediately presented with emergency crisis lines, and an internal high-priority `SupportRequest` is registered for human review.
3. **User Reporting Queue:**
   - Community members can flag posts or comments via `POST /v1/reports`.
   - Items with reports are aggregated in the Caseworker/Admin Moderation Queue for review.

---

## 13. Environment Configuration

### Backend API (`apps/api/.env`)
```bash
# Database & Cache
DATABASE_URL="postgresql://user:password@neon.tech/saathi_db?sslmode=require"
REDIS_URL="rediss://default:token@upstash.io:6379"

# Authentication & Security
JWT_ACCESS_SECRET="super-secure-access-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="super-secure-refresh-jwt-secret-min-32-chars"
GOOGLE_CLIENT_ID="1234567890-example.apps.googleusercontent.com"
CORS_ORIGINS="http://localhost:8081,https://saathi-app.example.com"

# AI Provider Configuration
AI_PROVIDER="openai" # "openai" | "gemini" | "mock"
OPENAI_API_KEY="sk-proj-..."
GEMINI_API_KEY="AIzaSy..."

# Cloud Storage (S3 / Cloudflare R2)
S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
S3_BUCKET="saathi-assets"
S3_ACCESS_KEY="r2_access_key"
S3_SECRET_KEY="r2_secret_key"

# Expo Push Notifications
EXPO_ACCESS_TOKEN="expo_access_token_here"

# Safety Thresholds
ALERT_THRESHOLDS_JSON='{"consecutiveLowDays":3,"confidenceCutoff":0.75}'
```

### Mobile Application (`apps/mobile/.env`)
```bash
EXPO_PUBLIC_API_URL="https://api.saathi.example.com/v1"
EXPO_PUBLIC_WS_URL="wss://api.saathi.example.com"
EXPO_PUBLIC_GOOGLE_CLIENT_ID="1234567890-mobile.apps.googleusercontent.com"
```

---

## 14. Delivery Phases & Milestones

```text
Phase 1: Foundation (Monorepo, Auth, RBAC, Profiles, Hosted Setup)
   │
   ▼
Phase 2: Check-ins, Warmth, Calendar & Journey Engine
   │
   ▼
Phase 3: AI Companion (Streaming SSE, Safety Guardrails, Chat History)
   │
   ▼
Phase 4: Social & People (Listeners, Live 1:1 Chat, Groups, Communities)
   │
   ▼
Phase 5: Safety Ops (Distress Pipeline, Caseworker Dashboard, Moderation)
   │
   ▼
Phase 6: Polish, Offline Queue, Push Reminders & EAS Production Release
```

| Phase | Scope | Definition of Done |
| :--- | :--- | :--- |
| **Phase 1: Foundation** | Monorepo setup, Prisma schema & seed, Argon2id + Google auth, user profiles, preferences, hosted deploys on Render/Neon. | User can sign up on mobile device; profile and preferences persist after full app reinstall. |
| **Phase 2: Check-ins** | Daily check-in flow, 1-per-day rule, calendar grid, cubic trend curve, warmth counter, journey milestones & 30 badges. | Check-in calendar matches prototype pixel-for-pixel and feeds dynamically from `GET /v1/checkins/calendar`. |
| **Phase 3: AI Companion** | `AIService` abstraction, streaming chat via SSE, pre-call crisis interceptor, diagnostic post-filter. | Prohibited diagnostic phrases are rejected in automated unit tests; crisis inputs trigger immediate hotline modal. |
| **Phase 4: People** | Listener directory & request flow, live 1:1 chat over Socket.IO, group rooms, community post feeds. | Two separate devices can chat in real time with active typing states, read receipts, and online presence. |
| **Phase 5: Safety Ops** | Asynchronous signal queue, distress baseline scoring, alert escalation, caseworker triage dashboard, audit log. | A seeded user pattern triggers an `ATTENTION` alert; a caseworker logs into the dashboard and resolves it. |
| **Phase 6: Polish** | Push reminder worker, offline mutation queue with optimistic updates, accessibility audit, EAS Release. | App passes Maestro automated test suites and builds successfully on EAS TestFlight / Google Play Internal Track. |

---

## 15. Seed Data Specification

The database seed script in [`docs/seed.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/docs/seed.ts) populates:

1. **Staff Roles:**
   - `1` Admin user (`admin@saathi.org`).
   - `2` Caseworkers (`caseworker.arun@saathi.org`, `caseworker.priya@saathi.org`).
   - `6` Trained Listeners & Counsellors (including **Ananya Rao**, **Kabir Mehta**, and **Dr. Farah Ali** from [`src/data/saathi.ts`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/data/saathi.ts)).
2. **Community & Group Catalog:**
   - **11 Communities:** *Living with loneliness*, *Grief & remembrance*, *Recovery & healing*, *Family & social support*, *Court & case support*, *Dealing with uncertainty*, *Rebuilding after hardship*, *Community & belonging*, *Financial hardship & recovery*, *Safe space for difficult days*, *Finding strength*.
   - **5 Group Chat Threads:** *Living with loneliness*, *Recovery & healing*, *Family & social support*, *Finding strength*, *Grief & remembrance*.
3. **Badges & Milestones:**
   - **24+ Badges** categorized into *Self-care*, *Connection*, and *Community* with specific targets and motifs.
   - **8 Journey Milestones:** *Joined SAATHI*, *First check-in*, *Reached out*, *Connected with someone*, *3 check-ins*, *Found your space*, *7 check-ins*, *Shared support*.
4. **Users & Check-in Patterns:**
   - `20` Seed Users with 3 months (85 days) of realistic, varied check-in histories matching the prototype calendar pattern.
   - **Demonstration Alert User:** `1` user specifically seeded with 5 consecutive "Difficult" check-ins and isolation cues, triggering an active `ATTENTION` alert on the Caseworker Dashboard.

---

## 16. Verification & Acceptance Criteria

### Automated Testing Suite
- **Unit Tests:**
  - Output Guard: Test that phrases like *"You might be experiencing major depressive disorder"* or *"This sounds like generalized anxiety"* are intercepted and sanitized.
  - Distress Signal Rules: Test that 3+ consecutive low/difficult days against an okay baseline produce a `WATCH` or `ATTENTION` signal.
  - Calendar Aggregation: Verify monthly counts, streaks, and Bézier points calculation.
- **Integration & E2E (Supertest):**
  - Verify that sending two `POST /v1/checkins` with the same `localDate` returns `409 Conflict`.
  - Verify that a user cannot access another user's listener conversation.
  - Verify that `RolesGuard` rejects non-caseworkers from `/v1/caseworker/*`.
- **Mobile Flows (Maestro / Detox):**
  - Flow 1: Onboarding → Register → Choose Mood → Warmth Animation → Calendar View.
  - Flow 2: Open Talk → Chat with Companion → Verify typing indicator and companion animation states.
  - Flow 3: Toggle Reduced Motion → Verify animations smoothly disable across mascot and badge displays.

---

*This document and the companion files in [`docs/`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/docs) constitute the complete blueprint for the production engineering phase.*
