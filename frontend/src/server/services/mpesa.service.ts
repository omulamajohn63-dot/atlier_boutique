import { config } from '../config';

interface MpesaInitiationResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

interface MpesaTokenResponse {
  access_token: string;
}

interface MpesaStkResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  CustomerMessage?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
}

export class MpesaService {
  private static get baseUrl(): string {
    return config.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  public static get isConfigured(): boolean {
    return Boolean(
      config.MPESA_CONSUMER_KEY &&
        config.MPESA_CONSUMER_SECRET &&
        config.MPESA_SHORTCODE &&
        config.MPESA_PASSKEY &&
        config.MPESA_CALLBACK_URL
    );
  }

  public static async initiateStkPush(input: {
    amount: number;
    phoneNumber: string;
    accountReference: string;
    transactionDescription: string;
  }): Promise<MpesaInitiationResult> {
    if (!this.isConfigured) {
      throw new Error('M-Pesa Daraja credentials are not configured.');
    }

    const basicAuth = Buffer.from(
      `${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`
    ).toString('base64');
    const tokenResponse = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });

    if (!tokenResponse.ok) {
      throw new Error(`M-Pesa authentication failed with status ${tokenResponse.status}.`);
    }

    const { access_token: accessToken } = (await tokenResponse.json()) as MpesaTokenResponse;
    const timestamp = this.timestamp();
    const password = Buffer.from(`${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`).toString('base64');
    const stkResponse = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: config.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.max(1, Math.round(input.amount)),
        PartyA: input.phoneNumber,
        PartyB: config.MPESA_SHORTCODE,
        PhoneNumber: input.phoneNumber,
        CallBackURL: config.MPESA_CALLBACK_URL,
        AccountReference: input.accountReference,
        TransactionDesc: input.transactionDescription,
      }),
    });
    const result = (await stkResponse.json()) as MpesaStkResponse;

    if (!stkResponse.ok || result.ResponseCode !== '0' || !result.CheckoutRequestID || !result.MerchantRequestID) {
      throw new Error(result.ResponseDescription || `M-Pesa STK Push failed with status ${stkResponse.status}.`);
    }

    return {
      merchantRequestId: result.MerchantRequestID,
      checkoutRequestId: result.CheckoutRequestID,
      customerMessage: result.CustomerMessage || 'Check your phone to complete the M-Pesa payment.',
    };
  }

  private static timestamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }
}