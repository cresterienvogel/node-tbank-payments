import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { computeTbankToken } from '../../common/utils/crypto';

import {
  TbankCancelRequest,
  TbankCancelResponse,
  TbankGetStateRequest,
  TbankGetStateResponse,
  TbankInitRequest,
  TbankInitResponse
} from './tbank.types';

@Injectable()
export class TbankService {
  private readonly terminalKey: string;
  private readonly password: string;
  private readonly baseUrl: string;
  private readonly publicWebhookUrl: string;

  constructor(private readonly config: ConfigService) {
    this.terminalKey = this.config.get<string>('TBANK_TERMINAL_KEY')!;
    this.password = this.config.get<string>('TBANK_PASSWORD')!;
    this.baseUrl = this.config.get<string>('TBANK_BASE_URL')!;
    this.publicWebhookUrl = this.config.get<string>('PUBLIC_WEBHOOK_URL')!;
  }

  async initPayment(params: {
    orderId: string;
    amount: number;
    description?: string;
  }): Promise<{ providerPaymentId: string; payUrl: string; raw: TbankInitResponse }> {
    const body: TbankInitRequest = {
      TerminalKey: this.terminalKey,
      Amount: params.amount,
      OrderId: params.orderId,
      Description: params.description,
      NotificationURL: this.publicWebhookUrl
    };

    body.Token = computeTbankToken(body as any, this.password);

    const res = await this.post<TbankInitResponse>('/v2/Init', body);

    if (!res.Success || !res.PaymentId || !res.PaymentURL) {
      throw new BadGatewayException({
        message: 'TBank Init failed',
        provider: res
      });
    }

    return { providerPaymentId: res.PaymentId, payUrl: res.PaymentURL, raw: res };
  }

  async getState(providerPaymentId: string): Promise<TbankGetStateResponse> {
    const body: TbankGetStateRequest = {
      TerminalKey: this.terminalKey,
      PaymentId: providerPaymentId
    };

    body.Token = computeTbankToken(body as any, this.password);
    return this.post<TbankGetStateResponse>('/v2/GetState', body);
  }

  async cancel(providerPaymentId: string): Promise<TbankCancelResponse> {
    const body: TbankCancelRequest = {
      TerminalKey: this.terminalKey,
      PaymentId: providerPaymentId
    };

    body.Token = computeTbankToken(body as any, this.password);
    return this.post<TbankCancelResponse>('/v2/Cancel', body);
  }

  private async post<T>(path: string, body: any): Promise<T> {
    const url = this.baseUrl.replace(/\/+$/, '') + path;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await r.text();

    if (!r.ok) {
      throw new BadGatewayException({
        message: 'TBank HTTP error',
        status: r.status,
        url,
        body: text.slice(0, 2000)
      });
    }

    if (!text || text.trim().length === 0) {
      throw new BadGatewayException({
        message: 'TBank returned empty response body',
        status: r.status,
        url
      });
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new BadGatewayException({
        message: 'TBank returned non-JSON response body',
        status: r.status,
        url,
        body: text.slice(0, 2000)
      });
    }
  }
}
