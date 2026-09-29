# RESEARCH — source-reviewed edition

Reviewed: 2026-09-29 (Asia/Seoul).

## Implemented

- Agent profile and monitoring scope, source-connection status, daily trend classification, Naver search/shopping trends, GA4 first-party audience behavior, brand observations, season comparison, and MD review queue.
- Fashion (men, women, kids, unisex), home, tech, accessories, and lifestyle-theme filters. Missing evidence has an explicit empty state.
- Six reviewed official pages from UNIQLO, MUJI and COS, with source regions, seasons, publication dates where available, review date, factual summaries, separate MD hypotheses, and limitations.
- 2025 SS/FW archives are distinct from 2026 sources. Current market cards summarize verified 2026 FW collection pages.
- Naver- and GA4-shaped sample dashboards now include trend lines, keyword summaries, audience/channel shares, a cohort-retention matrix, and a sample purchase funnel. Every invented value is visibly labeled as a demo fixture, not collected platform data.
- Sample chart points expose value/date tooltips on hover, focus, or tap; period controls switch the visible 7-day, 4-week, and 12-month sample series. Overview KPI cards open their corresponding detailed report.
- One fixed review date. Other dates have no report; opening the page does not manufacture a new publication date.
- The overview separates sample common-season, acceleration, and risk report examples and shows the intended evidence review and MD triage flow. The numeric fixtures are illustrative only; real classifications and review actions require connected platform data.
- Supplemental research control opens an accessible explanation dialog. It is a button, not a text-entry form. No search term can be entered, stored, or transmitted, and no AI API is called. This implements the user's latest demo-only search instruction.

## Not connected

- The proposed daily 08:00 KST autonomous research and publication schedule.
- Naver DataLab credentials and a Google Analytics 4 property/API credential. No live platform data has been collected; the displayed indexes and behavior metrics are synthetic demo fixtures.
- Live search/shopping time series, SNS audience aggregates, actual growth/decline metrics, real sales, and historical performance comparison.
- Source-priority editing and persisted brand configuration. The displayed priority is the proposed sample-brand policy.
- Supplier actions or automatic changes to forecasts, quantities, or orders.

## Platform metric boundaries

- Naver DataLab search trends are relative query-group search indices. Shopping Insight reports relative shopping-area/search-click trends, optionally grouped by category, keyword, device, age, and gender. They are not units sold, revenue, or buyer counts.
- GA4 reports behavior measured on the connected brand website/app, such as active users, sessions, engagement, acquisition, pages, events, and eligible aggregate demographics. It does not represent all market users. Demographic availability depends on property setup, consent, and privacy thresholds.
- Market search interest and first-party site behavior are reported separately. Any later synthesis must preserve each metric's source, date range, geography, population, and limitations.

Official platform references:

- [Naver DataLab Search Trend API](https://developers.naver.com/docs/serviceapi/datalab/search/search.md)
- [Naver DataLab Shopping Insight API](https://developers.naver.com/docs/serviceapi/datalab/shopping/shopping.md)
- [Google Analytics Data API dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Google Analytics demographic details and data thresholds](https://support.google.com/analytics/answer/12948931?hl=en)

Do not describe this reading edition as a running autonomous agent or a daily generated report. Never present synthetic demo values as observed platform data, sales, or validated trend growth.

## Sample brand

20s/30s men and women; unisex casual; basic/standard; UNIQLO-like category price positioning. Primary target panels and secondary target panels remain distinct. Age and gender must come from eligible aggregate sources, never inferred from public faces, names, or posts.

## Verified source pages

1. UNIQLO U 2026 FW: https://www.uniqlo.com/us/en/women/special-collaboration/uniqlo-u — US page; publication date not stated; collection season verified. Dynamic page may later change seasons.
2. MUJI Labo 2026 Autumn & Winter: https://www.muji.com/jp/ja/special-feature/clothes/mujilabo/ — Japan; publication date not stated; store-list reference date 2026-07-31. Brand performance claims are not independent tests.
3. UNIQLO U 2025 SS announcement: https://www.uniqlo.com/jp/ja/contents/corp/press-release/2025/03/2025030411_uniqlo_u.html — Japan; published 2025-03-04.
4. UNIQLO U 2025 FW announcement: https://www.uniqlo.com/jp/ja/contents/corp/press-release/2025/09/25091011_25FW%20Uniqlo%20U.html — Japan; published 2025-09-10.
5. COS 2025 SS: https://www.cos.com/en-ca/runway/spring-summer-2025 — Canada site; publication date not stated.
6. COS 2026 SS: https://www.cos.com/en-us/runway/spring-summer-2026 — US site, Seoul show; publication date not stated; not claimed to be COS's latest collection.

Source observations: collection/editorial signals, not transaction data. Proposed supplementary providers include H&M, ZARA, ARKET, Massimo Dutti, department stores/outlets, Alibaba, Temu and Qoo10. These have not been automatically collected.

NAVER Shopping Insight documentation: https://developers.naver.com/docs/serviceapi/datalab/shopping/shopping.md — relative shopping-search click trends; not sales or purchaser counts. API is not connected.

## Safety

The site remains static. Private .env files are excluded from Git and outside dist. No provider credentials are bundled in the public site. No research API request, automated billing change, or scheduler activation is part of this version.
