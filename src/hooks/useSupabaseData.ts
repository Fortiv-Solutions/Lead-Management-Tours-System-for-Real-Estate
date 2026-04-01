import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Property,
  Lead,
  EngagementLog,
  PipelineStats,
  LeadStage,
  LeadPriorityLevel,
  Followup,
} from '@/types'
import type { VtProperty, VtLead, VtActivityLog, DbLead, DbMessage, DbFollowup } from '@/types/database'
import type { Conversation, Message } from '@/types'


// ─── Mapper Functions ─────────────────────────────────────────────
// These convert raw Supabase rows into the UI-friendly shape.

function mapPriorityToStage(priority: string | null): LeadStage {
  switch (priority?.toLowerCase()) {
    case 'hot':
      return 'Virtual Tour Sent'
    case 'warm':
      return 'Needs clarification'
    case 'cold':
      return 'Follow Up'
    default:
      return 'Needs clarification'
  }
}

function normalizePriority(priority: string | null): LeadPriorityLevel {
  switch (priority?.toLowerCase()) {
    case 'hot':
      return 'Hot'
    case 'warm':
      return 'Warm'
    case 'cold':
      return 'Cold'
    default:
      return 'Warm'
  }
}

function computeBadge(createdAt: string | null): Property['badge'] {
  if (!createdAt) return null
  const daysSinceListed = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceListed <= 7) return 'NEW_LISTING'
  return null
}

function mapProperty(
  row: VtProperty,
  activityLogs: VtActivityLog[],
  hotPropertyIds: Set<string>
): Property {
  const logsForProperty = activityLogs.filter((l) => l.property_id === row.property_id)

  return {
    id: row.id,
    propertyId: row.property_id ?? '',
    propertyType: row.property_type ?? 'Real Estate',
    price: Number(row.price) || 0,
    sqft: row.sqft ?? 0,
    address: row.address ?? 'Unknown Address',
    tourLink: row.tour_link ?? null,
    agentName: row.agent_name ?? 'Unassigned',
    agentEmail: row.agent_email ?? '',
    createdAt: row.created_at,
    badge: hotPropertyIds.has(row.property_id ?? '')
      ? 'HOT_ASSET'
      : computeBadge(row.created_at),
    activeLeads: logsForProperty.length,
    engagement: logsForProperty.map(mapActivityLog),
  }
}

function mapLead(row: VtLead): Lead {
  return {
    id: row.id,
    name: row.full_name ?? 'Unknown',
    email: row.email,
    phone: row.phone,
    stage: mapPriorityToStage(row.lead_priority),
    priceRange: row.budget_range,
    timeline: row.purchase_timeline,
    leadScore: row.lead_score ?? 0,
    priority: normalizePriority(row.lead_priority),
    createdAt: row.created_at,
  }
}

function mapLeadFromDb(row: DbLead): Lead {
  // Determine Stage
  const state = typeof row.conversation_state === 'string' 
    ? row.conversation_state 
    : (row.conversation_state as any)?.stage || 'need_clarification'
    
  let stage: LeadStage = 'Needs clarification'
  const s = String(state).toLowerCase()
  if (s.includes('clarification')) stage = 'Needs clarification'
  else if (s.includes('virtual_tour_sent') || s.includes('tour_sent')) stage = 'Virtual Tour Sent'
  else if (s.includes('ready_to_engage') || s.includes('engage')) stage = 'Ready to engage'
  else if (s.includes('follow_up') || s.includes('cold')) stage = 'Follow Up'
  else if (s.includes('outcome') || s.includes('closed')) stage = 'Outcome'

  // Determine Priority Level based on lead_score
  const score = row.lead_score ?? 0
  let priority: LeadPriorityLevel = 'Warm'
  if (score >= 80) priority = 'Hot'
  else if (score < 40) priority = 'Cold'

  // Format Budget Range
  let budget_range = '—'
  if (row.budget_min && row.budget_max) {
    if (row.budget_min === row.budget_max) {
      budget_range = row.budget_min
    } else {
      budget_range = `${row.budget_min} - ${row.budget_max}`
    }
  } else if (row.budget_min || row.budget_max) {
    budget_range = row.budget_min || row.budget_max || '—'
  }

  return {
    id: row.id,
    name: row.name && row.name !== 'unknown_name' ? row.name : 'User',
    email: row.email,
    phone: row.phone,
    stage: stage,
    priceRange: budget_range,
    timeline: row.timeline,
    leadScore: score,
    priority: priority,
    createdAt: row.created_at,
  }
}

function mapActivityLog(row: VtActivityLog): EngagementLog {
  return {
    id: row.id,
    propertyId: row.property_id,
    timestamp: row.timestamp ?? row.created_at,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone_number,
    status: row.status,
    leadScore: row.lead_score,
    leadPriority: row.lead_priority,
    buyerBudget: row.buyer_budget,
    buyerTimeline: row.buyer_timeline,
    budgetMatch: row.budget_match,
    budgetMatchNote: row.budget_match_note,
    agentNotified: row.agent_notified,
    tourLinkSent: row.tour_link_sent,
  }
}

function mapMessage(row: DbMessage): Message {
  return {
    id: row.id,
    leadId: row.lead_id ?? '',
    direction: (row.direction as 'inbound' | 'outbound') || 'inbound',
    channel: row.channel || 'Unknown',
    content: row.content || '',
    createdAt: row.created_at,
  }
}

function mapFollowup(row: DbFollowup, lead?: DbLead): Followup {
  // Format budget
  let budgetStr = undefined
  if (lead?.budget_min || lead?.budget_max) {
    if (lead.budget_min && lead.budget_max) {
      budgetStr = lead.budget_min === lead.budget_max ? lead.budget_min : `${lead.budget_min} - ${lead.budget_max}`
    } else {
      budgetStr = lead.budget_min || lead.budget_max
    }
  }

  return {
    id: row.id,
    leadId: row.lead_id ?? '',
    leadName: lead?.name && lead.name !== 'unknown_name' ? lead.name : 'WhatsApp User',
    leadScore: lead?.lead_score ?? undefined,
    leadBudget: budgetStr ?? undefined,
    leadSource: lead?.source ? normalizeSource(lead.source) : undefined,
    scheduledAt: row.scheduled_at,
    type: row.followup_type,
    templateName: row.template_name,
    status: (row.status as any) || 'pending',
    sentAt: row.sent_at,
    createdAt: row.created_at,
    channel: (row.channel?.toLowerCase() as any) || 'whatsapp',
  }
}

function normalizeSource(source: string | null): string {
  if (!source) return 'Website'
  const s = source.toLowerCase()
  if (s === 'website_form') return 'Website'
  if (s === 'instagram') return 'Instagram'
  if (s === 'whatsapp') return 'WhatsApp'
  // capitalize first letter
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function mapConversation(lead: DbLead, lastMessageContent?: string): Conversation {
  // Format budget string
  let budgetStr = null
  if (lead.budget_min || lead.budget_max) {
    if (lead.budget_min && lead.budget_max) {
      budgetStr = `${lead.budget_min} - ${lead.budget_max}`
    } else {
      budgetStr = lead.budget_min || lead.budget_max
    }
  }

  return {
    id: lead.id,
    leadId: lead.id,
    name: lead.name && lead.name !== 'unknown_name' ? lead.name : 'User',
    source: normalizeSource(lead.source),
    lastMessage: lastMessageContent || null,
    lastMessageAt: lead.last_message_at,
    platform: normalizeSource(lead.source),
    phone: lead.phone,
    location: lead.location,
    intent: lead.intent && lead.intent !== 'unknown_intent' ? lead.intent : null,
    matchScore: lead.lead_score ?? 0,
    budget: budgetStr,
    timeline: lead.timeline,
    propertyType: lead.property_type,
    bedrooms: lead.bedrooms,
    state: typeof lead.conversation_state === 'string' ? lead.conversation_state : lead.conversation_state?.stage || null,
    qualificationStatus: lead.qualification_status,
    joinedAt: lead.created_at,
  }
}


// ─── Generic Fetching Utility ─────────────────────────────────────

interface UseQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// ─── Properties Hook ──────────────────────────────────────────────

export function useProperties(): UseQueryResult<Property> {
  const [data, setData] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch properties and activity logs in parallel
      const [propResult, actResult] = await Promise.all([
        supabase.from('vt_properties').select('*').order('created_at', { ascending: false }),
        supabase.from('vt_activity_log').select('*'),
      ])

      if (propResult.error) throw propResult.error
      if (actResult.error) throw actResult.error

      const activityLogs = (actResult.data ?? []) as VtActivityLog[]

      // Find "hot" property IDs: properties with 2+ activity logs
      const propertyLogCounts = new Map<string, number>()
      for (const log of activityLogs) {
        if (log.property_id) {
          propertyLogCounts.set(
            log.property_id,
            (propertyLogCounts.get(log.property_id) ?? 0) + 1
          )
        }
      }
      const hotPropertyIds = new Set<string>()
      for (const [pid, count] of propertyLogCounts) {
        if (count >= 2) hotPropertyIds.add(pid)
      }

      const mapped = ((propResult.data ?? []) as VtProperty[]).map((p) =>
        mapProperty(p, activityLogs, hotPropertyIds)
      )

      setData(mapped)
    } catch (err: any) {
      console.error('[useProperties] Error:', err)
      setError(err.message ?? 'Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Leads Hook ───────────────────────────────────────────────────

export function useLeads(): UseQueryResult<Lead> {
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: rows, error: queryError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      setData(((rows ?? []) as DbLead[]).map(mapLeadFromDb))
    } catch (err: any) {
      console.error('[useLeads] Error:', err)
      setError(err.message ?? 'Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}



// ─── Activity Logs Hook ──────────────────────────────────────────

export function useActivityLogs(): UseQueryResult<EngagementLog> {
  const [data, setData] = useState<EngagementLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: rows, error: queryError } = await supabase
        .from('vt_activity_log')
        .select('*')
        .order('timestamp', { ascending: false })

      if (queryError) throw queryError

      setData(((rows ?? []) as VtActivityLog[]).map(mapActivityLog))
    } catch (err: any) {
      console.error('[useActivityLogs] Error:', err)
      setError(err.message ?? 'Failed to fetch activity logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Pipeline Stats (computed from leads) ────────────────────────

export function computePipelineStats(leads: Lead[]): PipelineStats {
  return {
    leadCaptured: leads.filter((l) => l.stage === 'Needs clarification').length,
    tourAssigned: leads.filter((l) => l.stage === 'Virtual Tour Sent').length,
    tourViewed: leads.filter((l) => l.stage === 'Ready to engage').length,
    followUp: leads.filter((l) => l.stage === 'Follow Up').length,
    outcome: leads.filter((l) => l.stage === 'Outcome').length,
  }
}

// ─── Conversations Hook ──────────────────────────────────────────

export function useConversations(): UseQueryResult<Conversation> {
  const [data, setData] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch leads
      const leadResult = await supabase
        .from('leads')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (leadResult.error) throw leadResult.error
      const leads = (leadResult.data ?? []) as DbLead[]

      // 2. Fetch last messages to populate the snippet
      const { data: msgRows, error: msgError } = await supabase
        .from('messages')
        .select('lead_id, content, created_at')
        .order('created_at', { ascending: false })

      if (msgError) throw msgError

      // Use a map to get the absolute latest message for each lead
      const latestMessageMap = new Map<string, string>()
      for (const msg of (msgRows ?? []) as DbMessage[]) {
        if (msg.lead_id && !latestMessageMap.has(msg.lead_id)) {
          latestMessageMap.set(msg.lead_id, msg.content ?? '')
        }
      }

      setData(leads.map((l) => mapConversation(l, latestMessageMap.get(l.id))))
    } catch (err: any) {
      console.error('[useConversations] Error:', err)
      setError(err.message ?? 'Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Messages Hook ───────────────────────────────────────────────

export function useMessages(leadId: string | null): UseQueryResult<Message> {
  const [data, setData] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!leadId) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: rows, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError
      setData(((rows ?? []) as DbMessage[]).map(mapMessage))
    } catch (err: any) {
      console.error('[useMessages] Error:', err)
      setError(err.message ?? 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Followups Hook ──────────────────────────────────────────────

export function useFollowups(): UseQueryResult<Followup> {
  const [data, setData] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch followups (excluding cancelled)
      const { data: followupRows, error: followupError } = await supabase
        .from('followup_queue')
        .select('*')
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })

      if (followupError) throw followupError
      const followups = (followupRows ?? []) as DbFollowup[]

      // 2. Fetch leads to map names and metadata
      const { data: leadRows, error: leadError } = await supabase
        .from('leads')
        .select('id, name, lead_score, budget_min, budget_max, source')

      if (leadError) throw leadError
      const leadMap = new Map<string, DbLead>()
      for (const lead of (leadRows ?? []) as DbLead[]) {
        if (lead.id) leadMap.set(lead.id, lead)
      }

      setData(followups.map((f) => mapFollowup(f, leadMap.get(f.lead_id ?? ''))))
    } catch (err: any) {
      console.error('[useFollowups] Error:', err)
      setError(err.message ?? 'Failed to fetch followups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

