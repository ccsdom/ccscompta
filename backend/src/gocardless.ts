import * as logger from 'firebase-functions/logger';

const GOCARDLESS_API_URL = 'https://bankaccountdata.gocardless.com/api/v2';

interface GoCardlessTokenResponse {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
}

interface GoCardlessRequisitionResponse {
  id: string;
  redirect: string;
  status: string;
  agreement: string;
  accounts: string[];
  link: string;
  institution_id?: string;
}

interface GoCardlessAccountResponse {
  id: string;
  iban: string;
  name: string;
  currency: string;
  status: string;
}

export class GoCardlessService {
  private static getCredentials() {
    const secretId = process.env.GOCARDLESS_SECRET_ID;
    const secretKey = process.env.GOCARDLESS_SECRET_KEY;
    return { secretId, secretKey };
  }

  public static isConfigured(): boolean {
    const { secretId, secretKey } = this.getCredentials();
    return !!(secretId && secretKey);
  }

  private static async getAccessToken(): Promise<string> {
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

    const data = (await response.json()) as GoCardlessTokenResponse;
    return data.access;
  }

  public static async createRequisition(
    clientId: string,
    redirectUrl: string,
    institutionId: string = 'SANDBOX_FINANCE'
  ): Promise<{ requisitionId: string; consentUrl: string }> {
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

    const data = (await response.json()) as GoCardlessRequisitionResponse;
    return {
      requisitionId: data.id,
      consentUrl: data.link,
    };
  }

  public static async getRequisitionDetails(requisitionId: string): Promise<GoCardlessRequisitionResponse> {
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

    return (await response.json()) as GoCardlessRequisitionResponse;
  }

  public static async getAccountDetails(accountId: string): Promise<GoCardlessAccountResponse> {
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

    return (await response.json()) as GoCardlessAccountResponse;
  }

  public static async getAccountBalances(accountId: string): Promise<number> {
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

    const data = await response.json() as any;
    const balanceAmount = data?.balances?.[0]?.balanceAmount?.amount;
    return balanceAmount ? parseFloat(balanceAmount) : 0;
  }

  public static async getAccountTransactions(
    accountId: string,
    fromDate?: string
  ): Promise<any[]> {
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

    const data = await response.json() as any;
    return data?.transactions?.booked || [];
  }
}
