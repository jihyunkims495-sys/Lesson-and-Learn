import { test, expect } from "@playwright/test";
import { copyFile, mkdir } from "node:fs/promises";
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.title === "Todo: 추가 수정 조회 완료 삭제 및 새로고침 보존") {
    const video = page.video();
    await page.close();
    await mkdir("assets", { recursive: true });
    await copyFile(await video.path(), "assets/todo-demo.webm");
  }
});
test("클론: 전체·영역·반응형", async ({ page }) => {
  await mkdir("assets", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/clone/");
  await expect(page.getByRole("heading", { name: "CART", exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문 바로가기" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#cart$/);
  await page.screenshot({ path: "assets/clone-preview.png", fullPage: true });
  for (const [name, selector] of [
    ["header", ".site-header"],
    ["main", "main"],
    ["footer", "footer"],
  ]) {
    await page
      .locator(selector)
      .screenshot({ path: `assets/clone-${name}.png` });
  }
  for (const width of [320, 375, 479, 480, 481, 767, 768, 799, 800, 801, 1024, 1199, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await page.locator(".cart-layout").evaluate((layout) => getComputedStyle(layout).gridTemplateColumns.split(" ").length)).toBe(width < 768 ? 1 : 2);
    if ([375, 768, 1440].includes(width)) {
      // Give a full-page capture a viewport tall enough for its document so
      // fixed bottom navigation sits at the image bottom instead of over it.
      const height = await page.evaluate(() => Math.max(800, document.documentElement.scrollHeight));
      await page.setViewportSize({ width, height });
      await page.screenshot({ path: `assets/clone-${width}.png`, fullPage: true });
    }
  }
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
test("클론: 시맨틱·레이블·메뉴·수량 폼", async ({ page }) => {
  await page.goto("/clone/");
  for (const selector of ["header", "main", "footer", "h1", "form"]) await expect(page.locator(selector)).toHaveCount(1);
  await expect(page.getByRole("form", { name: "장바구니 수량" })).toBeVisible();
  expect(await page.locator("input").evaluateAll((inputs) => inputs.every((input) => input.labels.length > 0))).toBe(true);
  expect(await page.locator(".item img").evaluateAll((images) => images.every((image) => image.alt.length > 0 && image.complete && image.naturalWidth > 0))).toBe(true);
  await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await page.keyboard.press("Tab");
  await expect(page.getByLabel("재킷 수량", { exact: true })).toBeFocused();
  await page.locator("summary").click();
  await expect(page.getByRole("link", { name: "ALL PRODUCTS", exact: true })).toBeVisible();
  await page.locator("summary").click();
  await expect(page.locator("details")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: "CHECKOUT", exact: true })).toBeDisabled();
  await expect(page.getByText("258,000원", { exact: true })).toBeVisible();
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
