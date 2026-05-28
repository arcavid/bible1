import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'bible1',
    short_name: 'bible1',
    description: '한국어 예배 송출 성경',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
  }
}
