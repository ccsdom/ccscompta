"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger = __importStar(require("firebase-functions/logger"));
// Utiliser une clé factice si la vraie clé n'est pas présente pour éviter les erreurs de déploiement
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_deployment', {
    apiVersion: '2025-01-27', // Fixed version for stability
});
/**
 * Service to handle Stripe interactions for usage-based billing.
 */
class StripeService {
    /**
     * Constructs a Stripe event from a webhook payload.
     */
    static constructWebhookEvent(rawBody, signature, secret) {
        try {
            return stripe.webhooks.constructEvent(rawBody, signature, secret);
        }
        catch (err) {
            logger.error('Error constructing Stripe event:', err);
            throw err;
        }
    }
    /**
     * Creates a Stripe Checkout Session for a cabinet to subscribe to a plan.
     */
    static async createCheckoutSession(cabinetId, priceId, customerEmail, successUrl, cancelUrl) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer_email: customerEmail,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1, // Optional depending on the price type, but usually 1 for base subscription
                    },
                ],
                metadata: {
                    cabinetId, // Crucial for webhook matching
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
            return session;
        }
        catch (error) {
            logger.error('Error creating checkout session:', error);
            throw error;
        }
    }
    /**
     * Reports usage (billable lines) to a Stripe subscription item.
     * @param subscriptionItemId The ID of the subscription item which has metered billing enabled.
     * @param quantity The number of lines to report.
     */
    static async reportUsage(subscriptionItemId, quantity) {
        if (!process.env.STRIPE_SECRET_KEY) {
            logger.warn('Stripe Secret Key not found. Skipping usage reporting.');
            return;
        }
        try {
            logger.info(`Reporting ${quantity} lines to subscription item ${subscriptionItemId}`);
            await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
                quantity,
                timestamp: Math.floor(Date.now() / 1000),
                action: 'increment',
            });
        }
        catch (error) {
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
    static async getOrCreateCustomer(email, name, metadata) {
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
        }
        catch (error) {
            logger.error('Error in getOrCreateCustomer:', error);
            throw error;
        }
    }
    /**
     * Creates a portal session for a customer to manage their billing.
     * @param customerId Stripe Customer ID.
     * @param returnUrl URL to return to after the portal.
     */
    static async createPortalSession(customerId, returnUrl) {
        try {
            return await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
        }
        catch (error) {
            logger.error('Error creating portal session:', error);
            throw error;
        }
    }
    /**
     * Retrieves a subscription by its ID from Stripe.
     */
    static async getSubscription(subscriptionId) {
        try {
            return await stripe.subscriptions.retrieve(subscriptionId);
        }
        catch (error) {
            logger.error('Error retrieving subscription:', error);
            throw error;
        }
    }
}
exports.StripeService = StripeService;
//# sourceMappingURL=stripe.js.map