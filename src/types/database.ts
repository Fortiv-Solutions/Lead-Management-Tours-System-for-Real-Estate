/**
 * Supabase Database Types — Auto-generated from schema inspection
 * These types mirror the actual Supabase table structure for type safety.
 */

export interface Database {
  public: {
    Tables: {
      vt_properties: {
        Row: VtProperty
        Insert: Omit<VtProperty, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<VtProperty>
      }
      vt_leads: {
        Row: VtLead
        Insert: Omit<VtLead, 'id' | 'created_at'> & { id?: string }
        Update: Partial<VtLead>
      },
      leads: {
        Row: DbLead
        Insert: Omit<DbLead, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DbLead>
      },
      messages: {
        Row: DbMessage
        Insert: Omit<DbMessage, 'id' | 'created_at'> & { id?: string }
        Update: Partial<DbMessage>
      },

      vt_activity_log: {
        Row: VtActivityLog
        Insert: Omit<VtActivityLog, 'id'> & { id?: string }
        Update: Partial<VtActivityLog>
      }
      vt_tour_summary: {
        Row: VtTourSummary
        Insert: Omit<VtTourSummary, 'id'> & { id?: string }
        Update: Partial<VtTourSummary>
      }
      vt_cold_leads: {
        Row: VtColdLead
        Insert: Omit<VtColdLead, 'id'> & { id?: string }
        Update: Partial<VtColdLead>
      },
      followup_queue: {
        Row: DbFollowup
        Insert: Omit<DbFollowup, 'id' | 'created_at'> & { id?: string }
        Update: Partial<DbFollowup>
      }
    }
  }
}

// ─── Raw DB Row Types ─────────────────────────────────────────────

export interface VtProperty {
  id: string
  property_id: string | null
  property_type: string | null
  price: number | null
  sqft: number | null
  address: string | null
  tour_link: string | null
  agent_name: string | null
  agent_email: string | null
  created_at: string | null
  updated_at: string | null
}

export interface VtLead {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  budget_range: string | null
  purchase_timeline: string | null
  lead_score: number | null
  lead_priority: string | null
  created_at: string | null
}



export interface VtActivityLog {
  id: string
  property_id: string | null
  timestamp: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone_number: string | null
  address: string | null
  tour_link_sent: string | null
  status: string | null
  lead_score: number | null
  lead_priority: string | null
  buyer_budget: string | null
  buyer_timeline: string | null
  budget_match: string | null
  budget_match_note: string | null
  agent_notified: boolean | null
  created_at: string | null
}

export interface VtTourSummary {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone_number: string | null
  total_properties: number | null
  properties_list: string | null
  buyer_budget: string | null
  buyer_timeline: string | null
  summary_status: string | null
  created_at: string | null
}

export interface VtColdLead {
  id: string
  property_id: string | null
  timestamp: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone_number: string | null
  address: string | null
  tour_link_sent: string | null
  status: string | null
  lead_score: number | null
  lead_priority: string | null
  buyer_budget: string | null
  buyer_timeline: string | null
  created_at: string | null
}

export interface DbLead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  intent: string | null
  lead_score: number | null
  source: string | null
  budget_min: string | null
  budget_max: string | null
  property_type: string | null
  bedrooms: string | null
  timeline: string | null
  conversation_state: any | null
  qualification_status: string | null
  last_message_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DbMessage {
  id: string
  lead_id: string | null
  direction: string | null
  channel: string | null
  content: string | null
  created_at: string | null
}

export interface DbFollowup {
  id: string
  lead_id: string | null
  scheduled_at: string | null
  followup_type: string | null
  template_name: string | null
  status: string | null
  sent_at: string | null
  created_at: string | null
  channel: string | null
}
