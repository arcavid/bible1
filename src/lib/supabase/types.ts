export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Table<Row, Insert, Update, Relationships = []> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationships
}

type TimestampColumns = {
  created_at: string
  updated_at: string
}

type OptionalTimestampColumns = {
  created_at?: string
  updated_at?: string
}

export type Database = {
  public: {
    Tables: {
      bible_translations: Table<
        TimestampColumns & {
          id: string
          code: string
          language_code: string
          name_ko: string
          name_en: string | null
          abbreviation: string
          source_name: string | null
          source_license_note: string | null
          source_url: string | null
          status: 'active' | 'draft' | 'archived'
        },
        OptionalTimestampColumns & {
          id?: string
          code: string
          language_code?: string
          name_ko: string
          name_en?: string | null
          abbreviation: string
          source_name?: string | null
          source_license_note?: string | null
          source_url?: string | null
          status?: 'active' | 'draft' | 'archived'
        },
        OptionalTimestampColumns & {
          id?: string
          code?: string
          language_code?: string
          name_ko?: string
          name_en?: string | null
          abbreviation?: string
          source_name?: string | null
          source_license_note?: string | null
          source_url?: string | null
          status?: 'active' | 'draft' | 'archived'
        }
      >
      bible_books: Table<
        TimestampColumns & {
          id: string
          translation_id: string
          book_order: number
          slug: string
          osis_code: string | null
          korean_name: string
          abbreviation: string
          testament: 'old' | 'new'
          chapter_count: number
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id: string
          book_order: number
          slug: string
          osis_code?: string | null
          korean_name: string
          abbreviation: string
          testament: 'old' | 'new'
          chapter_count: number
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id?: string
          book_order?: number
          slug?: string
          osis_code?: string | null
          korean_name?: string
          abbreviation?: string
          testament?: 'old' | 'new'
          chapter_count?: number
        }
      >
      bible_book_aliases: Table<
        {
          id: string
          book_id: string
          alias: string
          normalized_alias: string
          alias_kind:
            | 'korean'
            | 'abbreviation'
            | 'english'
            | 'legacy'
            | 'manual'
          created_at: string
        },
        {
          id?: string
          book_id: string
          alias: string
          normalized_alias: string
          alias_kind?:
            | 'korean'
            | 'abbreviation'
            | 'english'
            | 'legacy'
            | 'manual'
          created_at?: string
        },
        {
          id?: string
          book_id?: string
          alias?: string
          normalized_alias?: string
          alias_kind?:
            | 'korean'
            | 'abbreviation'
            | 'english'
            | 'legacy'
            | 'manual'
          created_at?: string
        }
      >
      bible_chapters: Table<
        TimestampColumns & {
          id: string
          translation_id: string
          book_id: string
          chapter_number: number
          verse_count: number
          source_hash: string
          anomalies: Json
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id: string
          book_id: string
          chapter_number: number
          verse_count: number
          source_hash: string
          anomalies?: Json
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id?: string
          book_id?: string
          chapter_number?: number
          verse_count?: number
          source_hash?: string
          anomalies?: Json
        }
      >
      bible_verses: Table<
        TimestampColumns & {
          id: string
          translation_id: string
          book_id: string
          chapter_id: string
          chapter_number: number
          ordinal: number
          verse_number: number
          text: string
          text_nfc: string
          source_line_hash: string
          anomaly_note: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id: string
          book_id: string
          chapter_id: string
          chapter_number: number
          ordinal: number
          verse_number: number
          text: string
          text_nfc: string
          source_line_hash: string
          anomaly_note?: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id?: string
          book_id?: string
          chapter_id?: string
          chapter_number?: number
          ordinal?: number
          verse_number?: number
          text?: string
          text_nfc?: string
          source_line_hash?: string
          anomaly_note?: string | null
        }
      >
      corpus_releases: Table<
        TimestampColumns & {
          id: string
          translation_id: string
          release_slug: string
          source_repo: string | null
          source_commit_sha: string | null
          source_manifest_sha256: string
          generated_manifest_sha256: string
          total_books: number
          total_chapters: number
          total_verses: number
          anomaly_count: number
          status: 'draft' | 'published' | 'superseded' | 'failed'
          validation_report: Json
          published_at: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id: string
          release_slug: string
          source_repo?: string | null
          source_commit_sha?: string | null
          source_manifest_sha256: string
          generated_manifest_sha256: string
          total_books: number
          total_chapters: number
          total_verses: number
          anomaly_count?: number
          status?: 'draft' | 'published' | 'superseded' | 'failed'
          validation_report?: Json
          published_at?: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          translation_id?: string
          release_slug?: string
          source_repo?: string | null
          source_commit_sha?: string | null
          source_manifest_sha256?: string
          generated_manifest_sha256?: string
          total_books?: number
          total_chapters?: number
          total_verses?: number
          anomaly_count?: number
          status?: 'draft' | 'published' | 'superseded' | 'failed'
          validation_report?: Json
          published_at?: string | null
        }
      >
      service_plans: Table<
        TimestampColumns & {
          id: string
          slug: string
          title: string
          raw_input: string
          notes: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          slug: string
          title?: string
          raw_input?: string
          notes?: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          slug?: string
          title?: string
          raw_input?: string
          notes?: string | null
        }
      >
      service_plan_items: Table<
        {
          id: string
          service_plan_id: string
          position: number
          translation_code: string
          translation_id: string | null
          book_id: string | null
          chapter_id: string | null
          start_verse_id: string | null
          end_verse_id: string | null
          book_slug: string
          chapter: number
          start_verse: number | null
          end_verse: number | null
          label: string
          href: string
          raw_ref: string
          parsed_range: Json
          validation_status: 'valid' | 'ambiguous' | 'invalid' | 'unresolved'
          created_at: string
        },
        {
          id?: string
          service_plan_id: string
          position: number
          translation_code?: string
          translation_id?: string | null
          book_id?: string | null
          chapter_id?: string | null
          start_verse_id?: string | null
          end_verse_id?: string | null
          book_slug: string
          chapter: number
          start_verse?: number | null
          end_verse?: number | null
          label: string
          href: string
          raw_ref: string
          parsed_range?: Json
          validation_status?: 'valid' | 'ambiguous' | 'invalid' | 'unresolved'
          created_at?: string
        },
        {
          id?: string
          service_plan_id?: string
          position?: number
          translation_code?: string
          translation_id?: string | null
          book_id?: string | null
          chapter_id?: string | null
          start_verse_id?: string | null
          end_verse_id?: string | null
          book_slug?: string
          chapter?: number
          start_verse?: number | null
          end_verse?: number | null
          label?: string
          href?: string
          raw_ref?: string
          parsed_range?: Json
          validation_status?: 'valid' | 'ambiguous' | 'invalid' | 'unresolved'
          created_at?: string
        }
      >
      live_sessions: Table<
        TimestampColumns & {
          id: string
          slug: string
          current_href: string
          reference: string
          translation_code: string
          translation_id: string | null
          current_verse_id: string | null
          preview_verse_id: string | null
          current_text_snapshot: string | null
          state_version: number
          presenter_client_id: string | null
          last_heartbeat_at: string | null
          book_slug: string
          chapter: number
          verse: number
          ordinal: number
          number: number
          text: string
          blackout: boolean
          service_plan_id: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          slug: string
          current_href: string
          reference: string
          translation_code?: string
          translation_id?: string | null
          current_verse_id?: string | null
          preview_verse_id?: string | null
          current_text_snapshot?: string | null
          state_version?: number
          presenter_client_id?: string | null
          last_heartbeat_at?: string | null
          book_slug: string
          chapter: number
          verse: number
          ordinal: number
          number: number
          text: string
          blackout?: boolean
          service_plan_id?: string | null
        },
        OptionalTimestampColumns & {
          id?: string
          slug?: string
          current_href?: string
          reference?: string
          translation_code?: string
          translation_id?: string | null
          current_verse_id?: string | null
          preview_verse_id?: string | null
          current_text_snapshot?: string | null
          state_version?: number
          presenter_client_id?: string | null
          last_heartbeat_at?: string | null
          book_slug?: string
          chapter?: number
          verse?: number
          ordinal?: number
          number?: number
          text?: string
          blackout?: boolean
          service_plan_id?: string | null
        }
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
