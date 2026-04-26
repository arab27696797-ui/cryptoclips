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

  constructor(apiKey: string, webhookSecret: string) {
    this.apiKey = apiKey
    this.webhookSecret = webhookSecret
  }

  async createCheckout(_params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
    return {
      success: false,
      error: 'Tribute integration not yet implemented',
    }
  }

  async confirmPayment(_params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
    return {
      success: false,
      error: 'Tribute integration not yet implemented',
    }
  }

  async cancelSubscription(_tributeSubscriptionId: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Tribute integration not yet implemented',
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
