import { test, expect } from "@playwright/test";
test("클론: MUJI 콘텐츠·사진·15개 화면 폭", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const imageTypes = new Map();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image") {
      imageTypes.set(response.url(), response.headers()["content-type"] ?? "");
    }
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/clone/");
  await expect(page).toHaveTitle(/MUJI|무인양품|無印良品/);
  expect(await page.content()).not.toMatch(/ONEPIECE/i);
  // A real MUJI shopping-bag URL may contain "cart"; the old page identity
  // must disappear from the document title and visible content.
  expect(await page.title()).not.toMatch(/\bCART\b/i);
  expect(await page.locator("body").innerText()).not.toMatch(/\bCART\b/i);
  await expect(page.locator(".category-list > li")).toHaveCount(20);
  await expect(page.locator(".product-grid > li")).toHaveCount(6);
  await expect(page.locator(".feature-grid > article")).toHaveCount(2);
  const productLinks = await page.locator(".product-grid a").evaluateAll(
    (links) => links.map((link) => link.href),
  );
  expect(productLinks.length).toBeGreaterThanOrEqual(6);
  for (const href of productLinks) {
    const target = new URL(href);
    expect(target.protocol).toBe("https:");
    expect(target.hostname).toBe("mujikorea.co.kr");
    expect(target.pathname).not.toBe("/");
  }
  const observations = [], imageChecks = [];
  for (const width of [320, 375, 479, 480, 481, 767, 768, 799, 800, 801, 1024, 1199, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => Math.max(
      0, document.documentElement.scrollWidth - innerWidth, document.body.scrollWidth - innerWidth,
    ));
    observations.push({ width, overflow });
    expect(overflow, `${width}px에서 가로 넘침`).toBe(0);
    if ([375, 768, 1440].includes(width)) {
      const images = await page.locator("img").evaluateAll(async (elements) => {
        elements.forEach((image) => { image.loading = "eager"; });
        await Promise.all(elements.map((image) => image.decode().catch(() => {})));
        return elements.map((image) => ({
          src: image.currentSrc, loaded: image.complete && image.naturalWidth > 0,
          hasAlt: image.hasAttribute("alt"),
        }));
      });
      expect(images.length).toBeGreaterThanOrEqual(29);
      expect(images.filter((image) => !image.loaded)).toEqual([]);
      expect(images.every((image) => image.hasAlt)).toBe(true);
      const localOrigin = new URL(page.url()).origin;
      for (const image of images) {
        expect(new URL(image.src).origin).toBe(localOrigin);
        expect(imageTypes.get(image.src), image.src).toMatch(/^image\/(?:jpeg|webp|png|svg\+xml)(?:;|$)/);
      }
      const hero = await page.locator("picture.hero-picture").evaluate((picture) => {
        const source = picture.querySelector("source[media]");
        const image = picture.querySelector("img");
        return {
          media: source.media, mediaMatches: matchMedia(source.media).matches,
          mobile: new URL(source.srcset.split(",")[0].trim().split(/\s+/)[0], document.baseURI).href,
          current: image.currentSrc, desktop: image.src,
        };
      });
      expect(hero.media).toMatch(/max-width\s*:\s*767px/);
      expect(hero.mediaMatches).toBe(width < 768);
      expect(hero.current).toBe(width < 768 ? hero.mobile : hero.desktop);
      imageChecks.push({ width, images: images.length, broken: 0, imageMimeTypesValid: true, mobileHero: hero.mediaMatches });
    }
  }
  await testInfo.attach("muji-responsive-checks", {
    body: Buffer.from(JSON.stringify({ observations, imageChecks }, null, 2)),
    contentType: "application/json",
  });
});
test("Todo: 추가 수정 조회 완료 삭제 및 새로고침 보존", async ({ page }) => {
  await page.goto("/todo/");
  await page.getByLabel("할 일", { exact: true }).fill("평가기준 검토");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.getByText("평가기준 검토", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("평가기준 최종 검토"));
  await page.getByRole("button", { name: "평가기준 검토 수정" }).click();
  await expect(
    page.getByText("평가기준 최종 검토", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("평가기준 최종 검토", { exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "평가기준 최종 검토 완료" }).check();
  await page.getByLabel("조회 조건").selectOption("active");
  await expect(page.getByText("조회된 할 일이 없습니다.")).toBeVisible();
  await page.getByLabel("조회 조건").selectOption("done");
  await expect(
    page.getByText("평가기준 최종 검토", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "평가기준 최종 검토 삭제" }).click();
  await expect(page.locator("#list li")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#list li")).toHaveCount(0);
});
test("Todo: 공백·수정 취소·HTML 입력 방어", async ({ page }) => {
  await page.goto("/todo/");
  await page.getByLabel("할 일", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.locator("#list li")).toHaveCount(0);
  const title = '<img src=x onerror="alert(1)">';
  await page.getByLabel("할 일", { exact: true }).fill(title);
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.locator("#list img")).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: `${title} 수정` }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept(" "));
  await page.getByRole("button", { name: `${title} 수정` }).click();
  await expect(page.getByRole("status")).toHaveText("1~120자로 입력하세요.");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});
test("Todo: 손상된 저장 데이터 오류 표시와 복구", async ({ page }) => {
  await page.goto("/todo/");
  await page.evaluate(() => localStorage.setItem("daily-todos-v1", "invalid-json"));
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("저장 데이터를 읽지 못했습니다.");
  await page.getByLabel("할 일", { exact: true }).fill("복구 후 저장");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await page.reload();
  await expect(page.getByText("복구 후 저장", { exact: true })).toBeVisible();
});
test("클론: MUJI 접근성·검색 계약·키보드 메뉴", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/clone/");
  for (const selector of ["header", "main", "footer", "h1"]) await expect(page.locator(selector)).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("MUJI 無印良品");
  const navigation = page.locator("nav");
  expect(await navigation.count()).toBeGreaterThanOrEqual(2);
  expect(await navigation.evaluateAll((elements) => elements.every((nav) =>
    (nav.getAttribute("aria-label") ?? "").trim() ||
    (nav.getAttribute("aria-labelledby") ?? "").split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim()),
  ))).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문 바로가기", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator("main#main")).toBeFocused();
  expect(await page.locator("input:not([type=hidden])").evaluateAll((inputs) => inputs.every((input) => input.labels.length > 0))).toBe(true);
  expect(await page.locator("img").evaluateAll((images) => images.every((image) => image.hasAttribute("alt")))).toBe(true);

  const search = page.locator("details.site-search");
  const searchToggle = search.locator("summary");
  await expect(searchToggle).toHaveAttribute("aria-label", "상품 검색 열기");
  await searchToggle.focus(); await page.keyboard.press("Enter");
  await expect(search).toHaveAttribute("open", "");
  const form = search.locator("form");
  await expect(form).toBeVisible();
  await expect(form).toHaveAttribute("action", "https://mujikorea.co.kr/products/search");
  await expect(form).toHaveAttribute("method", /^get$/i);
  const keyword = page.getByLabel("공식몰 상품 검색", { exact: true });
  await expect(keyword).toHaveAttribute("name", "keyword");
  await keyword.fill("");
  expect(await keyword.evaluate((input) => input.required && input.validity.valueMissing && !input.checkValidity())).toBe(true);
  await keyword.fill("수납");
  expect(await form.evaluate((element) => element.checkValidity() && new FormData(element).get("keyword") === "수납")).toBe(true);
  await expect(form.getByRole("button", { name: "공식몰에서 검색", exact: true })).toBeVisible();
  await searchToggle.focus(); await page.keyboard.press("Space");
  await expect(search).not.toHaveAttribute("open", "");

  await page.setViewportSize({ width: 375, height: 1000 });
  const mobileMenu = page.locator("details.mobile-menu");
  const menuToggle = mobileMenu.locator("summary");
  await expect(menuToggle).toBeVisible();
  await expect(menuToggle).toHaveAttribute("aria-label", "전체 메뉴 열기");
  await menuToggle.focus(); await page.keyboard.press("Enter");
  await expect(mobileMenu).toHaveAttribute("open", "");
  expect(await mobileMenu.locator("a").count()).toBeGreaterThan(0);
  await expect(mobileMenu.locator("a").first()).toBeVisible();
  await menuToggle.focus(); await page.keyboard.press("Space");
  await expect(mobileMenu).not.toHaveAttribute("open", "");
  await expect(mobileMenu.locator("a").first()).toBeHidden();
});
test("Todo: 중복·잘못된 저장 항목과 120자 경계", async ({ page }) => {
  await page.goto("/todo/");
  await page.evaluate(() => localStorage.setItem("daily-todos-v1", JSON.stringify([
    { id: "valid", title: "보존 항목", done: false },
    { id: "valid", title: "중복 항목", done: false },
    { id: "empty", title: "   ", done: false },
    { id: "long", title: "x".repeat(121), done: false },
    { id: "wrong", title: "잘못된 완료 값", done: "yes" },
  ])));
  await page.reload(); await expect(page.locator("#list li")).toHaveCount(1);
  await expect(page.getByText("보존 항목", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("저장 데이터를 읽지 못했습니다.");
  await page.evaluate(() => {
    document.querySelector("#title").value = "x".repeat(121);
    document.querySelector("#todo-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.locator("#list li")).toHaveCount(1);
  expect(await page.locator("#title").evaluate((input) => input.validationMessage)).toBe("1~120자로 입력하세요.");
  await page.getByLabel("할 일", { exact: true }).fill("x".repeat(120));
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.locator("#list li")).toHaveCount(2);
  await page.reload(); await expect(page.locator("#list li")).toHaveCount(2);
});
