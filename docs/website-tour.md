# Website tour

The bottom-left **Take a tour** button explains the real website controls. Guests see course discovery, the starter and the sign-in link before the learning sections. Signed-in learners start at My Journey.

The tour covers the mission entry, review process, 10-day roadmap, My Creations, editable journey settings, language, WhatsApp linking and the optional ChatGPT Companion. Next and Back retain the tour across page navigation. Skip, Close and Escape end it. Keyboard focus stays inside the tour card and returns to its launcher on close.

On My Journey, an account with submitted personal setup receives a dismissible invitation once per account in that browser. A browser-local marker records dismissal; it does not modify personal setup answers. Replay remains available. The invitation waits while a mission dialog is open.

Inside an open mission, **Tour this screen** explains and outlines only controls available at that stage, including the actual work field, Review my work and evaluation button. It never fills answers, advances mission stages, submits work, connects WhatsApp or starts authentication. The main tour explains sign-in by highlighting the existing link, without visiting an automatic host-authentication redirect.

The layout keeps the existing white/green palette, uses a compact card on phones and avoids the bottom-right mentor launcher. No payment routes are part of the tour.

Validation for this change: TypeScript and production build, code review, and local browser inspection of launching, Next across pages, Skip, and the contextual mission help entry. Browser access was subsequently disabled in Work settings; final mobile visual inspection remains pending. Existing payment checks were not run.
