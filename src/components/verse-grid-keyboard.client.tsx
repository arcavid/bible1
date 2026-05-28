'use client'

import { useEffect, useState } from 'react'

const NAVIGATION_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
])

export function VerseGridKeyboard(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('[data-verse-grid]')
    if (!grid) return

    const links = (): HTMLAnchorElement[] =>
      Array.from(grid.querySelectorAll<HTMLAnchorElement>('[data-verse-link]'))

    function focusAt(index: number): void {
      const items = links()
      const next = items[Math.max(0, Math.min(index, items.length - 1))]
      next?.focus()
    }

    function focusVertical(
      items: HTMLAnchorElement[],
      currentIndex: number,
      direction: 'up' | 'down',
    ): void {
      const current = items[currentIndex]
      if (!current) return
      const currentRect = current.getBoundingClientRect()
      const currentCenterX = currentRect.left + currentRect.width / 2
      const candidates = items
        .map((item, index) => ({
          item,
          index,
          rect: item.getBoundingClientRect(),
        }))
        .filter(({ index, rect }) => {
          if (index === currentIndex) return false
          return direction === 'down'
            ? rect.top > currentRect.top + 1
            : rect.bottom < currentRect.bottom - 1
        })
        .sort((a, b) => {
          const aVertical =
            direction === 'down'
              ? a.rect.top - currentRect.bottom
              : currentRect.top - a.rect.bottom
          const bVertical =
            direction === 'down'
              ? b.rect.top - currentRect.bottom
              : currentRect.top - b.rect.bottom
          if (Math.abs(aVertical - bVertical) > 1) return aVertical - bVertical
          const aCenterX = a.rect.left + a.rect.width / 2
          const bCenterX = b.rect.left + b.rect.width / 2
          return (
            Math.abs(aCenterX - currentCenterX) -
            Math.abs(bCenterX - currentCenterX)
          )
        })

      const target = candidates[0]
      if (target) focusAt(target.index)
    }

    function shouldIgnore(event: KeyboardEvent): boolean {
      if (event.altKey || event.metaKey || event.ctrlKey) return true
      const target = event.target
      if (!(target instanceof HTMLElement)) return false
      return Boolean(
        target.closest(
          'input, textarea, select, button, [contenteditable="true"]',
        ),
      )
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (!NAVIGATION_KEYS.has(event.key) || shouldIgnore(event)) return
      const items = links()
      if (items.length === 0) return

      const index = items.findIndex((item) => item === document.activeElement)
      const focusIsInGrid = index >= 0
      if (!focusIsInGrid) {
        event.preventDefault()
        focusAt(
          event.key === 'ArrowLeft' ||
            event.key === 'ArrowUp' ||
            event.key === 'End'
            ? items.length - 1
            : 0,
        )
        return
      }

      event.preventDefault()
      if (event.key === 'ArrowRight') focusAt(index + 1)
      if (event.key === 'ArrowLeft') focusAt(index - 1)
      if (event.key === 'ArrowDown') focusVertical(items, index, 'down')
      if (event.key === 'ArrowUp') focusVertical(items, index, 'up')
      if (event.key === 'Home') focusAt(0)
      if (event.key === 'End') focusAt(items.length - 1)
    }

    window.addEventListener('keydown', onKeyDown)
    setIsReady(true)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <span
      className="sr-only"
      data-verse-grid-keyboard-ready={isReady ? 'true' : 'false'}
    >
      방향키로 절 번호를 이동할 수 있습니다.
    </span>
  )
}
