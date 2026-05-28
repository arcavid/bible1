import 'server-only'

import {
  parseServicePlanInput,
  toServicePlanItemRows,
} from '@/lib/service-plan'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type ServicePlanRow = Database['public']['Tables']['service_plans']['Row']
type ServicePlanItemRow =
  Database['public']['Tables']['service_plan_items']['Row']
type SupabaseErrorLike = { message: string }

export type ServicePlanSnapshot = {
  slug: string
  title: string
  rawInput: string
  notes: string | null
  updatedAt: string
  items: Array<{
    position: number
    rawRef: string
    translationCode: string
    translationId: string | null
    bookId: string | null
    chapterId: string | null
    startVerseId: string | null
    endVerseId: string | null
    book: string
    chapter: number
    startVerse: number | null
    endVerse: number | null
    label: string
    href: string
    parsedRange: Database['public']['Tables']['service_plan_items']['Row']['parsed_range']
    validationStatus: Database['public']['Tables']['service_plan_items']['Row']['validation_status']
  }>
}

export type ServicePlanStoreResult =
  | { configured: false }
  | { configured: true; plan: ServicePlanSnapshot | null }

export async function readServicePlan(
  slug: string,
): Promise<ServicePlanStoreResult> {
  const supabase = getServerSupabaseClient()
  if (!supabase) return { configured: false }

  const planResult = (await supabase
    .from('service_plans')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()) as {
    data: ServicePlanRow | null
    error: SupabaseErrorLike | null
  }

  if (planResult.error) throw new Error(planResult.error.message)
  if (!planResult.data) return { configured: true, plan: null }

  const plan = planResult.data
  const itemsResult = (await supabase
    .from('service_plan_items')
    .select('*')
    .eq('service_plan_id', plan.id)
    .order('position', { ascending: true })) as {
    data: ServicePlanItemRow[] | null
    error: SupabaseErrorLike | null
  }

  if (itemsResult.error) throw new Error(itemsResult.error.message)

  return {
    configured: true,
    plan: toSnapshot(plan, itemsResult.data ?? []),
  }
}

export async function upsertServicePlan({
  slug,
  rawInput,
  title = 'Service',
  notes = null,
}: {
  slug: string
  rawInput: string
  title?: string
  notes?: string | null
}): Promise<ServicePlanStoreResult> {
  const supabase = getServerSupabaseClient()
  if (!supabase) return { configured: false }

  const planResult = (await supabase
    .from('service_plans')
    .upsert(
      {
        slug,
        title,
        raw_input: rawInput,
        notes,
      },
      { onConflict: 'slug' },
    )
    .select('*')
    .single()) as { data: ServicePlanRow; error: SupabaseErrorLike | null }

  if (planResult.error) throw new Error(planResult.error.message)
  const plan = planResult.data

  const deleteResult = (await supabase
    .from('service_plan_items')
    .delete()
    .eq('service_plan_id', plan.id)) as { error: SupabaseErrorLike | null }

  if (deleteResult.error) throw new Error(deleteResult.error.message)

  const parsedItems = parseServicePlanInput(rawInput)
  const rows = toServicePlanItemRows(plan.id, parsedItems)

  if (rows.length > 0) {
    const insertResult = (await supabase
      .from('service_plan_items')
      .insert(rows)) as { error: SupabaseErrorLike | null }
    if (insertResult.error) throw new Error(insertResult.error.message)
  }

  return readServicePlan(slug)
}

function toSnapshot(
  plan: ServicePlanRow,
  items: ServicePlanItemRow[],
): ServicePlanSnapshot {
  return {
    slug: plan.slug,
    title: plan.title,
    rawInput: plan.raw_input,
    notes: plan.notes,
    updatedAt: plan.updated_at,
    items: items.map((item) => ({
      position: item.position,
      rawRef: item.raw_ref,
      translationCode: item.translation_code,
      translationId: item.translation_id,
      bookId: item.book_id,
      chapterId: item.chapter_id,
      startVerseId: item.start_verse_id,
      endVerseId: item.end_verse_id,
      book: item.book_slug,
      chapter: item.chapter,
      startVerse: item.start_verse,
      endVerse: item.end_verse,
      label: item.label,
      href: item.href,
      parsedRange: item.parsed_range,
      validationStatus: item.validation_status,
    })),
  }
}
