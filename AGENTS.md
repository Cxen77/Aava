<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep SAATHI as a single-route, state-driven mobile prototype because Phase 1 is UI-only and must not add backend or production navigation complexity.
- Keep all prototype datasets in `src/data/saathi.ts` so screens remain presentation-focused and later backend replacement stays straightforward.
- Keep group conversations distinct from community post browsing: Talk uses locally persisted message threads while Community owns discovery/posts, so joining can reveal a conversation without conflating content types.
- Use Motion for new chat, journey, and badge transitions, respecting reduced motion; keep existing CSS motion elsewhere to avoid a broad visual rewrite.
- Keep the companion SVG and illustrated badge artwork reusable in focused components, so Home and Profile share one identity without adding image dependencies.
- Drive the chat companion from explicit conversation UI events, not message sentiment, so future real chat can trigger distinct animations without pretending to diagnose feelings.
- Record at most one check-in per local calendar day while allowing repeat visits, so warmth counts reflect daily participation rather than button taps.
- Store optional check-in reminder preferences locally and show reminders only while the app is open, so Phase 1 stays honest about lacking push notifications.
- Keep SAATHI notifications as a UI-only component (`SaathiNotification`) fed by data in `src/data/notifications.ts`, so a real delivery system can plug in later without redesign.
- Keep check-in history (mock months plus locally saved daily moods) in `src/data/checkins.ts`, shown by `CheckinCalendar`, so a real history API can replace it later without UI changes.
