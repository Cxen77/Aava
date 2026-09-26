# SAATHI — Cloud Deployment & DevOps Guide

> **Core Constraint:** All environments (Staging and Production) run 100% on managed cloud infrastructure. No local development machines host backend services or databases.

---

## 1. Cloud Infrastructure Overview

```text
┌────────────────────────────────────────────────────────┐
│                   Cloudflare DNS / CDN                 │
│         api.saathi.org          assets.saathi.org      │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
   ┌───────────────────────┐    ┌────────────────────┐
   │ NestJS Backend API    │    │ Cloudflare R2      │
   │ (Render / Railway)    │    │ (S3-Compatible)    │
   └───────────┬───────────┘    └────────────────────┘
               │
       ┌───────┴───────┬─────────────────┐
       ▼               ▼                 ▼
┌──────────────┐ ┌─────────────┐ ┌───────────────┐
│ Neon Server- │ │ Upstash     │ │ Expo Push     │
│ less Postgres│ │ Redis       │ │ Notification  │
│ (with pooling│ │ (Socket.IO  │ │ Gateway       │
│ & migrations)│ │ & BullMQ)   │ └───────────────┘
└──────────────┘ └─────────────┘
```

---

## 2. Mobile App Deployment (Expo & EAS)

### 2.1 Prerequisites
- Expo Application Services (EAS) account
- EAS CLI installed: `npm install -g eas-cli`
- Apple Developer Account (iOS) & Google Play Console Account (Android)

### 2.2 Expo App Configuration (`app.json`)
```json
{
  "expo": {
    "name": "SAATHI",
    "slug": "saathi",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FAF9F6"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "org.saathi.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FAF9F6"
      },
      "package": "org.saathi.app"
    }
  }
}
```
> **Package / Application ID:** `org.saathi.app` (or `com.saathi.app` if your Google Play developer account is under a commercial domain).

### 2.3 EAS Configuration (`eas.json`)
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.saathi.org/v1",
        "EXPO_PUBLIC_WS_URL": "wss://api-staging.saathi.org"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.saathi.org/v1",
        "EXPO_PUBLIC_WS_URL": "wss://api.saathi.org"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@saathi.org",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json"
      }
    }
  }
}
```

### 2.3 Build & OTA Update Commands
```bash
# Build standalone Android APK / AAB
eas build --platform android --profile production

# Build iOS TestFlight IPA
eas build --platform ios --profile production

# Publish Instant Over-the-Air (OTA) JS update without store resubmission
eas update --branch production --message "Update companion expression transitions"
```

---

## 3. NestJS API Deployment (Render / Railway / Fly.io)

### 3.1 Dockerfile (`apps/api/Dockerfile`)
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

COPY . .
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
```

### 3.2 Production Run Command & Prisma Migrations
In the hosting provider dashboard (Render / Railway):
- **Pre-Deploy Command:** `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`
- **Start Command:** `node apps/api/dist/main.js`

---

## 4. Managed PostgreSQL (Neon / Supabase)

1. Provision a PostgreSQL 16+ instance on **Neon** or **Supabase**.
2. Enable connection pooling (`pgbouncer` or Neon Serverless Driver pooler).
3. Set `DATABASE_URL` with SSL mode enabled:
   `postgresql://saathi_user:secret_pass@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/saathi?sslmode=require`
4. Apply migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed initial data:
   ```bash
   npx ts-node apps/api/prisma/seed.ts
   ```

---

## 5. Realtime & Queue (Upstash Redis)

1. Create a serverless Redis database on **Upstash Redis**.
2. Note the TLS connection string: `rediss://default:token@global-upstash.io:6379`.
3. Configure both:
   - Socket.IO Redis Adapter for horizontal WebSocket clustering.
   - BullMQ Queue for asynchronous distress signal analysis and 15-minute cron reminders.

---

## 6. S3-Compatible Object Store (Cloudflare R2)

1. Create a bucket named `saathi-assets` in Cloudflare R2.
2. Generate S3 API tokens with Object Read & Write permissions.
3. Configure CORS policy on the bucket to allow PUT from mobile origins:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 7. Master Environment Variables Matrix

| Variable | Target | Example / Recommended Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | API | `postgresql://...@neon.tech/saathi?sslmode=require` | PostgreSQL pooled connection string |
| `REDIS_URL` | API | `rediss://...@upstash.io:6379` | TLS Redis for Socket.IO & BullMQ |
| `JWT_ACCESS_SECRET` | API | `min-32-char-random-hex-string` | Signs 15-minute access JWTs |
| `JWT_REFRESH_SECRET` | API | `min-32-char-random-hex-string` | Signs 30-day rotating refresh tokens |
| `GOOGLE_CLIENT_ID` | API | `123456-xxx.apps.googleusercontent.com` | Verifies Google ID tokens |
| `AI_PROVIDER` | API | `openai` (or `gemini` / `mock`) | Selects AI companion implementation |
| `OPENAI_API_KEY` | API | `sk-proj-...` | OpenAI API key |
| `GEMINI_API_KEY` | API | `AIzaSy...` | Google Gemini API key |
| `S3_ENDPOINT` | API | `https://<id>.r2.cloudflarestorage.com` | Cloudflare R2 endpoint |
| `S3_BUCKET` | API | `saathi-assets` | Target bucket name |
| `S3_ACCESS_KEY` | API | `r2_access_key_string` | S3 Access Key |
| `S3_SECRET_KEY` | API | `r2_secret_key_string` | S3 Secret Key |
| `EXPO_ACCESS_TOKEN` | API | `expo_token_...` | Expo Push Service authentication |
| `ALERT_THRESHOLDS_JSON` | API | `{"consecutiveLowDays":3,"confidenceCutoff":0.75}` | Distress trigger parameters |
| `EXPO_PUBLIC_API_URL`| Mobile | `https://api.saathi.org/v1` | Public HTTPS REST endpoint |
| `EXPO_PUBLIC_WS_URL` | Mobile | `wss://api.saathi.org` | Public WebSocket endpoint |
