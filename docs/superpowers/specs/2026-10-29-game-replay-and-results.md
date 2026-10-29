# Game replay variety and clear results

The user clarified that the ordering result is crowded, not that its score is incorrect. Render its reference answer as numbered steps and keep the explanation short. Preserve the first-attempt scoring rule. They also request different questions on repeat plays across the eight mini-games.

Use expanded, authored local question banks and a per-account/per-game unseen-question deck. This preserves offline-capable local gameplay and avoids paid AI calls. Randomly reordering the same full bank does not satisfy the request. A finite bank eventually repeats; exhaust unseen questions before starting a fresh cycle, and avoid the immediately preceding run when possible. Explain this limit honestly. Storage failures must not prevent play; retain an in-memory fallback for the session.

Select a run without writing during React render. Commit its deck reservation in an idempotent effect. Normal rerenders must not replace questions. Play again and reopening a game use a fresh run. Retrying a round uses the same round and retains its first score.

Keep run sizes and scoring scales stable: Hook Hunter 6, Budget Boss 3, Bug Hunt 5, each ordering game 3, Guess the Shot 5, Caption It 4, Story Dice 1 prompt. Expand camera compositions/context and Story Dice combinations as well as text banks. No changes to game IDs, leaderboard APIs or weekly game selection. Scores remain comparable in scale, not a claim that every authored question has identical difficulty.

Ordering results show a compact score, a numbered reference sequence, an optional explanation, and clearly separated retry/next actions. Show the original scored result after an unscored retry so the final run score is understandable. Do not alter correctness rules based only on the screenshot.

Scope is `/app` components, app CSS, local tests and docs. The launch audit remains ongoing separately. The proposed shared account-deletion fix is awaiting explicit permission; do not apply it or modify shared website/backend code in this task.
