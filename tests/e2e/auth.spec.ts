import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("login page is reachable and has no serious axe violations", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByText("ZEEK")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious).toEqual([]);
});

test("protected routes redirect without a session", async ({ page }) => {
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/login/);
});

test("public sign-up is disabled", async ({ request }) => {
  const response = await request.post("/api/auth/sign-up/email", {
    data: {
      email: "a@b.com",
      password: "una-clave-larga",
      name: "Ana",
      username: "ana",
    },
  });
  expect([403, 404]).toContain(response.status());
});

test("login fits a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
