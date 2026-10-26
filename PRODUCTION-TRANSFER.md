# Production transfer · TEST-007 · v102

Approved explicitly by the user on 26 October 2026. Source: Leren.be-test 7f47b45a7a101a4a961cd54741a53a52d8105a0d (TEST-007 v95), including subsequent provenance notes from 21a5843. Production baseline: 74ad2c4.

Transferred: illustrated Ukrainian student cat, welcome/resume, route/exercise hints, teacher labels, supportive retry, thirteen distinct gifts and celebration cards, reduced-motion support, offline assets, four-language release notes.

Required dependencies: the course route engine/UI from TEST-002 and achievements core/UI from TEST-006. The production route is generated from the current production DATA/curriculum (204 lessons, 885 cards), preserving existing IDs and exam additions. The route's beta personal coach and post-lesson dialogue integrations are omitted; TEST-003/004/005 are not transferred. AI exam/chat/voices remain production's current versions.

Production keeps its own Firestore three-way merge and currentDocument.updateTime CAS, account deletion, push, exam module and diphthongs. No beta cloud envelope or beta results are imported. New production keys: leren_path_v1, leren_path_rewards_v1, leren_achievements_v1; existing sync policy includes these. A route merge combines results but retains the current device's resumable lesson rather than merging incompatible answer arrays. No Firebase rule, API key or Worker changes.

Points: existing production scoring retained; route earns +5 per correct answer above a previous best. Reinforcement/giving gifts earns no additional XP. Existing score unlocks corresponding gifts on first load without a barrage of celebration dialogs. Backup v2 includes route, route XP ledger and gifts; old score/store backups remain accepted. Achievements collection is persistent; giving a gift is a visual reaction, not an equipment/room system.

Offline cache: v102, all 61 assets preloaded, including the ~2 MB original transparent cat atlas. Original generation prompts/provenance: img/mascot/ASSETS.md. The illustration atlas/CSS are not a 3D engine.

Checks and deployment receipt: TESTING-JOURNAL.md. Rollback: restore the previous production source with a NEW higher cache/release version; do not erase user progress keys or roll cache versions backwards.

## UI follow-up - v104
User-requested compact mobile layout published 26 October 2026 (4ee9505 / 124d23c): single-row navigation, More menu, expandable placement explanation, progress meter, two-column answers and reduced spacing. Main site verified at 390px; local 320px Ukrainian/Arabic layouts fit above the dock. No learning-data migration or score changes. See TESTING-JOURNAL.md for deployment/check details.

## UI-107 - Focused learning home
Explicitly approved for production by the user on 26 October 2026. Latest production v106 retained as the base; beta untouched. New focused-home module plus route UI, shared speech button integration and responsive navigation. Existing IDs/keys/account and cloud contracts unchanged; no data migration. JS/CSS are in the v107 offline cache. Decisions, checks, limitations and rollout receipt: UX-REVIEW-2026-10-26.md and TESTING-JOURNAL.md.
Final polish release is v108 (7d29f79), including whole-illustration fitting. UI/route JavaScript URLs remain v107; focused CSS/cache/release are v108. No additional migration. Deployment receipt in TESTING-JOURNAL.md.

## UI-109 — Illustrated Tests library
Production-only follow-up requested 26 October 2026. Main Tests entry now groups A1.1 topics 1–6 / 7–12 (A1.2: 1–4 / 5–8), with three generated cat scenes, a progress summary and optional combined tests. Existing tests, IDs, saved bests, pronunciation and gated A1.2 access retained. Four new stable block IDs use existing personal-best scoring and sync; no account/data migration. Source: modules/test-library; assets/prompts: img/tests/ASSETS.md; validation and rollout receipt: TESTING-JOURNAL.md. Beta untouched.
UI-109 shipped as ed3e4f7; Pages deployment40380479285 succeeded. All seven changed live code/image files match the validated source; release/cache109. Final live evidence and checks are recorded in TESTING-JOURNAL.md.
