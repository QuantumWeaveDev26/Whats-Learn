# Performance reminders and Star Learner

- Daily performance recaps replace the existing lesson nudge at the learner's chosen India-time hour. Existing weekday/weekly preferences are respected, never silently changed. Quiet hours, verified opt-in, STOP and one claimed slot per day remain enforced.
- PERFORMANCE (or STATS) returns the same saved-account progress on demand. It does not consume AI allowance or award points.
- The recap shows today's mission points, last seven days, current streak, course progress and Star Learner progress. Learners who already finished today still get their recap.
- Star Learner requires all ten missions in one course, all scored 100 with no clues, on ten consecutive India-time days. Missing/unscored work, one lower score, one clue or a missed day does not qualify. Existing course titles and reward entitlements are unchanged.

## Approved template required outside the 24-hour service window

The existing lesson reminder template must not be reused with different parameters. Request approval in Meta WhatsApp Manager for a performance template such as `whatslearn_performance`, language `en`, with this body:

Your WhatsLearn learning update:
Today: {{1}} mission points.
Current streak: {{2}} days.
Course progress: {{3}}/10 missions saved.
Last 7 days: {{4}} missions.
Reply PERFORMANCE for your full recap or REMIND OFF to pause.

Example parameters: 100, 3, 3, 3. Meta decides the approved template category.

After approval, set WHATSAPP_PERFORMANCE_TEMPLATE to its exact approved name in Hostinger. WHATSAPP_TEMPLATE_LANGUAGE must match its approved language. No API token changes are needed. Existing n8n reminder workflow already accepts template names and parameter arrays from the signed server response.

Until configured, outside-window recaps are skipped with skipped_no_performance_template; no unapproved message is sent. Settings shows this limitation. Inside-window text and the on-demand PERFORMANCE command work immediately. Template configuration alone does not verify Meta approval or delivery; check actual provider status after setup.
