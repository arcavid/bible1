import type { MetadataRoute } from 'next'

import { getAllChapterRefs } from '@/lib/bible/corpus'
import { chapterHref } from '@/lib/bible/reference'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bible1.app'
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/help`, changeFrequency: 'monthly', priority: 0.3 },
    ...getAllChapterRefs().map((ref) => ({
      url: `${base}${chapterHref(ref)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
