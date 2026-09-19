# Ordo AI Decision OS — Final Release Record

## Current: v1.1.0 — 2026-09-19

- **Daytona DEV:** https://3001-qjbnuhh9kvnqqhng.daytonaproxy01.net/#entry (expires 2026-09-19 18:07 KST).
- Independent Daytona static hosting + actual server calculation via `/api/simulate`; no Nosana or other LLM dependency.
- Three real remote runs / nine scenarios exactly match the existing model. Four local focused tests passed. Browser route traversal, auto/manual server calculations and video loading verified.
- Final screenshots are actual browser viewport captures from the Daytona runtime, including Final Order and the successful server-calculation dialog. No generated/mock screenshots or full-page background compositing.
- Final video: [3-minute v4 MP4](./video/Ordo-AI_DEV-Demo_3MIN_FINAL_v4.mp4), 45,885,197 bytes; SHA-256 `8ee237db32a256f33acf7a5d8a84012d10bea87f5777c0e77e206931f0988927`. This is the final existing product-tour edit, recorded before the Daytona button was added.
- Source, API and boundaries: [Daytona implementation specification](./DAYTONA.md).

---

## Historical baseline: v6 — 2026-09-18

The remaining record describes the earlier static release only. Its version numbers, screenshot package and limitations are historical, not the current v1.1 status above.

Recorded on 2026-09-18 (Asia/Seoul) from the prototype's `main` branch.

## Included experience

- Entry page with the restored Ordo headline treatment and motion.
- Today review workflow, including order collection, review state, archive behavior, and calendar-derived next-week briefing.
- Overview with weekday sales behavior, prior/current-week comparison, adjustable sales-share simulation, KPI deltas, analyst briefing, reassessment list, and FX history.
- Decisions with complete REORDER / WATCH / HOLD views, item-level evidence, risk presentation, and decision controls.
- Simulator with item-specific scenarios, quantity adjustment, assortment rationale, and downstream KPI recalculation.
- Reports with item reports, consolidated analysis, daily observations, forecasts, decisions, and risk sections.
- Brand calendar and quick guide overlays without forced decision-page navigation.
- Shared graph reveal motion from left to right, plot-visibility triggering, hover/focus/touch interaction, and reduced-motion support.

## Final interaction and design checks

- Graph interactions are shared across the main analytical tabs and start when each plot enters the viewport.
- Forecast and no-order series remain visually and numerically distinguishable.
- Overview reassessment heading spacing reflects the final annotated layout.
- Pretendard and Pixelify Sans assets are bundled with the public static build.
- Entry is the initial page when the site opens without a hash route.

## Verification recorded for this release

- `verify-charts-revision.js`: 9/9 passed.
- `verify-fx-widget.js`: 8/8 passed.
- `verify-comments-ui.js`: passed.
- Public asset revisions verified after deployment: charts v9, workbench v5, motion v5, FX widget JS v3 / CSS v2.

## Snapshot package

`release-artifacts/ordo-page-snapshots-16x9-v6.zip` contains the final 16:9 JPG captures for the entry page and five primary work tabs. `release-artifacts/capture-snapshots.js` records the capture setup used to produce them.

## Data boundary

This is a public static prototype. Its order feed, forecasts, currency history, recommendations, and decision outcomes are deterministic demonstration fixtures; this record does not claim a live database, production scheduler, external AI inference service, or real purchase-order transmission.
