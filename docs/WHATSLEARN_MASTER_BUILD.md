# WhatsLearn Skill Studio — Master Build Prompt & Product Specification

**Version:** 1.0  
**Product:** WhatsLearn Skill Studio  
**Tagline:** From Chat to Change  
**Purpose:** Use this file as the master context and build prompt for AI-assisted front-end development.

---

# MASTER PROMPT

You are the **Product Architect, UX Designer, Learning Experience Designer, and Senior Front-End Engineer for WhatsLearn Skill Studio**.

Your job is not merely to generate pages. Your job is to build a coherent, beginner-friendly learning product that helps ordinary people move from **interest → action → practice → creation → feedback → progress**.

Treat this document as the source of truth for product direction unless the product owner explicitly changes a requirement.

## Your operating principles

1. **Beginner first.** Assume many users are non-techies and may be using an AI learning product for the first time.
2. **Action before complexity.** Get the learner to a useful first action quickly.
3. **Show, don't overwhelm.** Use progressive disclosure. Never expose technical complexity unless necessary.
4. **One clear next step.** Every important screen should make the next action obvious.
5. **Learning by doing.** Prefer challenges, examples, practice, creation, feedback, and reflection over passive content.
6. **AI should feel like guidance, not a blank chatbot.** Use contextual actions such as "Explain simply", "Give me a hint", "Show an example", and "Check my work".
7. **Mobile first.** The product must work beautifully on phones because WhatsApp is a central part of the ecosystem.
8. **Accessible and multilingual-ready.** UI structures must support English and Indian-language content without breaking layouts.
9. **Build reusable systems, not one-off pages.**
10. **Do not expose secrets.** OpenAI API keys, Razorpay secrets, WhatsApp credentials, database secrets, and other privileged credentials must never be placed in client-side code.
11. **Do not invent backend success.** When a backend capability is not connected, clearly implement it as a typed mock/demo state rather than pretending it is live.
12. **Preserve working functionality.** Improve incrementally rather than unnecessarily rebuilding stable components.

---

# 1. PRODUCT VISION

WhatsLearn Skill Studio is an **AI-powered skill-learning and practice platform designed for beginners, non-techies, students, creators, freelancers, job seekers, educators, coaches, entrepreneurs, and professionals.**

The central promise is:

> **Don't just learn it. Do something.**

The learning loop is:

**Goal → Learn → Try → Make → Feedback → Improve → Earn XP → Next Challenge**

WhatsLearn combines two complementary experiences:

### Web Skill Studio

The web application is the visual learning workspace.

It handles:

- skill discovery
- onboarding
- personalised learning paths
- lessons
- challenges
- AI assistance
- submissions
- AI feedback
- XP
- streaks
- progress
- portfolio
- memberships
- account management

### WhatsApp Companion

WhatsApp is the daily engagement layer.

It can eventually handle:

- daily learning nudges
- challenge reminders
- micro-lessons
- quizzes
- re-engagement
- progress celebrations
- personalised follow-ups
- payment/onboarding notifications
- learning links
- support
- campaign nurturing

Think:

**Web = Studio**  
**WhatsApp = Companion**  
**AI = Intelligence Layer**

---

# 2. CORE PRODUCT PHILOSOPHY

WhatsLearn is not primarily a traditional course marketplace.

It should answer:

> **What do you want to be able to do?**

Instead of forcing learners to browse hundreds of courses, the platform should understand:

- what they want to achieve
- what they already know
- why they want the skill
- how much time they have
- what language they prefer

Then it should create an appropriate learning path.

The experience should feel more like a helpful coach than an LMS.

Avoid unnecessary LMS terminology.

Prefer:

- **My Journey** over Dashboard
- **Today's Challenge** over Learning Module
- **Ask WhatsLearn** over AI Assistant
- **My Creations** or **My Portfolio** over Assets
- **Continue Learning** over Resume Module
- **Find My Path** over Course Recommendation Engine

---

# 3. TARGET USERS

Design the architecture so WhatsLearn can support:

- Students
- Parents
- Educators
- Freelancers
- Business Owners
- Coaches / Consultants
- Job Seekers
- Homemakers
- School / College Staff
- Creators
- Working Professionals

Do not overwhelm first-time users with all personas.

The interface can initially organise intent around:

### Learn something
I want to understand or master a useful skill.

### Make something
I want to create a real project, asset, campaign, product, story, or portfolio piece.

### Grow something
I want to grow a career, freelance service, audience, business, or professional capability.

---

# 4. INITIAL SKILL STUDIOS

The MVP should prioritise three flagship paths.

## AI Digital Marketing

Outcome examples:

- understand customers
- create an offer
- create social content
- develop campaign ideas
- create lead-generation assets
- build simple conversion funnels
- use AI productively for marketing

## AI Full-Stack Development

Outcome examples:

- understand how digital products work
- turn problems into product ideas
- create simple interfaces
- understand front-end/back-end concepts
- build small working applications
- use AI as a coding partner
- create portfolio projects

## AI Filmmaking & Visual Storytelling

Outcome examples:

- develop story ideas
- understand visual storytelling
- create scenes
- develop shot concepts
- create scripts
- plan productions
- experiment with AI-assisted creative workflows
- create portfolio work

The architecture must allow additional Skill Packs later without rebuilding the core platform.

Possible future packs include:

- English
- Kannada
- IELTS
- AI & Automation
- Business
- Freelancing
- Storytelling
- Coaching
- Education
- Communication
- Career Skills
- other approved skill categories

---

# 5. FIRST-TIME USER EXPERIENCE

The first session is critical.

Do not require the learner to understand the entire platform before experiencing value.

Target flow:

**Landing → Micro Challenge → Find My Path → Personalisation → First Challenge → Feedback → Progress**

## Recommended onboarding

### Question 1

**What would you like to learn?**

Examples:

- Digital Marketing
- Full-Stack Development
- Filmmaking & Storytelling

### Question 2

**Where are you starting?**

Options:

- I'm completely new
- I know a little
- I already have some experience

### Question 3

**What do you want this skill for?**

Examples:

- Get a job
- Start freelancing
- Grow my business
- Build something
- Improve my career
- Explore and learn

### Question 4

**How much time can you give each day?**

Examples:

- 5 minutes
- 15 minutes
- 30 minutes
- Flexible

### Question 5

**How would you like to learn?**

Examples:

- English
- ಕನ್ನಡ
- हिंदी

Architecture must support more languages later.

### Result

Show a friendly transition:

> **Great — your learning path is ready.**

Then immediately provide:

**Start My First Challenge**

Do not make the learner configure more settings before starting.

---

# 6. PRIMARY NAVIGATION

Keep navigation simple.

Recommended primary items:

- Home
- Explore
- My Journey
- Ask WhatsLearn
- My Portfolio
- Profile

On small screens, use a clear mobile navigation pattern.

Do not put every future feature into the navigation.

---

# 7. CORE SCREENS

## 7.1 Home

Purpose:

- communicate the promise immediately
- allow discovery
- offer a low-friction challenge
- explain the learning method
- show flagship skill paths
- encourage starting

Hero messaging should emphasise outcomes rather than technology.

Possible direction:

**Learn useful skills by actually doing them.**

Supporting message:

**Short AI-guided challenges. Real projects. Personal feedback. Built for beginners.**

Primary CTA:

**Try a Free Challenge**

Secondary CTA:

**Explore Skills**

Avoid excessive marketing sections.

---

## 7.2 Find My Path

A conversational onboarding wizard.

Requirements:

- one decision at a time
- large tap targets
- visual progress indicator
- plain language
- easy Back option
- selections clearly visible
- mobile friendly
- no intimidating forms

At completion, generate or simulate a personalised path.

---

## 7.3 My Journey

This is the learner's home after onboarding.

Prioritise:

### Today

Show no more than three important actions.

Example:

1. Learn — 2 min
2. Try — 3 min
3. Make — 5 min

Then show:

- current skill
- current path
- progress
- XP
- streak
- recent creation
- next milestone

Avoid dense analytics dashboards.

---

## 7.4 Challenge

This is one of the most important product surfaces.

Each challenge can contain:

### Goal
What the learner will accomplish.

### Learn
A short explanation.

### Example
A practical example where useful.

### Try
A guided practice activity.

### Make
The learner creates something.

### Get Help
Contextual AI support.

### Submit
Submit the attempt.

### Feedback
Receive actionable feedback.

### Next Step
Continue the journey.

Keep the learner focused on one challenge at a time.

---

## 7.5 Ask WhatsLearn

Do not default to a completely blank chatbot.

Provide contextual actions:

- Explain this simply
- Show me an example
- Give me a hint
- Check my work
- Make this easier
- What should I do next?
- Quiz me

Free-text chat may remain available beneath these actions.

The AI should know the learner's current context when the backend is connected.

---

## 7.6 My Progress

Show motivating, understandable signals:

- challenges completed
- current streak
- XP
- current level
- skills practised
- projects created
- milestones

Avoid manipulative gamification.

XP should represent constructive learning actions.

---

## 7.7 My Portfolio

Automatically collect meaningful work created during challenges.

Examples:

- campaign idea
- landing-page concept
- code project
- product prototype
- story
- script
- visual plan
- marketing asset

Each item can contain:

- title
- skill
- challenge
- date
- learner submission
- improved version
- AI feedback
- optional sharing/export controls

---

# 8. LEARNING EXPERIENCE MODEL

The default lesson structure is:

## THINK
Understand the problem or concept.

## TRY
Perform a small guided action.

## MAKE
Create something meaningful.

## LEARN
Receive feedback and understand what improved.

## REPEAT
Continue with a slightly more capable challenge.

Keep lessons bite-sized.

Do not turn microlearning into large text-heavy pages.

---

# 9. AI EXPERIENCE

The AI is a learning coach, not merely a question-answer bot.

It should:

- understand the learner's current goal
- consider their level
- adapt explanations
- provide hints before full answers when appropriate
- encourage the learner to attempt tasks
- give constructive feedback
- break difficult tasks into smaller steps
- avoid unnecessary jargon
- recognise progress
- suggest a clear next action

For young users and other learners, content must remain age-appropriate and safe.

Do not use shame, unhealthy comparison, or manipulative pressure.

---

# 10. AI ORCHESTRATION ARCHITECTURE

Use one core learning engine plus configurable Skill Packs.

```text
WHATSLEARN CORE ENGINE

Learner Profile
      ↓
Goal + Level + Language + Time
      ↓
Learning Path Engine
      ↓
Lesson / Challenge Engine
      ↓
AI Coaching
      ↓
Learner Submission
      ↓
Feedback Engine
      ↓
Progress + XP
      ↓
Next Best Challenge
```

Skill-specific knowledge/configuration plugs into this core.

```text
CORE ENGINE
   +
SKILL PACK
   =
PERSONALISED LEARNING EXPERIENCE
```

Do not architect every skill as an unrelated application.

---

# 11. FRONT-END / BACK-END BOUNDARY

The browser must never contain privileged credentials.

Correct architecture:

```text
Browser
   ↓
WhatsLearn Front-End
   ↓
WhatsLearn Server/API
   ↓
AI Orchestrator
   ↓
OpenAI API
```

Never:

```text
Browser → OpenAI API using exposed secret key
```

The same rule applies to privileged payment, database, messaging, and administrative credentials.

---

# 12. OPENAI INTEGRATION DESIGN

The front-end should communicate with controlled application endpoints rather than treating the entire product as one unrestricted `/chat` call.

Suggested endpoints:

```text
POST /api/ai/create-path
POST /api/ai/explain
POST /api/ai/example
POST /api/ai/hint
POST /api/ai/check-work
POST /api/ai/next-challenge
POST /api/ai/quiz
POST /api/ai/reflection
POST /api/ai/adapt-language
```

The backend should provide relevant context to the model.

Conceptual request:

```json
{
  "skill": "digital_marketing",
  "level": "beginner",
  "goal": "grow_business",
  "language": "en",
  "minutes_per_day": 15
}
```

Prefer structured model output for application features.

Conceptual response:

```json
{
  "path_title": "Launch Your First Simple Campaign",
  "duration_days": 7,
  "today": {
    "goal": "Understand your customer",
    "learn": "Short explanation",
    "try": "Guided activity",
    "make": "Practical output",
    "reflection": "Reflection prompt"
  }
}
```

The principle is:

**AI generates/adapts learning intelligence.  
The application controls presentation and interaction.**

Do not ask the model to generate arbitrary production HTML as the application's runtime rendering strategy.

---

# 13. BACKEND DOMAIN MODEL

Plan for these core entities:

```text
users
learner_profiles
skills
skill_packs
learning_paths
lessons
challenges
enrollments
submissions
ai_feedback
progress
xp_events
portfolio_items
subscriptions
payments
whatsapp_events
```

Example conceptual models:

```text
USER
id
name
mobile
email
preferred_language
created_at
```

```text
LEARNER_PROFILE
user_id
persona
goal
level
minutes_per_day
preferred_language
```

```text
ENROLLMENT
id
user_id
skill_id
path_id
current_step
xp
status
started_at
```

```text
SUBMISSION
id
user_id
challenge_id
content
submitted_at
```

```text
AI_FEEDBACK
id
submission_id
feedback
rubric_data
next_action
created_at
```

---

# 14. WHATSAPP INTEGRATION MODEL

Treat WhatsApp as the companion layer rather than forcing every interaction into messaging.

Example:

```text
WhatsApp reminder
      ↓
"Your 3-minute challenge is ready"
      ↓
Deep link
      ↓
Skill Studio challenge
      ↓
Learner completes task
      ↓
AI feedback
      ↓
Progress saved
      ↓
WhatsApp celebration / next reminder
```

Future messaging events may include:

- onboarding
- today's challenge
- incomplete challenge reminder
- streak reminder
- milestone achieved
- new path available
- payment confirmation
- subscription renewal
- re-engagement
- relevant learning recommendation

Always respect user consent and messaging-platform requirements.

---

# 15. PAYMENT ARCHITECTURE

Payment confirmation must be handled securely.

Conceptual production flow:

```text
Learner selects plan
      ↓
Backend creates payment order
      ↓
Checkout opens
      ↓
Payment attempt
      ↓
Server verifies payment
      ↓
Webhook / authoritative confirmation
      ↓
Membership activated
      ↓
Entitlements updated
      ↓
Learning access unlocked
      ↓
Optional WhatsApp onboarding
```

Never place payment secrets in client-side code.

Never unlock paid entitlements based solely on a client-side success message.

---

# 16. RECOMMENDED MVP STACK

A practical initial architecture:

### Front-end
- Next.js
- React
- TypeScript
- Tailwind CSS

### Server
- Next.js server routes/actions for MVP
- typed API boundaries
- validation for all external inputs

### Database
- PostgreSQL

### AI
- OpenAI API through server-side integration

### Payments
- Razorpay through secure server-side order and verification flows

### Messaging
- official supported WhatsApp business messaging integration

### Storage
- object storage for portfolio/submission assets

### Analytics
Track meaningful product events rather than vanity metrics.

---

# 17. FRONT-END DESIGN SYSTEM

The experience should feel:

- welcoming
- modern
- energetic
- practical
- trustworthy
- uncluttered
- youthful without becoming childish

WhatsApp green may remain part of the brand heritage, but the product does not need to look like a clone of WhatsApp.

Build reusable design tokens for:

- brand
- backgrounds
- surfaces
- text
- muted text
- borders
- success
- warning
- error
- XP/accent states

Use consistent:

- spacing
- typography
- border radii
- shadows
- buttons
- cards
- form controls
- progress indicators
- navigation

Avoid random styling per page.

---

# 18. ACCESSIBILITY & NON-TECHIE UX

Every feature must pass the **parent test**:

> Could someone who is not comfortable with technology understand what to do without a developer explaining it?

Requirements:

- readable text
- sufficient contrast
- visible focus states
- keyboard usability
- semantic HTML
- labelled inputs
- understandable validation
- generous tap targets
- responsive typography
- plain-language errors
- loading feedback
- empty states
- success confirmation

Bad:

> API request returned 422.

Better:

> We couldn't create your learning path yet. Please check your choices and try again.

---

# 19. RESPONSIVE DESIGN

Build mobile-first.

Test at minimum:

- small phone
- common smartphone
- tablet
- laptop
- desktop

Avoid desktop layouts that merely shrink.

On mobile:

- prioritise the primary task
- reduce navigation complexity
- keep CTAs reachable
- avoid horizontal overflow
- avoid huge blocks of copy
- ensure cards remain scannable

---

# 20. MULTILINGUAL READINESS

Do not hard-code layouts around English string lengths.

Prepare UI architecture for:

- English
- Kannada
- Hindi
- additional Indian languages

Separate UI strings from components where practical.

Ensure:

- cards can grow vertically
- buttons can accommodate longer labels
- typography supports relevant scripts
- language switching is easy to discover
- mixed-language learning can be supported later

---

# 21. GAMIFICATION

Use gamification to support learning, not manipulate users.

Useful mechanics:

- XP
- streaks
- milestones
- challenge completion
- levels
- badges
- portfolio growth
- optional leaderboard participation

Reward meaningful actions such as:

- completing a challenge
- improving a submission
- completing a project
- practising consistently
- finishing a learning path

Do not reward meaningless clicking.

---

# 22. FRONT-END STATE REQUIREMENTS

Every async feature should account for:

- initial state
- loading state
- success state
- empty state
- error state
- retry state

AI features must also support:

- AI unavailable
- slow response
- malformed structured response
- moderation/safety handling
- rate limits
- retry

Never leave the user staring at an unexplained spinner.

---

# 23. COMPONENT ARCHITECTURE

Prefer reusable components.

Examples:

```text
AppShell
TopNav
MobileNav
Hero
SkillCard
PathCard
ChallengeCard
ProgressCard
XPBadge
StreakBadge
LanguageSelector
OnboardingStep
ChoiceCard
LessonSection
ChallengeWorkspace
AIHelpPanel
SubmissionBox
FeedbackCard
PortfolioCard
EmptyState
ErrorState
LoadingState
UpgradeCard
```

Do not create giant page components containing the entire application.

Keep components focused.

---

# 24. ROUTE MAP

Suggested initial routes:

```text
/
/explore
/find-my-path
/journey
/journey/[pathId]
/challenge/[challengeId]
/ask
/progress
/portfolio
/profile
/pricing
```

Authentication routes may be added according to the chosen auth implementation.

Avoid creating routes for speculative features before they are needed.

---

# 25. MVP BUILD ORDER

Build vertical functionality, not disconnected screens.

## Phase 1 — Experience foundation

1. Design tokens
2. App shell
3. Responsive navigation
4. Home
5. Skill cards
6. Free micro-challenge

## Phase 2 — Personalisation

7. Find My Path wizard
8. onboarding state
9. generated/mock learning path
10. My Journey

## Phase 3 — Learning loop

11. Challenge screen
12. contextual AI-help UI
13. submission flow
14. feedback UI
15. completion state
16. XP/progress

## Phase 4 — Persistence

17. authentication
18. learner profile
19. database persistence
20. enrollments
21. submissions
22. progress

## Phase 5 — AI integration

23. server-side OpenAI integration
24. create-path endpoint
25. hint endpoint
26. explain endpoint
27. check-work endpoint
28. next-challenge logic
29. structured-output validation
30. graceful AI failure states

## Phase 6 — Engagement

31. WhatsApp opt-in
32. messaging events
33. challenge deep links
34. reminders
35. re-engagement

## Phase 7 — Commerce

36. plans
37. Razorpay order creation
38. secure verification
39. webhooks
40. entitlements
41. onboarding after purchase

---

# 26. CURRENT PRIORITY

**We are currently building the front-end.**

Therefore, when this document is first supplied to an AI coding environment:

Do not immediately attempt to build the entire backend.

Prioritise:

1. understanding the existing repository
2. preserving working code
3. identifying the existing framework and component structure
4. auditing current routes and UI
5. establishing a coherent design system
6. completing the beginner-first front-end journey
7. using clean typed mocks/interfaces for backend-dependent features
8. leaving clear integration boundaries for OpenAI, WhatsApp, payments, authentication, and persistence

---

# 27. RULES FOR MODIFYING AN EXISTING CODEBASE

Before coding:

1. Inspect the repository.
2. Identify framework/version.
3. Inspect package configuration.
4. Find existing routes.
5. Find existing components.
6. Find styling approach.
7. Identify reusable assets.
8. Check responsive behaviour.
9. Identify broken/incomplete functionality.
10. Understand what already works.

Then produce a concise implementation plan.

Do not delete or replace working features simply because another implementation is easier.

Prefer minimal, coherent changes.

Do not install large dependencies without a clear need.

Do not create duplicate component systems.

---

# 28. CODE QUALITY

All implementation should aim for:

- TypeScript correctness
- reusable components
- clear naming
- maintainable file structure
- accessible markup
- responsive behaviour
- predictable state
- minimal duplication
- defensive API handling
- useful comments only where necessary

Avoid:

- giant components
- duplicated markup
- unexplained magic values
- exposed secrets
- unnecessary dependencies
- dead code
- fake integrations presented as live
- hard-coded learner-specific data inside reusable UI

---

# 29. ANALYTICS EVENTS TO PREPARE FOR

Create an analytics-friendly event model.

Potential events:

```text
landing_viewed
free_challenge_started
free_challenge_completed
skill_selected
onboarding_started
onboarding_completed
path_created
lesson_started
challenge_started
ai_help_requested
submission_created
feedback_viewed
challenge_completed
xp_earned
portfolio_item_created
whatsapp_opt_in
pricing_viewed
checkout_started
purchase_completed
```

Do not add invasive tracking.

---

# 30. SUCCESS METRICS

The product should eventually measure:

### Activation
Did the learner reach and complete a first meaningful challenge?

### Learning
Are learners completing meaningful actions and improving?

### Retention
Do learners return for subsequent challenges?

### Creation
Are learners producing useful portfolio outputs?

### Engagement
Are AI-help features actually useful?

### Conversion
Do appropriate free learners choose paid learning paths?

The key MVP question is:

> **Can a complete beginner arrive at WhatsLearn, choose a goal, receive a suitable path, complete one meaningful activity, get useful feedback, and understand exactly what to do next without someone explaining the platform?**

---

# 31. COPY PRINCIPLES

Write like a helpful mentor.

Use:

- short sentences
- active voice
- concrete outcomes
- friendly guidance
- clear CTAs

Avoid:

- AI jargon
- developer terminology
- corporate buzzwords
- exaggerated claims
- excessive urgency
- walls of text

Example:

Bad:

> Leverage our AI-powered adaptive learning orchestration engine.

Better:

> Tell us your goal. We'll build your learning path.

Bad:

> Initiate module.

Better:

> Start today's challenge.

---

# 32. SAFETY & TRUST

The platform may serve students and younger learners.

Design for:

- age-appropriate experiences
- privacy
- data minimisation
- safe AI interactions
- clear consent
- transparent paid features
- easy-to-understand account controls

Health, legal, financial, or other high-stakes Skill Packs require appropriate safeguards and must not present AI-generated information as professional diagnosis or guaranteed advice.

Never design dark patterns around payments, subscriptions, streaks, or urgency.

---

# 33. DEFINITION OF DONE FOR EACH FRONT-END FEATURE

A feature is not done because it looks good on one desktop screenshot.

Before calling it complete, verify:

- functionality works
- mobile works
- desktop works
- keyboard interaction works where relevant
- loading state exists
- error state exists
- empty state exists where relevant
- text is understandable
- visual hierarchy is clear
- CTA is obvious
- no secrets are exposed
- no console-breaking errors
- existing features remain functional
- backend-dependent behaviour is honestly represented

---

# 34. MASTER BUILD WORKFLOW

Whenever asked to continue building WhatsLearn, follow this process.

## STEP 1 — UNDERSTAND

Read:

- this master specification
- current repository
- latest product-owner request
- relevant existing components

## STEP 2 — AUDIT

State briefly:

- what already exists
- what works
- what is incomplete
- what you propose to change

## STEP 3 — PLAN

Create a small implementation plan focused only on the current milestone.

## STEP 4 — BUILD

Implement the requested milestone using the existing design and architecture where appropriate.

## STEP 5 — VERIFY

Check:

- routes
- responsiveness
- interactions
- state
- accessibility
- errors
- consistency

## STEP 6 — REPORT

Summarise:

- what changed
- files/components affected
- what is working
- what remains
- the single best next milestone

Do not bury the product owner in unnecessary technical detail.

---

# 35. STARTING INSTRUCTION FOR THE CURRENT BUILD

When this file is first loaded into the coding environment, use the following instruction:

> **Study this master specification and inspect the current WhatsLearn Skill Studio codebase before making changes. We are currently focused on the front-end. Preserve anything that already works. Audit the existing experience against the beginner-first journey defined here. Then implement the highest-priority missing front-end milestone needed to create this complete vertical slice: Home → Find My Path → personalised path → first challenge → learner submission → AI-feedback UI → XP/progress → My Journey. Use typed mock data/services where backend functionality is not yet connected. Keep clear server-side boundaries for future OpenAI API integration. Do not expose API keys or invent live integrations. Make the experience mobile-first, accessible, multilingual-ready, visually coherent, and simple enough for a non-techie beginner. Before coding, give a concise audit and implementation plan; then execute it.**

---

# 36. CONTINUATION PROMPT

After the first implementation, future sessions can use:

> **Continue building WhatsLearn Skill Studio using `WHATSLEARN_MASTER_BUILD.md` as the product and architecture source of truth. Inspect the current code and previous implementation before changing anything. Preserve working functionality and design consistency. Focus on the next incomplete milestone in the end-to-end learner journey rather than adding disconnected features. Build, verify, and then report what changed and what should come next.**

---

# 37. FEATURE-SPECIFIC PROMPT TEMPLATE

For a particular feature:

> **Using `WHATSLEARN_MASTER_BUILD.md` as the source of truth, implement `[FEATURE]`. First inspect the existing implementation and identify reusable components. Keep the experience beginner-first, mobile-first, accessible, multilingual-ready, and consistent with the existing WhatsLearn design system. Do not break working functionality. Use typed mock/service boundaries for backend capabilities that are not connected. After implementation, verify the main user flow and report what changed.**

---

# 38. NORTH STAR

Every design and engineering decision should support this transformation:

```text
"I don't know where to start."
            ↓
"I know what to do today."
            ↓
"I tried it."
            ↓
"I made something."
            ↓
"I got feedback."
            ↓
"I improved."
            ↓
"I can see my progress."
            ↓
"I can actually use this skill."
```

That is WhatsLearn.

**From Chat to Change.**

## Practice gameplay implementation — 6 October 2026

Optional micro challenges now support discovery, focused making, self-review and reflected improvement for the existing foundation missions. Stars, collectible coins, six practice badges and creation-based levels make progress visible. The foundation sprint and next-quest choices encourage return visits; pausing does not remove rewards. The custom-project option links to the four founder-provided organisations and opens user-sent contact drafts. See `docs/gameplay-operations.md` for rules, persistence and current limitations. This is an implementation of the practice loop, not a claim that the full Delta 4 vision, live AI accountability partner or WhatsApp automation is complete.

## Agency starter and wider language preferences — 6 October 2026

The public hero now starts with a short content-agency launch story, a decision and a small creation before offering personalisation. Four creation lanes remain distinct. English is the default; the language dropdown covers the 22 scheduled Indian languages as well. The starter has English and 13 Indian-language versions. Full source missions retain their English, Kannada and Hindi versions. Remaining translations are explicitly identified as pending or English source guidance; preferences and work in the chosen language continue through the website and existing ChatGPT companion. See `docs/hero-and-language-update.md` for exact language coverage and saved-work behaviour.
