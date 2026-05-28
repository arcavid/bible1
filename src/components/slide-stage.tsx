import type { Verse } from '@/lib/bible/types'

export function SlideStage({
  reference,
  verse,
  compact = false,
}: {
  reference: string
  verse: Verse
  compact?: boolean
}): React.JSX.Element {
  return (
    <div
      className="projection-stage projection-preview projection-transition stage-text flex aspect-video h-auto min-h-0 w-full flex-col justify-between overflow-hidden bg-black"
      data-projection-preview
    >
      <div className="projection-preview-content flex min-h-0 items-start">
        <div
          className={
            compact
              ? 'projection-verse-number shrink-0 text-3xl leading-none font-bold opacity-70'
              : 'projection-verse-number projection-preview-number shrink-0 font-bold opacity-80'
          }
          data-projection-verse-number
        >
          {verse.number}
        </div>
        <div
          className={
            compact
              ? 'min-w-0 text-4xl leading-relaxed font-semibold'
              : 'projection-preview-text min-w-0 font-semibold'
          }
          data-projection-verse-text
        >
          {verse.text}
        </div>
      </div>
      <div
        className="projection-preview-reference flex justify-end font-semibold opacity-60"
        data-projection-reference
      >
        {reference}
      </div>
    </div>
  )
}
