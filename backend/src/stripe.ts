
import Stripe from 'stripe';
import * as logger from 'firebase-functions/logger';

// Utiliser une clé factice si la vraie clé n'est pas présente pour éviter les erreurs de déploiement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_deployment', {
  apiVersion: '2025-01-27' as any, // Fixed version for stability
});

/**
 * Service to handle Stripe interactions for usage-based billing.
 */
export class StripeService {
  /**
   * Reports usage (billable lines) to a Stripe subscription item.
   * @param subscriptionItemId The ID of the subscription item which has metered billing enabled.
   * @param quantity The number of lines to report.
   */
  static async reportUsage(subscriptionItemId: string, quantity: number) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('Stripe Secret Key not found. Skipping usage reporting.');
      return;
    }

    try {
      logger.info(`Reporting ${quantity} lines to subscription item ${subscriptionItemId}`);
      await (stripe as any).subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });
    } catch (error) {
      logger.error('Error reporting usage to Stripe:', error);
      throw error;
    }
  }

  /**
   * Creates or retrieves a Stripe customer for a client.
   * @param email Client's email.
   * @param name Client's name.
   * @param metadata Optional metadata to store in Stripe.
   */
  static async getOrCreateCustomer(email: string, name: string, metadata?: Record<string, string>) {
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        return customers.data[0];
      }

      return await stripe.customers.create({
        email,
        name,
        metadata,
      });
    } catch (error) {
      logger.error('Error in getOrCreateCustomer:', error);
      throw error;
    }
  }

  /**
   * Creates a portal session for a customer to manage their billing.
   * @param customerId Stripe Customer ID.
   * @param returnUrl URL to return to after the portal.
   */
  static async createPortalSession(customerId: string, returnUrl: string) {
    try {
      return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    } catch (error) {
      logger.error('Error creating portal session:', error);
      throw error;
    }
  }
}
