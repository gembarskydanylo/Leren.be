# Production transfer · TEST-007 · v102

Approved explicitly by the user on 26 October 2026. Source: Leren.be-test 7f47b45a7a101a4a961cd54741a53a52d8105a0d (TEST-007 v95), including subsequent provenance notes from 21a5843. Production baseline: 74ad2c4.

Transferred: illustrated Ukrainian student cat, welcome/resume, route/exercise hints, teacher labels, supportive retry, thirteen distinct gifts and celebration cards, reduced-motion support, offline assets, four-language release notes.

Required dependencies: the course route engine/UI from TEST-002 and achievements core/UI from TEST-006. The production route is generated from the current production DATA/curriculum (204 lessons, 885 cards), preserving existing IDs and exam additions. The route's beta personal coach and post-lesson dialogue integrations are omitted; TEST-003/004/005 are not transferred. AI exam/chat/voices remain production's current versions.

Production keeps its own Firestore three-way merge and currentDocument.updateTime CAS, account deletion, push, exam module and diphthongs. No beta cloud envelope or beta results are imported. New production keys: leren_path_v1, leren_path_rewards_v1, leren_achievements_v1; existing sync policy includes these. A route merge combines results but retains the current device's resumable lesson rather than merging incompatible answer arrays. No Firebase rule, API key or Worker changes.

Points: existing production scoring retained; route earns +5 per correct answer above a previous best. Reinforcement/giving gifts earns no additional XP. Existing score unlocks corresponding gifts on first load without a barrage of celebration dialogs. Backup v2 includes route, route XP ledger and gifts; old score/store backups remain accepted. Achievements collection is persistent; giving a gift is a visual reaction, not an equipment/room system.

Offline cache: v102, all 61 assets preloaded, including the ~2 MB original transparent cat atlas. Original generation prompts/provenance: img/mascot/ASSETS.md. The illustration atlas/CSS are not a 3D engine.

Checks and deployment receipt: TESTING-JOURNAL.md. Rollback: restore the previous production source with a NEW higher cache/release version; do not erase user progress keys or roll cache versions backwards.
