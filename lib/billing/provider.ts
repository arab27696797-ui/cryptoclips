export interface BillingProviderConfig {
  mode: 'mock' | 'tribute'
  tributeApiKey?: string
  tributeWebhookSecret?: string
}

export interface CreateCheckoutParams {
  planId: string
  workspaceId: string
  billingEmail: string
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutResult {
  success: boolean
  checkoutUrl?: string
  paymentId?: string
  error?: string
}

export interface ConfirmPaymentParams {
  paymentId: string
  workspaceId: string
}

export interface ConfirmPaymentResult {
  success: boolean
  paidAmount?: number
  currency?: string
  error?: string
}

export interface BillingProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult>
  confirmPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult>
  cancelSubscription(tributeSubscriptionId: string): Promise<{ success: boolean; error?: string }>
}

class MockBillingProvider implements BillingProvider {
  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    const mockPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const mockCheckoutUrl = `/api/billing/confirm?paymentId=${mockPaymentId}&workspaceId=${params.workspaceId}&planId=${params.planId}`

    return {
      success: true,
      checkoutUrl: mockCheckoutUrl,
      paymentId: mockPaymentId,
    }
  }

  async confirmPayment(_params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      success: true,
      paidAmount: 1900,
      currency: 'USD',
    }
  }

  async cancelSubscription(_tributeSubscriptionId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: true,
    }
  }
}

class TributeBillingProvider implements BillingProvider {
  private apiKey: string
  private webhookSecret: string
  private baseUrl = 'https://api.tribute.com/v1'

  constructor(apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey
    this.webhookSecret = webhookSecret
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: params.planId,
          workspace_id: params.workspaceId,
          billing_email: params.billingEmail,
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          metadata: {
            workspaceId: params.workspaceId,
            planId: params.planId,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Tribute API error: ${response.status} ${error}`)
      }

      const data = await response.json()

      return {
        success: true,
        checkoutUrl: data.checkout_url,
        paymentId: data.payment_id || data.id,
      }
    } catch (error) {
      console.error('Tribute checkout error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tribute checkout failed',
      }
    }
  }

  async confirmPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${params.paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: params.workspaceId,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Tribute API error: ${response.status} ${error}`)
      }

      const data = await response.json()

      return {
        success: data.status === 'confirmed' || data.status === 'paid',
        paidAmount: data.amount,
        currency: data.currency,
      }
    } catch (error) {
      console.error('Tribute confirm error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tribute payment confirmation failed',
      }
    }
  }

  async cancelSubscription(tributeSubscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${tributeSubscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Tribute API error: ${response.status} ${error}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Tribute cancel error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tribute cancellation failed',
      }
    }
  }
}

export function getBillingProvider(config?: BillingProviderConfig): BillingProvider {
  const mode = config?.mode ?? process.env.BILLING_PROVIDER_MODE ?? 'mock'

  if (mode === 'tribute') {
    const apiKey = config?.tributeApiKey ?? process.env.TRIBUTE_API_KEY
    const webhookSecret = config?.tributeWebhookSecret ?? process.env.TRIBUTE_WEBHOOK_SECRET

    if (!apiKey || !webhookSecret) {
      console.warn('Tribute API credentials missing, falling back to mock provider')
      return new MockBillingProvider()
    }

    return new TributeBillingProvider(apiKey, webhookSecret)
  }

  return new MockBillingProvider()
}
