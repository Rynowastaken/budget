import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.BUDGET_URL || "http://127.0.0.1:4173";
await mkdir("docs/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.fill("#profileName", "README Demo");
  await page.fill("#profilePin", "");
  await page.click('#loginForm button[aria-label="Open profile"]');
  await page.waitForSelector("#appShell:not(.hidden)");

  await page.fill("#dailyQuota", "420");
  await page.fill("#todayQuota", "420");
  await page.fill("#totalAmount", "12450");
  await page.click("#currencyToggle");
  await page.click('[data-currency="TWD"]');
  await page.locator("#rolloverEnabled").check({ force: true });
  await page.locator("#settingsForm").evaluate((form) => form.requestSubmit());

  await page.waitForFunction(() =>
    document.querySelector("#totalRemaining")?.textContent?.includes("NT$")
  );
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "docs/screenshots/quota.png",
    fullPage: true,
  });

  await page.evaluate(async () => {
    const session = JSON.parse(sessionStorage.getItem("finance-manager-active-profile-v2") || "null");
    if (!session?.userId) throw new Error("README demo profile session is missing.");

    const headers = {
      "Content-Type": "application/json",
      "X-Profile-Id": session.userId,
      "X-Profile-Pin": session.pin ?? "",
    };
    const expenses = [
      { daysAgo: 0, amount: 180, name: "Lunch" },
      { daysAgo: 2, amount: 75, name: "Coffee" },
      { daysAgo: 5, amount: 320, name: "Groceries" },
      { daysAgo: 8, amount: 60, name: "Transit" },
      { daysAgo: 12, amount: 240, name: "Dinner" },
    ];

    for (const item of expenses) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - item.daysAgo);
      const expense = {
        id: crypto.randomUUID(),
        amount: item.amount,
        name: item.name,
        date: date.toLocaleDateString("en-CA"),
        createdAt: Date.now() - item.daysAgo * 86400000,
      };
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers,
        body: JSON.stringify({ expense }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
    }
  });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#appShell:not(.hidden)");
  await page.click("#activityTab");
  await page.waitForSelector("#activityPanel:not(.hidden)");
  await page.waitForFunction(() =>
    Number.parseInt(document.querySelector("#activityExpenseCount")?.textContent || "0", 10) > 0
  );
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "docs/screenshots/activity.png",
    fullPage: true,
  });
} finally {
  await browser.close();
}
