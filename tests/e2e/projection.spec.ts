import { expect, test } from '@playwright/test'

test('operator can search Psalm 23 and open a presenter slide', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByLabel('성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1')
    .fill('시23')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/Psalms\/23$/)
  await page.getByLabel(/시편 23장 5번째 슬라이드/).click()
  await expect(page).toHaveURL(/\/Psalms\/23\/5$/)
  await expect(page.locator('[data-projection-verse-text]')).toContainText(/\S/)
})

test('legacy chapter and verse URLs redirect to canonical routes', async ({
  page,
}) => {
  await page.goto('/Genesis1?v=3')
  await expect(page).toHaveURL(/\/Genesis\/1\/3$/)
})

test('live route has no focusable controls and can blackout itself from broadcast state', async ({
  page,
}) => {
  await page.goto('/Psalms/23/5/live')
  await expect(page.locator('[data-projection-live]')).toBeVisible()
  await expect(page.locator('[data-projection-verse-text]')).toContainText(/\S/)
  const focusables = await page
    .locator('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])')
    .count()
  expect(focusables).toBe(0)
})

test('presenter keyboard moves by chapter without treating Escape as back navigation', async ({
  page,
}) => {
  await page.goto('/Psalms/23/5')
  await expect(
    page.locator('[data-slide-controller-ready="true"]'),
  ).toBeAttached()

  await page.keyboard.press('PageDown')
  await expect(page).toHaveURL(/\/Psalms\/24\/1$/)

  await page.keyboard.press('PageUp')
  await expect(page).toHaveURL(/\/Psalms\/23\/1$/)

  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/Psalms\/23\/1$/)
})
