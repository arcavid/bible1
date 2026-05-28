import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

type AccessibilityTarget = {
  name: string
  path: string
}

const ACCESSIBILITY_TARGETS: AccessibilityTarget[] = [
  { name: 'home command search', path: '/' },
  { name: 'chapter grid', path: '/Psalms/23' },
  { name: 'presenter slide', path: '/Psalms/23/5' },
  { name: 'service playlist', path: '/service/ui-ux' },
  { name: 'settings', path: '/settings' },
  { name: 'help', path: '/help' },
]

async function expectNoAccessibilityViolations(
  page: Page,
  contextName: string,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 3),
    })),
    `${contextName} should not have axe accessibility violations`,
  ).toEqual([])
}

function rgbBrightness(color: string): number {
  const channels =
    color
      .match(/\d+(?:\.\d+)?/g)
      ?.slice(0, 3)
      .map(Number) ?? []
  const [red, green, blue] = channels
  if (red === undefined || green === undefined || blue === undefined) return 255
  return (red + green + blue) / 3
}

async function expectPointerCursor(
  locator: Locator,
  label: string,
): Promise<void> {
  await expect(locator, `${label} should be visible`).toBeVisible()
  const cursor = await locator.evaluate(
    (element) => getComputedStyle(element).cursor,
  )
  expect(
    cursor,
    `${label} should advertise clickability with a pointer cursor`,
  ).toBe('pointer')
}

test.describe('industry-standard UI/UX smoke coverage', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60_000)

  test('core operator pages pass accessibility smoke checks', async ({
    page,
  }) => {
    for (const target of ACCESSIBILITY_TARGETS) {
      await test.step(target.name, async () => {
        await page.goto(target.path)
        await expect(page.locator('body')).toBeVisible()
        await expectNoAccessibilityViolations(page, target.name)
      })
    }
  })

  test('mobile operator can search a Korean reference and select a touch-sized verse tile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/')
    await page
      .getByLabel('성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1')
      .fill('요 3:16')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/John\/3\/16$/)
    await expect(page.locator('[data-projection-verse-text]')).toContainText(
      /\S/,
    )

    await page.goto('/Psalms/119')
    const firstVerseTile = page.getByLabel(/시편 119장 1번째 슬라이드/)
    await expect(firstVerseTile).toBeVisible()

    const tileBox = await firstVerseTile.boundingBox()
    expect(
      tileBox?.width ?? 0,
      'verse tile should meet touch target width',
    ).toBeGreaterThanOrEqual(44)
    expect(
      tileBox?.height ?? 0,
      'verse tile should meet touch target height',
    ).toBeGreaterThanOrEqual(44)

    const horizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(
      horizontalOverflow,
      'mobile chapter grid should not create horizontal page overflow',
    ).toBe(false)
  })

  test('home page behaves like a centered command index, not a marketing page', async ({
    page,
  }) => {
    await page.goto('/')

    const commandShell = page.locator('[data-home-command-shell]')
    await expect(commandShell).toBeVisible()
    const shellBox = await commandShell.boundingBox()
    const viewport = page.viewportSize()
    expect(
      shellBox && viewport ? shellBox.y + shellBox.height / 2 : 0,
      'home command shell should sit near the visual center of the viewport',
    ).toBeGreaterThan((viewport?.height ?? 0) * 0.34)
    expect(
      shellBox && viewport ? shellBox.y + shellBox.height / 2 : 9999,
      'home command shell should not be pushed down like a normal marketing section',
    ).toBeLessThan((viewport?.height ?? 0) * 0.72)

    const input = page.getByLabel(
      '성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1',
    )
    await expect(input).toBeVisible()
    const heroTitle = page.getByRole('heading', {
      name: '본문을 바로 찾고, 예배 화면에 띄우세요.',
    })
    await expect(heroTitle).toBeVisible()
    await expect(heroTitle).toHaveCSS('white-space', 'pre-line')
    await expect(heroTitle).toHaveText(
      '본문을 바로 찾고,\n예배 화면에 띄우세요.',
    )

    const background = await input.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )
    expect(
      rgbBrightness(background),
      'home search input should use a dark projection-console treatment, not a bright white field',
    ).toBeLessThan(90)

    const searchDropdown = page.getByRole('listbox', { name: '성경 검색 결과' })
    await expect(searchDropdown).toBeVisible()
    await expect(searchDropdown.getByRole('option')).toHaveCount(3)
    await input.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/Psalms\/23$/)
    await page.goBack()
    await expect(input).toBeVisible()
    const idleHeight = (await searchDropdown.boundingBox())?.height ?? 0
    expect(
      idleHeight,
      'idle search dropdown should reserve stable space',
    ).toBeGreaterThan(150)
    await expect(
      page.getByText(/Search a passage, open the presenter view/i),
    ).toHaveCount(0)
    await expect(page.getByText('Static corpus')).toHaveCount(0)
    await expect(page.getByText('Legacy-safe')).toHaveCount(0)

    await input.fill('시23')
    await expect(searchDropdown).toBeVisible()
    await expect(searchDropdown.getByRole('option')).toHaveCount(1)

    await input.fill('요')
    await expect(searchDropdown).toBeVisible()
    await expect(searchDropdown.getByRole('option')).toHaveCount(3)

    await input.fill('요한복음')
    const searchOptions = searchDropdown.getByRole('option')
    await expect(searchOptions).toHaveCount(3)
    await expect(searchOptions.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      'bible-search-result-John-1',
    )
    await page.keyboard.press('ArrowDown')
    await expect(searchOptions.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      'bible-search-result-John-2',
    )
    await page.keyboard.press('ArrowDown')
    await expect(searchOptions.nth(2)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await expect(searchOptions.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/John\/2$/)
    await page.goBack()
    await expect(input).toBeVisible()

    await input.fill('없는본문')
    await expect(searchDropdown).toBeVisible()
    await expect(searchDropdown.getByText('검색 결과 없음')).toBeVisible()
    const emptyHeight = (await searchDropdown.boundingBox())?.height ?? 0
    expect(
      Math.abs(emptyHeight - idleHeight),
      'empty-result dropdown should not collapse and move the layout',
    ).toBeLessThan(24)
  })

  test('language switcher uses URL-based next-intl routing instead of client-only mutation', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(
      page.getByLabel(
        '성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1',
      ),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '예배' })).toHaveAttribute(
      'href',
      '/service/today',
    )

    await page.getByRole('button', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/?$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(
      page.getByLabel(
        'Bible passage search · examples: Ps 23, John 3:16, Psalm 23:5',
      ),
    ).toBeVisible()
    const englishHeroTitle = page.getByRole('heading', {
      name: 'Find the passage, and put it on screen.',
    })
    await expect(englishHeroTitle).toBeVisible()
    await expect(englishHeroTitle).toHaveCSS('white-space', 'pre-line')
    await expect(englishHeroTitle).toHaveText(
      'Find the passage,\nand put it on screen.',
    )
    await expect(page.getByRole('link', { name: 'Service' })).toHaveAttribute(
      'href',
      '/en/service/today',
    )
    await expect(
      page.getByRole('listbox', { name: 'Bible search results' }),
    ).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/\/en\/?$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(
      page.getByLabel(
        'Bible passage search · examples: Ps 23, John 3:16, Psalm 23:5',
      ),
    ).toBeVisible()

    await page.goto('/en/Psalms/23')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('link', { name: 'Read' })).toHaveAttribute(
      'href',
      '/en/read/Psalms/23',
    )

    await page.getByRole('button', { name: '한국어' }).click()
    await expect(page).toHaveURL(/\/Psalms\/23$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(
      page.getByLabel(
        '성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1',
      ),
    ).toHaveCount(0)
  })

  test('chapter grid keeps verse previews visible and layout-stable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/Psalms/119')

    const firstVerse = page.getByLabel(/시편 119장 1번째 슬라이드/)
    const previewClamp = firstVerse.locator('.verse-preview-clamp')
    await expect(previewClamp).toBeVisible()
    const previewMetrics = await previewClamp.evaluate((element) => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return {
        height: box.height,
        lineHeight: Number.parseFloat(style.lineHeight),
      }
    })
    expect(
      previewMetrics.height,
      'verse preview should clamp to exactly two clean lines without showing a clipped third line',
    ).toBeLessThanOrEqual(previewMetrics.lineHeight * 2 + 1)
    const verseTiles = page.locator('[data-verse-link]')
    const tileBoxes = await verseTiles.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect()
        return { top: box.top, width: box.width }
      }),
    )
    const firstRowTop = Math.min(...tileBoxes.map((box) => box.top))
    const firstRowTiles = tileBoxes.filter(
      (box) => Math.abs(box.top - firstRowTop) < 2,
    )
    expect(
      firstRowTiles.length,
      'wide chapter grid should not pack more than ten verse cards into one row',
    ).toBeLessThanOrEqual(10)
    expect(
      firstRowTiles[0]?.width ?? 0,
      'verse cards should be wide enough for Korean preview text',
    ).toBeGreaterThanOrEqual(120)
    const beforeHover = await firstVerse.boundingBox()
    await firstVerse.hover()
    const afterHover = await firstVerse.boundingBox()

    expect(
      Math.abs((afterHover?.height ?? 0) - (beforeHover?.height ?? 0)),
      'verse tile height should not jump when preview text is shown',
    ).toBeLessThanOrEqual(1)
  })

  test('chapter grid arrow keys work from the page without requiring a pre-focused tile', async ({
    page,
  }) => {
    await page.goto('/Psalms/23')
    await expect(
      page.locator('[data-verse-grid-keyboard-ready="true"]'),
    ).toBeAttached()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByLabel(/시편 23장 1번째 슬라이드/)).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByLabel(/시편 23장 2번째 슬라이드/)).toBeFocused()

    await page.keyboard.press('End')
    await expect(page.getByLabel(/시편 23장 6번째 슬라이드/)).toBeFocused()

    await page.keyboard.press('Home')
    await expect(page.getByLabel(/시편 23장 1번째 슬라이드/)).toBeFocused()
  })

  test('presenter page keeps Live Projector restrained in the sidebar with a readable CTA', async ({
    page,
  }) => {
    await page.goto('/Psalms/23/5')

    await expect(page.getByText(/most important projection step/i)).toHaveCount(
      0,
    )
    const chapterCard = page.locator('[data-presenter-chapter-card]')
    const liveCard = page.locator('[data-live-projector-card]')
    await expect(chapterCard).toBeVisible()
    await expect(liveCard).toBeVisible()

    const chapterBox = await chapterCard.boundingBox()
    const liveBox = await liveCard.boundingBox()
    expect(
      liveBox && chapterBox ? liveBox.y : 0,
      'Live Projector belongs under the chapter card in the right sidebar',
    ).toBeGreaterThan(chapterBox?.y ?? 0)

    const liveLaunch = liveCard.getByRole('link', {
      name: /Live Projector 새 탭으로 열기/,
    })
    await expect(liveLaunch).toBeVisible()
    await expect(liveLaunch).toHaveAttribute('target', '_blank')
    await expect(liveCard.getByText(/깨끗한 송출 탭/)).toBeVisible()
    await expect(liveCard.getByText(/발표자 화면은 그대로/)).toBeVisible()

    const colors = await liveLaunch.evaluate((element) => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, color: style.color }
    })
    expect(
      rgbBrightness(colors.background),
      'Live Projector CTA should not be a washed-out white button',
    ).toBeLessThan(150)
    expect(
      rgbBrightness(colors.color),
      'Live Projector CTA text should be bright and readable',
    ).toBeGreaterThan(180)
  })

  test('mobile presenter keeps the preview proportional and the keyboard tray unwrapped', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/Romans/8/20')

    const preview = page.locator('[data-projection-preview]')
    const verseText = page.locator('[data-projection-verse-text]')
    const controller = page.locator('[data-slide-controller]')
    await expect(preview).toBeVisible()
    await expect(controller).toBeVisible()

    const [previewBox, controllerBox, verseFontSize] = await Promise.all([
      preview.boundingBox(),
      controller.boundingBox(),
      verseText.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
    ])

    expect(
      previewBox ? previewBox.width / previewBox.height : 0,
      'mobile presenter preview should remain a 16:9 screen instead of becoming a full-height phone slab',
    ).toBeGreaterThan(1.68)
    expect(
      previewBox?.height ?? 999,
      'mobile presenter preview should leave room for controls and sidebar content',
    ).toBeLessThanOrEqual(230)
    expect(
      verseFontSize,
      'mobile preview verse type should scale by screen ratio, not desktop viewport height',
    ).toBeLessThanOrEqual(32)
    expect(
      controllerBox?.width ?? 999,
      'mobile keyboard tray should stay inside the viewport and scroll horizontally when needed',
    ).toBeLessThanOrEqual(366)

    const wrappedItems = await page
      .locator('[data-slide-controller-item]')
      .evaluateAll((items) =>
        items
          .map((item) => {
            const style = getComputedStyle(item)
            const box = item.getBoundingClientRect()
            return {
              text: item.textContent?.trim(),
              height: box.height,
              lineHeight: Number.parseFloat(style.lineHeight),
              whiteSpace: style.whiteSpace,
            }
          })
          .filter(
            (item) =>
              item.whiteSpace !== 'nowrap' ||
              item.height > item.lineHeight * 1.35,
          ),
      )
    expect(wrappedItems).toEqual([])
  })

  test('keyboard L opens the same Live Projector route without leaving presenter controls', async ({
    page,
  }) => {
    await page.goto('/Psalms/23/5')
    await expect(
      page.locator('[data-slide-controller-ready="true"]'),
    ).toBeAttached()

    const liveTabPromise = page.waitForEvent('popup')
    await page.keyboard.press('l')
    const liveTab = await liveTabPromise

    await expect(liveTab).toHaveURL(/\/Psalms\/23\/5\/live$/)
    await expect(page).toHaveURL(/\/Psalms\/23\/5$/)
    await expect(
      page.getByText(/Live Projector가 새 탭에서 열렸습니다/),
    ).toBeVisible()
    await liveTab.close()
  })

  test('help page explains the service flow and Live projector behavior in Korean', async ({
    page,
  }) => {
    await page.goto('/help')

    await expect(
      page.getByRole('heading', { name: /예배 진행 방법/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Live Projector/i }),
    ).toBeVisible()
    await expect(page.getByText(/새 탭으로 열리는 이유/)).toBeVisible()
    await expect(
      page.getByText(/발표자 화면은 계속 조정실로 남습니다/),
    ).toBeVisible()
    await expect(page.getByText(/How to run a service/i)).toHaveCount(0)
    await expect(page.getByText(/Operational notes/i)).toHaveCount(0)
  })

  test('reading mode keeps the chrome readable on a light page', async ({
    page,
  }) => {
    await page.goto('/read/Psalms/23')

    const headerColor = await page
      .locator('header')
      .evaluate((element) => getComputedStyle(element).color)
    expect(
      rgbBrightness(headerColor),
      'reading-page header text should be dark enough for the light reading surface',
    ).toBeLessThan(130)
  })

  test('app chrome title remains optically centered when page actions change', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    for (const target of [
      { path: '/Psalms/23', title: '시편 23장' },
      { path: '/service/today', title: '예배 today' },
    ]) {
      await test.step(target.path, async () => {
        await page.goto(target.path)
        const header = page.locator('header').first()
        const title = header.getByRole('heading', { name: target.title })

        await expect(header).toBeVisible()
        await expect(title).toBeVisible()

        const [headerBox, titleBox] = await Promise.all([
          header.boundingBox(),
          title.boundingBox(),
        ])
        const headerCenter = (headerBox?.x ?? 0) + (headerBox?.width ?? 0) / 2
        const titleCenter = (titleBox?.x ?? 0) + (titleBox?.width ?? 0) / 2

        expect(
          Math.abs(titleCenter - headerCenter),
          `${target.path} chrome title should stay centered in the header, not in the leftover space beside action buttons`,
        ).toBeLessThanOrEqual(4)
      })
    }
  })

  test('chapter grid has usable keyboard focus movement', async ({ page }) => {
    await page.goto('/Psalms/23')
    await expect(
      page.locator('[data-verse-grid-keyboard-ready="true"]'),
    ).toBeAttached()

    const firstVerse = page.getByLabel(/시편 23장 1번째 슬라이드/)
    await firstVerse.focus()
    await expect(firstVerse).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByLabel(/시편 23장 2번째 슬라이드/)).toBeFocused()

    await page.keyboard.press('End')
    await expect(page.getByLabel(/시편 23장 6번째 슬라이드/)).toBeFocused()

    await page.keyboard.press('Home')
    await expect(firstVerse).toBeFocused()
  })

  test('presenter keyboard contract supports jump, help dismissal, and search recovery', async ({
    page,
  }) => {
    await page.goto('/Psalms/23/1')
    await expect(
      page.locator('[data-slide-controller-ready="true"]'),
    ).toBeAttached()

    await page.keyboard.press('5')
    await expect(page.getByText('절 이동 5')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/Psalms\/23\/5$/)
    await expect(
      page.locator('[data-slide-controller-ready="true"]'),
    ).toBeAttached()

    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: /키보드/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /키보드/ })).toBeHidden()

    await page.keyboard.press('Control+K')
    await expect(page).toHaveURL(/\/$/)
    await expect(
      page.getByLabel(
        '성경 본문 검색 · 예: 시23, 시편 23편 5절, 요 3:16, ㅊㅅㄱ 1',
      ),
    ).toBeVisible()
  })

  test('projection settings persist through visible UI controls', async ({
    page,
  }) => {
    await page.goto('/settings')

    const verseNumber = page.getByLabel('절 번호 표시')
    const warmWhite = page.getByLabel('따뜻한 흰색 송출')
    const transition = page.getByLabel('전환 효과')

    await expect(verseNumber).toBeChecked()
    await expect(warmWhite).not.toBeChecked()

    await verseNumber.uncheck()
    await warmWhite.check()
    await transition.selectOption('none')

    await page.reload()

    await expect(page.getByLabel('절 번호 표시')).not.toBeChecked()
    await expect(page.getByLabel('따뜻한 흰색 송출')).toBeChecked()
    await expect(page.getByLabel('전환 효과')).toHaveValue('none')
  })

  test('Korean locale audit removes legacy English chrome from operator pages', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bible1-locale', 'ko')
    })

    const auditTargets = [
      {
        path: '/help',
        expected: [/예배 진행 방법/, /운영 메모/],
        forbidden: [/How to run a service/i, /Operational notes/i],
      },
      {
        path: '/settings',
        expected: [/송출 설정/, /화면 표시/],
        forbidden: [/Projection Settings/i, /Warm white projection/i],
      },
      {
        path: '/service/today',
        expected: [/예배 순서/, /예배 본문 붙여넣기/],
        forbidden: [/service playlist/i, /Service today/i],
      },
      {
        path: '/Psalms/23/5',
        expected: [/다음 절/, /장 바로가기/, /깨끗한 송출 탭/],
        forbidden: [/Presenter stays here/i, /Open the clean projector tab/i],
      },
    ] as const

    for (const target of auditTargets) {
      await page.goto(target.path)
      for (const expected of target.expected) {
        await expect(page.getByText(expected).first()).toBeVisible()
      }
      for (const forbidden of target.forbidden) {
        await expect(page.getByText(forbidden)).toHaveCount(0)
      }
    }
  })

  test('interactive controls expose pointer cursor affordances', async ({
    page,
  }) => {
    await page.goto('/')
    await expectPointerCursor(
      page.getByRole('link', { name: '도움말' }),
      'help nav link',
    )
    await expectPointerCursor(
      page.getByRole('option', { name: /시편 23장/ }),
      'home search suggestion',
    )

    await page.goto('/settings')
    await expectPointerCursor(
      page.getByLabel('따뜻한 흰색 송출'),
      'warm-white settings label',
    )
  })

  test('service playlist turns pasted references into operator-ready jump buttons', async ({
    page,
  }) => {
    await page.goto('/service/ui-ux')

    await page
      .getByLabel('예배 본문 붙여넣기')
      .fill('시 23:5-6, 요 3:16, 롬 8:28')

    const psalmRange = page.getByRole('button', { name: /시편 23장 5.*6절/ })
    const johnVerse = page.getByRole('button', { name: '요한복음 3장 16절' })
    const romansVerse = page.getByRole('button', { name: '로마서 8장 28절' })

    await expect(psalmRange).toBeVisible()
    await expect(johnVerse).toBeVisible()
    await expect(romansVerse).toBeVisible()

    await johnVerse.click()
    await expect(page).toHaveURL(/\/John\/3\/16$/)
  })
})
