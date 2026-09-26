# SAATHI mobile UI prototype

## Goal
Build a polished, mobile-first SAATHI prototype at `/` using local mock data only. It will support both User and Listener roles, preserve one ongoing companion conversation in this browser, and avoid all real authentication, AI, database, diagnosis, prediction, and external integrations.

## Experience
- Create a calm premium healthcare visual system with warm-neutral surfaces, deep ink text, one restrained teal accent, subtle borders, compact shadows, accessible type, and consistent 8px-or-less corner radii.
- Present the experience inside a responsive phone-first shell that works naturally on desktop preview and common Android-sized screens.
- Add an original abstract SAATHI mark made from simple interface shapes; no stock or decorative imagery is needed for this product-style mobile interface.

## App structure
- Start with splash, five-step onboarding, language and communication choices, then a mock login with User and Listener entry paths.
- User navigation: Home, Talk, Community, Support, Profile.
- Listener navigation: Home, Requests, Messages, History, Profile.
- Keep secondary screens reachable through natural in-app actions and working back navigation.

## User flows
- Home with daily feeling selector, companion prompt, support availability, journey summary, community preview, notifications, and help entry.
- Guided daily check-in with feeling, day reflection, free text, mock voice state, skip, and local completion state.
- One ongoing SAATHI chat with realistic mock replies, quick responses, typing state, microphone affordance, timestamps, and browser-local history.
- Human-support handoff, listener discovery with filters, listener profiles, connection confirmation, and mock one-to-one chat controls.
- Wellbeing timeline, recent non-diagnostic pattern language, and gentle engagement milestones.
- Community categories, moderated group feed, replies/report controls, and locally created posts with anonymous option.
- Support hub, calm emergency resources, support requests, notifications, profile, privacy explanations, consent controls, and settings.

## Listener flows
- Separate listener entry, dashboard, availability controls, support request queue, accept/decline behavior, active conversation, history, and editable profile presentation.

## Shared states and data
- Keep realistic users, listeners, chats, check-ins, wellbeing history, communities, posts, notifications, and support requests in a dedicated local data module.
- Include representative loading, empty, error, confirmation, and success states without adding backend behavior.
- Persist only prototype preferences, onboarding state, created community posts, check-in state, and the single ongoing companion chat in local browser storage.

## Technical details
- Implement as the existing TanStack React web project rather than replacing the stack with Expo; reproduce the requested native-mobile interaction and layout faithfully in the available live web preview.
- Use reusable components for app shell, headers, navigation, controls, cards, badges, avatars, chat bubbles, status, timeline, modals, and feedback states.
- Use semantic design tokens in the global stylesheet and existing UI controls where applicable.
- Add page-specific metadata for SAATHI, then verify the complete User and Listener paths in the running preview at desktop and narrow mobile widths.
