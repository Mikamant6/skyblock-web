<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (SkyBlock Shard Calculator)

- NEVER open, read, copy, print or commit files that contain secrets: `.env`, `.env.*` (especially `.env.local`), `.Renviron`. The Hypixel API key must never appear in chat, logs, code or commits.
- Only use `process.env.HYPIXEL_API_KEY` in server code. Never send it to the browser.
- The user is a programming beginner: explain every change briefly, work in small steps, tell the user exactly which files were created or changed.
- Code identifiers in English, comments in German. Keep modules separate: data acquisition (`lib/hypixelApi.ts`, `lib/bazaarApi.ts`), pure logic (`lib/shardValue.ts`, `lib/shardAttributes.ts`, `lib/shardNetworth.ts`), presentation (`app/`).
- Never guess data mappings (Bazaar IDs, attribute names). Require evidence: experiment > in-game/Atlas price match > elimination. Name similarity is not evidence.
- Do not put `dynamic` route segment config in files (incompatible with `cacheComponents`). Do not use `npm audit fix --force` blindly.
- `next.config.ts`: the Tailwind loader rule must stay limited to `globals.css`, otherwise CSS Modules (`*.module.css`) stop working.
- After code changes run: `npx.cmd tsx lib/shardAttributes.test.ts`, `npx.cmd tsx lib/shardValue.test.ts`, `npx.cmd tsx lib/serverLogic.test.ts` (PowerShell: use the `.cmd` variants).
- Also run the newer tests: `lib/skillProgress.test.ts`, `lib/skillResources.test.ts`, `lib/skillPlanner.test.ts`, `lib/collectionProgress.test.ts`, `lib/slayerService.test.ts` (same `npx.cmd tsx` way). `scripts/checkSkills.ts` checks the public Hypixel skill and collection tables once.
