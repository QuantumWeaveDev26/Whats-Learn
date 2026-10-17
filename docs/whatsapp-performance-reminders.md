# Performance reminders and Star Learner

- Daily performance recaps replace the existing lesson nudge at the learner's chosen India-time hour. Existing weekday/weekly preferences are respected, never silently changed. Quiet hours, verified opt-in, STOP and one claimed slot per day remain enforced.
- PERFORMANCE (or STATS) returns the same saved-account progress on demand. It does not consume AI allowance or award points.
- The recap shows today's mission points, last seven days, current streak, course progress and Star Learner progress. Learners who already finished today still get their recap.
- Star Learner requires ten completed useful creations in one course. Clues, lower scores and breaks do not remove eligibility. Existing reward accounting is unchanged.

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


## Preferred short progress template

Create a new template named `whatslearn_progress_v2`, with language English (`en`) and exactly two body variables:

```text
{{1}}/10 creations saved ✅
Next: {{2}}
Reply TODAY to continue. STOP to pause.
```

Sample variables: `1`, `Write a clear campaign hook`. Meta chooses/approves the category. After approval, set `WHATSAPP_PROGRESS_TEMPLATE=whatslearn_progress_v2` and `WHATSAPP_TEMPLATE_LANGUAGE=en` in protected hosting settings. This is a template name, not another API key. Do not enable a name before Meta approves it.

The new template takes precedence over the older four-variable performance template. Its values are the learner's actual saved creation count and adapted next task. Existing four-variable templates keep their original parameter contract when the new setting is absent. Opt-in, quiet hours, chosen frequency, one reminder per day and STOP apply to both.

## Continuing after a website save

If a mission is completed on the website while an older WhatsApp draft is open, TODAY parks that chat draft and uses current account progress. Send DRAFTS to list parked revisions and RESUME followed by its mission ID (for example RESUME d1) to reopen one when no active draft is open. Reopening never awards points or clears saved progress. New migration: `0016_whatsapp_saved_drafts.sql` (automatically applied by the Node runtime). Archived drafts remain private to the account and are removed on unlink/account deletion.
