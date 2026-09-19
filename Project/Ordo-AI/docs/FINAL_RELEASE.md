# Ordo AI Decision OS — Final Prototype Record

Recorded on 2026-09-18 (Asia/Seoul) from the public prototype's `main` branch.

## Public build

- URL: https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site
- Published Sites version: v6
- Final UI baseline commit: `72463cc7ff62ffbd89a0eb3e4da10645fc0b8544`
- Default entry: `#entry`

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
