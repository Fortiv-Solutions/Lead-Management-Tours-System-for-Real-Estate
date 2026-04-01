/**
 * Application-level types that UI components consume.
 * These are mapped FROM the raw Supabase DB types in the hooks layer.
 */



// ─── Property ───────────────────────────────────────────────────

export interface Property {
  id: string
  propertyId: string        // Display ID like "P1", "P7"
  propertyType: string      // "Real Estate", "Commercial Estate"
  price: number
  sqft: number
  address: string
  tourLink: string | null   // Actual virtual tour URL
  agentName: string
  agentEmail: string
  createdAt: string | null
  // Computed fields
  badge?: 'HOT_ASSET' | 'NEW_LISTING' | null
  activeLeads: number       // Computed from activity_log count
  engagement: EngagementLog[]
}

// ─── EngagementLog (from vt_activity_log) ───────────────────────

export interface EngagementLog {
  id: string
  propertyId: string | null
  timestamp: string | null
  buyerName: string | null
  buyerEmail: string | null
  buyerPhone: string | null
  status: string | null         // "Tour Link Sent", etc.
  leadScore: number | null
  leadPriority: string | null
  buyerBudget: string | null
  buyerTimeline: string | null
  budgetMatch: string | null
  budgetMatchNote: string | null
  agentNotified: boolean | null
  tourLinkSent: string | null
}

// ─── Lead (from vt_leads) ───────────────────────────────────────

export type LeadStage = 'Needs clarification' | 'Virtual Tour Sent' | 'Ready to engage' | 'Follow Up' | 'Outcome'
export type LeadPriorityLevel = 'Hot' | 'Warm' | 'Cold'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  stage: LeadStage             // Derived from lead_priority
  priceRange: string | null    // budget_range
  timeline: string | null      // purchase_timeline
  leadScore: number
  priority: LeadPriorityLevel  // Raw from DB
  createdAt: string | null
}

// ─── Pipeline Stats (computed client-side) ──────────────────────

export interface PipelineStats {
  leadCaptured: number
  tourAssigned: number
  tourViewed: number
  followUp: number
  outcome: number
}

// ─── Filter Options (unchanged — UI-only) ───────────────────────

export interface FilterOptions {
  sortBy?: 'price-high' | 'price-low' | 'recent'
  stage?: string
  priority?: 'H' | 'M' | 'L'
  leadScoreMin?: number
  leadScoreMax?: number
  dateRange?: {
    start: Date
    end: Date
  }
}

// ─── Conversations & Messages ───────────────────────────────────

export interface Message {
  id: string
  leadId: string
  direction: 'inbound' | 'outbound'
  channel: string
  content: string
  createdAt: string | null
}

export interface Conversation {
  id: string
  leadId: string
  name: string
  source: string
  lastMessage: string | null
  lastMessageAt: string | null
  platform: string
  phone: string | null
  location: string | null
  intent: string | null
  matchScore: number
  budget?: string | null
  timeline?: string | null
  propertyType?: string | null
  bedrooms?: string | null
  unread?: boolean
  state: any | null
  qualificationStatus: string | null
  joinedAt: string | null
}

// ─── Follow-up Queue ─────────────────────────────────────────────

export type FollowupStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
export type FollowupChannel = 'whatsapp' | 'email' | 'sms'

export interface Followup {
  id: string
  leadId: string
  leadName?: string
  leadScore?: number
  leadBudget?: string
  leadSource?: string
  scheduledAt: string | null
  type: string | null         // e.g., "Virtual Tour Demo", "Price Drop Alert"
  templateName: string | null
  status: FollowupStatus
  sentAt: string | null
  createdAt: string | null
  channel: FollowupChannel
}
