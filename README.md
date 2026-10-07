# Agent Playbook

An interactive field guide. It distills Boyd's bookmarks on **personal agent systems**, **AI coding** and **pstack / @poteto** into 11 concrete patterns, then holds his Grok Bot fleet up against each one.

- **Live:** http://127.0.0.1:4141/ (`./run.sh` starts or restarts it in the background)
- **Offline:** `dist/agent-playbook-snapshot.html` is a single self-contained file with no network needed
- **Screenshots:** `screenshots/*.png` at 1440×900

## What each chapter shows
1. **What it is**: a plain-English explanation.
2. **Bookmarks that teach it**: post cards showing author, date, views and a link to x.com, plus a short quote taken verbatim from the saved files. Lines tagged *journal note* are Jim's journal summaries of a post, not the author's words.
3. **How your fleet does it today**: verbatim quotes from bot personas (`profile.json`) and workflow skills (`SKILL.md`), Fleet Doctor findings, and computed facts from Bot Island's `fleet.json`. Each computed fact states its method and source path.
4. **Scorecard**: five rubric checks (yes = 1, partial = ½, no = 0), each with a one-line justification. The pattern score is the sum of the five.
5. **Try this next**: one concrete suggestion, with a copy button.

The hero radar plots all pattern scores; click a spoke to jump to its chapter. After the chapters come the **Next 10 upgrades** (ranked, with S/M/L effort and minutes), a fleet roster and the sources.

## Scores (overall 3.0 / 5)
| # | Pattern | Score | Teaching quotes | Fleet evidence |
|---|---|---|---|---|
| 1 | 🚪 Chief-of-staff front door | 3.5 / 5 | 4 | 7 |
| 2 | 🧩 Specialist bots: one job, explicit anti-jobs | 2.5 / 5 | 3 | 6 |
| 3 | 🧠 Memory tiers | 3.5 / 5 | 3 | 8 |
| 4 | ⏰ Routines vs. listeners | 3 / 5 | 2 | 5 |
| 5 | 📚 Skills library | 3.5 / 5 | 4 | 6 |
| 6 | 🩺 Healthchecks & observability | 3 / 5 | 4 | 5 |
| 7 | ✅ Verification & eval loops | 3 / 5 | 4 | 6 |
| 8 | 🏟️ Arena & parallel candidates | 2 / 5 | 5 | 5 |
| 9 | 💸 Cost discipline | 3.5 / 5 | 3 | 6 |
| 10 | 🖱️ Computer use → scripts | 3 / 5 | 2 | 5 |
| 11 | 📬 Proactive briefs, quiet when nothing | 3 / 5 | 3 | 6 |

## Next 10 upgrades
1. **Pause the duplicate Family Times archive routine** (S, 10 min): ≈108 agent-minutes/week back (the largest line on the cost table) and one owner for the newspaper
2. **Delete Michael's two paused routine copies** (S, 5 min): Removes the risk of re-enabling a duplicate brief or interest note
3. **Fix Brief's missed runs and add a liveness alarm** (S, 30 min): The morning brief stops silently skipping days
4. **Merge or stagger Oscar's back-to-back morning runs** (S, 15 min): Stops re-gathering the same context twice in 20 minutes
5. **Shared "homework check-in" skill for both tutors** (M, 45 min): Fixes land once instead of twice. Each tutor keeps only its kid-specific rules.
6. **First listener: a mail trigger for the Kia statement watch** (M, 1–2 h): Replaces a 5×/week poll with a wake only when the statement arrives
7. **Printer-health preflight for the Family Times** (M, 1 h): Fewer PDF-only mornings, and Boyd hears when printing is skipped
8. **One shared "household & decisions" memory note** (M, 1 h): Household facts fixed once for Oscar, Pam, Path and the tutors
9. **Turn the PowerSchool and X checks into saved scripts** (L, half day): Cuts the two biggest screen-driving lines (Jim 50 min, Vic Tutor 40 min)
10. **Arena pilot with Dwight + weekly eval scores** (M, 1–2 h + agent time): Real use of the unused Cursor pool and a quality trend you can see

## Sources (all read-only)
- Bookmarks: `/workspace/tokenmax/bookmark-atlas/data/atlas.json` (Bookmark Atlas build). Quotes are re-checked against the original saved files listed on each post.
- Personas: `/home/box/agent-data/agents/*/profile.json (16 files)`
- Skills: `/home/box/agent-data/workflows/*/SKILL.md (9 files)`
- Activity: `/workspace/tokenmax/bot-island/data/fleet.json`
- Findings: `/workspace/tokenmax/bot-island/reports/fleet-health-2026-10-07.html`

No secrets, automations, store.db, transcripts or search-index files were read. Nothing was sent, posted or modified outside this folder.

## Caveats
- Bot Island's local activity logs end **2026-09-16**, so run counts, messages and computer-use sessions don't cover recent weeks.
- Rubric statuses are judgment calls, but every one cites the evidence shown beside it.
- View counts come from the saved bookmark files. "≈" marks rounded counts.

## Layout
```
build/sources.py        read-only source loaders + quote verifier (normalized substring match)
build/build.py          patterns, rubric, upgrades; exits 1 if any quote isn't found in its source
build/export_static.py  inlines web/ + data into dist/agent-playbook-snapshot.html
build.sh                build.py + export_static.py
web/                    index.html, style.css, app.js (no dependencies)
data/playbook.json      generated data
server.py / run.sh      127.0.0.1:4141
screenshot.sh           1440×900 headless-Chrome screenshots (?shot=<pattern-id> starts at a chapter)
tests/smoke_test.py     re-verifies every quote, score sums, server, snapshot, headless render
```

Rebuild: `./build.sh && ./screenshot.sh && python3 tests/smoke_test.py`


---
## Repo notes
- **Built:** 2026-10-07, by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/agent-playbook` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
