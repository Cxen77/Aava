# SAATHI — REST API & Realtime Gateway Specification

> **Base URL:** `https://api.saathi.example.com/v1`  
> **WebSocket URL:** `wss://api.saathi.example.com`  
> **Standard Response Format:** All responses are wrapped in a standard JSON envelope.

```json
{
  "data": { ... },
  "error": null
}
```
Or when an error occurs:
```json
{
  "data": null,
  "error": {
    "code": "ERR_RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found.",
    "details": []
  }
}
```

---

## 1. Authentication & Session Management

### 1.1 `POST /v1/auth/register`
Creates a new account and returns the authenticated session.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "Aarav",
  "language": "English",
  "communication": "Both",
  "consentSafetyReview": true
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "user": {
      "id": "c8d1933e-5e36-4c8d-b94f-f131a48c69f2",
      "email": "user@example.com",
      "roles": ["USER"],
      "profile": {
        "displayName": "Aarav",
        "language": "English",
        "communication": "Both",
        "avatarUrl": null
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "d8f0709b-64ec-4008-8f66-1e6eaeeaece2",
      "expiresIn": 900
    }
  },
  "error": null
}
```

### 1.2 `POST /v1/auth/login`
Authenticates existing credentials.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):** Same as Register.

### 1.3 `POST /v1/auth/google`
Verifies a Google OAuth ID token from `expo-auth-session`.
- **Access:** Public
- **Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "language": "English"
}
```
- **Response (200 OK):** Same as Register.

### 1.4 `POST /v1/auth/firebase-google`
Verifies a Firebase Google ID token using Firebase Admin SDK, finding or creating the user and establishing an application session.
- **Access:** Public
- **Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```
- **Response (200 OK):**
```json
{
  "session": {
    "id": "c8d1933e-5e36-4c8d-b94f-f131a48c69f2",
    "firebaseUid": "k3f8s9d7f6s5...",
    "email": "user@gmail.com",
    "displayName": "Aarav Sharma",
    "photoUrl": "https://lh3.googleusercontent.com/a/...",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1Ni..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.4 `POST /v1/auth/refresh`
Rotates the refresh token and returns a new 15-minute access JWT.
- **Access:** Public (Requires valid Refresh Token)
- **Request Body:**
```json
{
  "refreshToken": "d8f0709b-64ec-4008-8f66-1e6eaeeaece2"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "f2e96d11-54b9-411a-a82a-2a4d339e144c",
    "expiresIn": 900
  },
  "error": null
}
```

### 1.5 `POST /v1/auth/logout`
Revokes active refresh token.
- **Access:** Authenticated (Bearer JWT)
- **Response (200 OK):** `{ "data": { "success": true }, "error": null }`

---

## 2. User Profile & Preferences

### 2.1 `GET /v1/me`
Retrieves current user identity, roles, profile, and preferences.
- **Access:** Authenticated

### 2.2 `PATCH /v1/me/profile`
Updates user profile settings.
- **Request Body:**
```json
{
  "displayName": "Aarav Sharma",
  "about": "Finding space for quiet moments.",
  "language": "English & Hindi",
  "communication": "Text & voice"
}
```

### 2.3 `POST /v1/me/avatar`
Generates a presigned S3/R2 upload URL.
- **Request Body:** `{ "contentType": "image/jpeg" }`
- **Response (200 OK):**
```json
{
  "data": {
    "uploadUrl": "https://saathi-assets.r2.cloudflarestorage.com/avatars/user-id.jpg?X-Amz-Signature=...",
    "fileKey": "avatars/user-id.jpg"
  },
  "error": null
}
```

### 2.4 `GET /v1/me/preferences` & `PUT /v1/me/preferences`
Retrieves and updates check-in reminder preferences.
- **Request Body (PUT):**
```json
{
  "reminderEnabled": true,
  "reminderTime": "20:30",
  "reminderDays": [1, 2, 3, 4, 5],
  "timezone": "Asia/Kolkata",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "reducedMotion": false,
  "pausedUntil": null
}
```

---

## 3. Daily Check-ins & Calendar

### 3.1 `POST /v1/checkins`
Records a daily check-in. Strictly enforces at most 1 check-in per user per local calendar day.
- **Access:** Authenticated
- **Request Body:**
```json
{
  "localDate": "2026-09-26",
  "mood": "GOOD",
  "rawChoice": "Good",
  "note": "Had a long walk and felt lighter."
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "id": "e45a2789-7cfc-43db-8ad4-1b472e3b2e59",
    "localDate": "2026-09-26",
    "mood": "GOOD",
    "rawChoice": "Good",
    "note": "Had a long walk and felt lighter.",
    "warmthStreak": 6,
    "newBadgeEarned": "Staying Connected"
  },
  "error": null
}
```
- **Error (409 Conflict):** If a check-in already exists for `localDate`.
```json
{
  "data": null,
  "error": {
    "code": "ERR_ALREADY_CHECKED_IN",
    "message": "You have already completed your check-in for this date."
  }
}
```

### 3.2 `GET /v1/checkins/today`
Returns the status of today's check-in.
- **Response (200 OK):**
```json
{
  "data": {
    "completed": true,
    "warmthStreak": 6,
    "todayCheckIn": {
      "localDate": "2026-09-26",
      "mood": "GOOD",
      "rawChoice": "Good",
      "note": "Had a long walk and felt lighter."
    }
  },
  "error": null
}
```

### 3.3 `GET /v1/checkins/calendar?month=YYYY-MM`
Returns calendar entries, daily activity flags, and trend summary for the specified month.
- **Response (200 OK):**
```json
{
  "data": {
    "days": [
      {
        "date": "2026-09-01",
        "mood": "GOOD",
        "rawChoice": "Good",
        "note": "Slept well and the morning felt easy.",
        "activity": {
          "saathi": true,
          "listener": false,
          "community": true,
          "support": false
        }
      },
      {
        "date": "2026-09-02",
        "mood": "OKAY",
        "rawChoice": "Okay",
        "note": "A regular day, nothing big.",
        "activity": {
          "saathi": false,
          "listener": false,
          "community": false,
          "support": false
        }
      }
    ],
    "summary": {
      "count": 22,
      "mostCommon": "Good",
      "streak": 6,
      "difficultShare": 0.14
    }
  },
  "error": null
}
```

---

## 4. AI Companion & Conversations

### 4.1 `POST /v1/ai/chat` (Streaming SSE)
Sends a message to the SAATHI companion. Streams the supportive response tokens over Server-Sent Events.
- **Access:** Authenticated
- **Rate Limit:** 30 requests / minute
- **Request Body:**
```json
{
  "conversationId": "optional-uuid-to-continue-existing",
  "message": "I've been feeling overwhelmed with work and family expectations today."
}
```
- **Stream Output (Server-Sent Events):**
```text
event: token
data: {"token": "Thank"}

event: token
data: {"token": " you"}

event: token
data: {"token": " for"}

event: token
data: {"token": " sharing"}

event: done
data: {"conversationId": "a901-...", "companionExpression": "supportive"}
```

### 4.2 `GET /v1/ai/conversations`
Retrieves the user's AI companion conversation history.

---

## 5. Listeners & Support Requests

### 5.1 `GET /v1/listeners`
Returns verified human listeners and counsellors with live availability status.
- **Response (200 OK):**
```json
{
  "data": [
    {
      "id": "ananya",
      "name": "Ananya Rao",
      "initials": "AR",
      "role": "Trained listener",
      "languages": ["Hindi", "English"],
      "topics": ["Loneliness", "Grief", "Social isolation"],
      "availability": "Available now",
      "bio": "I offer a calm, judgment-free space where you can share at your own pace."
    }
  ],
  "error": null
}
```

### 5.2 `POST /v1/listeners/:id/request`
Requests a 1:1 chat session with a listener.
- **Request Body:**
```json
{
  "topic": "Loneliness",
  "note": "Looking for someone to talk to about moving to a new city."
}
```

### 5.3 `POST /v1/support/request`
Submits an urgent or formal support/counselling request.
- **Request Body:**
```json
{
  "kind": "COUNSELLOR",
  "message": "Would like to schedule a session regarding grief support."
}
```

---

## 6. Groups & Communities

### 6.1 `GET /v1/groups` & `POST /v1/groups/:id/join`
Browse and join topic-based support groups.

### 6.2 `GET /v1/groups/:id/messages`
Retrieves paginated chat history for a group conversation.
- **Query Params:** `?limit=50&before=2026-09-26T10:00:00Z`

### 6.3 `POST /v1/groups/:id/messages`
Sends a message to the group. Subject to automated moderation screening before insertion. Broadcasted via Socket.IO.
- **Request Body:** `{ "body": "Taking things one day at a time has helped me." }`

### 6.4 `GET /v1/communities` & `GET /v1/communities/:id/posts`
Browse communities and read posts.

### 6.5 `POST /v1/communities/:id/posts`
Creates a new community discussion post.
- **Request Body:**
```json
{
  "title": "The quiet parts of the day",
  "body": "Some days loneliness feels heavier than usual. Does anyone have a small thing that helps?",
  "anonymous": true
}
```

### 6.6 `POST /v1/posts/:id/comments` & `POST /v1/posts/:id/reactions`
Comment or add a warmth reaction (`"like"`, `"heart"`, `"warmth"`).

---

## 7. Journey & Badges

### 7.1 `GET /v1/journey`
Retrieves the 8 milestone stages and user progress.
- **Response (200 OK):**
```json
{
  "data": {
    "completedMilestones": 5,
    "totalMilestones": 8,
    "nextMilestone": {
      "name": "Found your space",
      "requirement": "Join a community",
      "section": "community",
      "progress": 0,
      "target": 1
    }
  },
  "error": null
}
```

### 7.2 `GET /v1/badges/me`
Retrieves earned badges and locked badge progress.
- **Response (200 OK):**
```json
{
  "data": {
    "earned": [
      {
        "id": "first-step",
        "name": "First Step",
        "theme": "Self-care",
        "description": "You made space for your first check-in.",
        "earnedAt": "2026-09-01T08:30:00Z",
        "motif": "sunrise"
      }
    ],
    "locked": [
      {
        "id": "staying-connected",
        "name": "Staying Connected",
        "theme": "Self-care",
        "description": "You made space for seven check-ins.",
        "progress": 6,
        "target": 7,
        "motif": "leaf"
      }
    ]
  },
  "error": null
}
```

---

## 8. Caseworker & Moderation

### 8.1 `GET /v1/caseworker/alerts`
Lists triage alerts.
- **Access:** Caseworker or Admin (`@Roles(Role.CASEWORKER, Role.ADMIN)`)
- **Query Params:** `?status=NEW&limit=20`

### 8.2 `PATCH /v1/caseworker/alerts/:id`
Updates alert triage state.
- **Request Body:**
```json
{
  "status": "REVIEWING", // "NEW" | "REVIEWING" | "CONTACTED" | "RESOLVED" | "DISMISSED"
  "notes": "Reviewed check-in notes. Reached out via support notification."
}
```

### 8.3 `POST /v1/reports`
Submits a moderation report on inappropriate content.
- **Request Body:**
```json
{
  "targetType": "POST",
  "targetId": "post-uuid",
  "reason": "Harassment or inappropriate language"
}
```

---

## 9. Realtime Socket.IO Gateway

### Namespaces & Authentication
Connect with Bearer JWT:
```typescript
import { io } from "socket.io-client";

const socket = io("wss://api.saathi.example.com/chat", {
  auth: { token: accessToken }
});
```

### Event Catalog

| Namespace | Event Name | Direction | Payload |
| :--- | :--- | :--- | :--- |
| `/chat`, `/groups` | `typing:start` | Client → Server | `{ "roomId": "group-123" }` |
| `/chat`, `/groups` | `typing:stop` | Client → Server | `{ "roomId": "group-123" }` |
| `/chat`, `/groups` | `typing:update` | Server → Client | `{ "roomId": "group-123", "userId": "...", "displayName": "Ananya" }` |
| `/chat`, `/groups` | `message:new` | Server → Client | `{ "message": { "id": "...", "body": "...", "sender": { ... } } }` |
| `/chat` | `message:read` | Client ↔ Server | `{ "conversationId": "...", "readUpToMessageId": "..." }` |
| `/` | `notification:new` | Server → Client | `{ "notification": { "type": "badge", "title": "...", "body": "..." } }` |
