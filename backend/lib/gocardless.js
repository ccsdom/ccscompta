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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoCardlessService = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';
class GoCardlessService {
    static getCredentials() {
        const secretId = process.env.GOCARDLESS_SECRET_ID;
        const secretKey = process.env.GOCARDLESS_SECRET_KEY;
        return { secretId, secretKey };
    }
    static isConfigured() {
        const { secretId, secretKey } = this.getCredentials();
        return !!(secretId && secretKey);
    }
    static async getAccessToken() {
        const { secretId, secretKey } = this.getCredentials();
        if (!secretId || !secretKey) {
            throw new Error('GoCardless credentials not configured.');
        }
        const response = await fetch(`${GOCARDLESS_API_URL}/token/new/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                secret_id: secretId,
                secret_key: secretKey,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Failed to get GoCardless access token', { errorText });
            throw new Error(`GoCardless Auth failed: ${response.statusText}`);
        }
        const data = (await response.json());
        return data.access;
    }
    static async createRequisition(clientId, redirectUrl, institutionId = 'SANDBOX_FINANCE') {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${GOCARDLESS_API_URL}/requisitions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                redirect: redirectUrl,
                reference: `client_${clientId}_ref_${Date.now()}`,
                agreement: null,
                institution_id: institutionId,
                user_language: 'FR',
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Failed to create GoCardless requisition', { errorText });
            throw new Error(`GoCardless Requisition creation failed: ${response.statusText}`);
        }
        const data = (await response.json());
        return {
            requisitionId: data.id,
            consentUrl: data.link,
        };
    }
    static async getRequisitionDetails(requisitionId) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${GOCARDLESS_API_URL}/requisitions/${requisitionId}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Failed to fetch GoCardless requisition details', { errorText });
            throw new Error(`GoCardless fetch requisition failed: ${response.statusText}`);
        }
        return (await response.json());
    }
    static async getAccountDetails(accountId) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${GOCARDLESS_API_URL}/accounts/${accountId}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Failed to fetch details for GoCardless account: ${accountId}`, { errorText });
            throw new Error(`GoCardless fetch account details failed: ${response.statusText}`);
        }
        return (await response.json());
    }
    static async getAccountBalances(accountId) {
        var _a, _b, _c;
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${GOCARDLESS_API_URL}/accounts/${accountId}/balances/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            logger.warn(`Failed to fetch balances for GoCardless account: ${accountId}, defaulting to 0`);
            return 0;
        }
        const data = await response.json();
        const balanceAmount = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.balances) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.balanceAmount) === null || _c === void 0 ? void 0 : _c.amount;
        return balanceAmount ? parseFloat(balanceAmount) : 0;
    }
    static async getAccountTransactions(accountId, fromDate) {
        var _a;
        const accessToken = await this.getAccessToken();
        let url = `${GOCARDLESS_API_URL}/accounts/${accountId}/transactions/`;
        if (fromDate) {
            url += `?date_from=${fromDate}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Failed to fetch transactions for GoCardless account: ${accountId}`, { errorText });
            throw new Error(`GoCardless fetch transactions failed: ${response.statusText}`);
        }
        const data = await response.json();
        return ((_a = data === null || data === void 0 ? void 0 : data.transactions) === null || _a === void 0 ? void 0 : _a.booked) || [];
    }
}
exports.GoCardlessService = GoCardlessService;
//# sourceMappingURL=gocardless.js.map