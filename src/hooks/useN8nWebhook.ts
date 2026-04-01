import { useCallback, useState } from 'react'

interface WebhookPayload {
  [key: string]: any
}

interface WebhookResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Hook for integrating with n8n webhooks
 * Configure webhook endpoints via environment variables:
 * VITE_N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com/webhook
 * 
 * Example usage:
 * const { triggerWebhook, loading } = useN8nWebhook('tour-created')
 * const handleTourCreation = async (tourData) => {
 *   await triggerWebhook(tourData)
 * }
 */
export const useN8nWebhook = (workflowKey: string) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const triggerWebhook = useCallback(
    async (payload: WebhookPayload): Promise<WebhookResponse> => {
      setLoading(true)
      setError(null)

      try {
        const webhookUrl = `${import.meta.env.VITE_N8N_WEBHOOK_BASE_URL}/${workflowKey}`

        console.log('[v0] Triggering n8n webhook:', workflowKey, payload)

        // TODO: Uncomment when n8n webhook is configured
        /*
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'architectural-ledger',
            data: payload,
          }),
        })

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`)
        }

        const data = await response.json()
        return { success: true, data }
        */

        // Mock response for development
        return { success: true, data: { webhookKey: workflowKey, ...payload } }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        console.error('[v0] Webhook error:', errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [workflowKey],
  )

  return { triggerWebhook, loading, error }
}

/**
 * Specific webhook handlers for common events
 */
export const usePropertyWebhooks = () => {
  const { triggerWebhook: triggerTourLink } = useN8nWebhook('property-tour-created')
  const { triggerWebhook: triggerEngagementLog } = useN8nWebhook('property-engagement-logged')

  const onTourLinkCreated = useCallback(
    async (propertyId: string, leadId: string) => {
      return triggerTourLink({
        propertyId,
        leadId,
        action: 'tour_link_created',
      })
    },
    [triggerTourLink],
  )

  const onEngagementLogged = useCallback(
    async (propertyId: string, engagementType: string) => {
      return triggerEngagementLog({
        propertyId,
        engagementType,
        action: 'engagement_logged',
      })
    },
    [triggerEngagementLog],
  )

  return { onTourLinkCreated, onEngagementLogged }
}

export const useLeadWebhooks = () => {
  const { triggerWebhook: triggerLeadCreated } = useN8nWebhook('lead-created')
  const { triggerWebhook: triggerLeadUpdated } = useN8nWebhook('lead-stage-updated')
  const { triggerWebhook: triggerLeadAssigned } = useN8nWebhook('lead-assigned')

  const onLeadCreated = useCallback(
    async (leadData: any) => {
      return triggerLeadCreated({
        ...leadData,
        action: 'lead_created',
      })
    },
    [triggerLeadCreated],
  )

  const onLeadStageUpdated = useCallback(
    async (leadId: string, newStage: string, previousStage: string) => {
      return triggerLeadUpdated({
        leadId,
        newStage,
        previousStage,
        action: 'lead_stage_updated',
      })
    },
    [triggerLeadUpdated],
  )

  const onLeadAssigned = useCallback(
    async (leadId: string, agentId: string) => {
      return triggerLeadAssigned({
        leadId,
        agentId,
        action: 'lead_assigned',
      })
    },
    [triggerLeadAssigned],
  )

  return { onLeadCreated, onLeadStageUpdated, onLeadAssigned }
}
