# Practice-led gameplay — 6 October 2026

WhatsLearn exists to turn intention into useful creations: **From Chat to Change**. The web is the Studio; WhatsApp is the Companion. Personal goals, starting level, language, available time and self-review shape the existing next-mission guidance. This release supports an active habit: discover a decision, make a creation, review it, celebrate, and choose the next mission or improve an earlier one. A learner can pause without losing rewards.

## Implemented scope

Four separate programmes remain: AI Digital Marketing, AI Full-Stack Development, AI Filmmaking (Hybrid Filmmaking), and AI-powered Visual Storytelling. Each existing foundation mission has a short optional discovery challenge, a checklist-based focus choice, and a reflected revision quest. Discovery questions and clues are available in English, Kannada and Hindi. Existing assessment questions, correct answers, rubrics, pricing and access are unchanged.

The journey shows a foundation sprint map, creation stars, a collection of six practice badges, a level and the next small goal. These are practice signals, not independently assessed competence. Suggestions to return come from unfinished work and opportunities to improve. There are no streak-loss penalties, random reward mechanics, public leaderboards or rewards for time spent watching.

## Reward rules

- Discovery: one collectible coin for a correct mini challenge, once per mission.
- First creation: ten collectible coins and the existing 50 practice XP, once per saved mission.
- First revision: five collectible coins and a revision star, once per mission, only when previously saved text changes and a reflection contains at least 12 trimmed characters. This records participation, not the quality of the change.
- Three stars per mission: saved work, self-review of at least four checklist items, first reflected revision.
- Levels from distinct saved creations: Explorer (0), Maker (1), Builder (3), Creator (6).
- Badges: First Maker, Thoughtful Reviewer, Better Each Time, Sprint Builder (current programme), Curious Explorer (two programmes), Back for More (three different practice dates).
- Coins are collectibles with no monetary, discount or access value. Repeated submissions do not multiply coins, XP or revision rewards.

Signed-in records are scoped to the authenticated learner. D1 batches record work and eligible reward events together. A compound user/event key prevents duplicate awards. Practice dates are counted in Asia/Kolkata; one daily event preserves return-day history when a creation is edited later. Existing work earns first-save collectibles; historical revisions/dates are not fabricated. Guests use the existing device-local mode and a separate reward key. Guest work and rewards are not merged into an account on sign-in.

Only event IDs, mission IDs, kinds and timestamps are added; revision explanations are used to validate the attempt but are not retained. The custom-project dialog holds its brief in memory and opens a draft for the learner to send themselves to the existing team contact. It does not send messages or enrol the learner. Project scope, support and fees are discussed with the team.

## Team routes

- BrandMint AI — https://brandmintai.io/ — custom AI solutions and projects, including visual storytelling.
- InstaSkills — https://instaskills.academy/ — AI digital marketing.
- FullAI — https://fullai.in/ — AI full-stack development.
- AI Filmmaking — https://aifilmmaking.tech/ — hybrid filmmaking.

Contact remains `connect@brandmintai.io` and WhatsApp `+91 99729 65677`. The project option appears on the public page, completed path finder and learner journey.

## Boundaries and follow-up

No broad animation or video production is added. Selected key concepts can later use lightweight HTML/CSS/SVG interaction with a compressed square MP4 trigger linking to the lesson. Gamification supports creation and reflection rather than replacing them. Live AI assessment, automated WhatsApp delivery, proactive accountability reminders, team competitions and a fully adaptive mastery system are not implemented by this release. The personalised guidance remains the existing rules-based preview.

Validation includes duplicate-award handling, Indian practice-day boundaries, reward eligibility, database ownership and atomic rollback, TypeScript and production build checks. New database schema is an additive migration; earlier migrations are immutable.
