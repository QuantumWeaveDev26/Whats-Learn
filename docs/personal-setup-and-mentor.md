# Personal setup and mentor routing — 19 October 2026

## Two separate flows

`/welcome` asks seven optional personal questions after sign-in: age band, current stage, hobbies, interests, project idea, learning barrier and available device. `/find-my-path` still asks the existing journey choices: course, starting level, goal, language, daily time and learning style. Submitting one flow does not overwrite the other.

Personal setup is one-time. Learners can go back or skip a question before the final review. Final submission, including an entirely skipped setup, is locked. The API uses an account-keyed atomic insert and returns 409 on any later attempt. Settings shows submitted facts without edit controls. Account deletion removes this data. No exact date of birth is collected.

Email sign-in and non-recovery confirmation route incomplete accounts to setup. Completed accounts resume the original validated internal destination. The host sign-in path also returns through setup. Recovery continues to its password reset page. Nested welcome URLs are unwrapped and validated to preserve the destination without allowing outside redirects.

## Personalisation

The course dialog shows an optional familiar connection based on the learner's interest/hobby and project. Website and linked WhatsApp coaching receive bounded personal context as untrusted data. The exact age band is not sent to AI; under-18 context only adds age-appropriate guidance. Context does not replace the assigned brief, reference answer, practical evidence rules, course access or points criteria. Existing AI provider configuration is reused.

## WhatsApp routing

Natural progress, course-change, greeting, clarification (including “Nange gothilla”) and frustration messages are recognised before draft answer capture. A ready draft no longer intercepts every ordinary message. Progress requests report saved account figures. Course changes archive the current draft and clear the old current-mission pointer, so coaching follows the new course. Existing course/profile commands still work.

## Storage and checks

Migration `0020_learner_context.sql` is additive and listed in the migration journal. The standalone Node runtime applies packaged migrations to its persistent database; D1 installations must apply it before rollout. No API keys or n8n workflows are changed.

Regression checks cover validation, account isolation, immutable submission, internal return URLs, separate journey preferences, natural intent routing with a ready draft, preserved course drafts, coaching context, and unchanged assessment rules. Built-server checks use a local fake auth provider and a separate scratch database. They verify first sign-in, rendered first question, successful setup, rejected overwrite, subsequent redirect and returning sign-in. These are not proof of actual Meta delivery or real AI response quality. Browser control was unavailable during this change, so there is no fresh desktop/mobile screenshot verification.
