import * as CryptoJS from 'crypto-js';
import { IGrantTypeRefreshToken, IGrantTypePassword, Token } from '../../types';
import { IToken, ICategory, IKeys, IOverall, IStatement } from './types';

const PLATFORM = 'android';
const APP_VERSION_NAME = '1.21.4';
const APP_VERSION_CODE = '1012';

export class APIError extends Error {
    status: number;
    info: object;

    constructor(status: number, info: object, ...params: any[]) {
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, APIError);
        }

        this.name = 'APIError';
        this.status = status;
        this.info = info;
        this.message = `${this.status} ${JSON.stringify(this.info)}`;
    }
}

function getFingerprint() {
    // TODO: Generate real fingerprint, not total random.
    const length = Math.floor(Math.random() * (500 - 400)) + 400;
    // @ts-ignore
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Base64);
}

function getDeviceName(): string {
    // TODO: Try to use browser vendor + name instead.
    const device = 'Huawei P30Pro';
    const androidVersion = '9(28)';
    return `${device}, ${androidVersion}, ${APP_VERSION_NAME}(${APP_VERSION_CODE})`;
}

function getAppVersion(): string {
    return `${PLATFORM}-${APP_VERSION_CODE}`;
}

export default class API {
  private deviceID: string;
  private fetch: typeof window.fetch;
  private language: string;

  constructor(deviceID: string, options?: {fetch?: typeof window.fetch, language?: string}) {
    options = options||{};
    this.deviceID = deviceID;
    this.fetch = options.fetch || window.fetch;
    this.language = options.language || 'uk';
  }

  private async api(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    headers['Device-Id'] = this.deviceID;
    headers['Device-Name'] = getDeviceName();
    headers['App-Version'] = getAppVersion();
    headers.Lang = this.language;

    const params: RequestInit = {
        method: body ? 'POST' : 'GET',
        headers: new Headers(headers),
        body: null,
    };
    if (body) {
        params.body = JSON.stringify(body);
    }
    const res = await this.fetch(url, params);
    const json = await res.json();
    if (!res.ok) {
        throw new APIError(res.status, json);
    }
    return json;
  }

  // Sends OTP request.
  async otp(phone: string): Promise<object> {
      return this.api('https://pki-auth.monobank.com.ua/otp', {
          Fingerprint: getFingerprint(),
      }, {
          channel: 'sms',
          phone,
      });
  }

  /**
   * Gets restricted access token.
   */
  async token(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<IToken> {
      return this.api('https://pki-auth.monobank.com.ua/token', {
          Fingerprint: getFingerprint(),
      }, grant);
  }

  /**
   * Gets encryption keys.
   */
  async keys({ access_token }: IToken): Promise<IKeys> {
      return this.api('https://pki-auth.monobank.com.ua/keys', {
          Authorization: `Bearer ${access_token}`,
          Fingerprint: getFingerprint(),
      });
  }

  /**
   * Gets full permissions access token.
   */
  async auth({ access_token }: IToken, sign: any): Promise<IToken> {
      return this.api('https://pki-auth.monobank.com.ua/auth', {
          Authorization: `Bearer ${access_token}`,
          Fingerprint: getFingerprint(),
      }, {
          auth: [sign],
      });
  }

  async appOverall({ accessToken }: Token): Promise<IOverall> {
      return this.api('https://mob-gateway.monobank.com.ua/api/app-overall', {
          Authorization: `Bearer ${accessToken}`,
      });
  }

  async categories({ accessToken }: Token): Promise<ICategory[]> {
    const res = await this.api('https://mob-gateway.monobank.com.ua/api/statement/categories', {
        Authorization: `Bearer ${accessToken}`,
    });
    return res.result.dc;
  }

  async cardStatement({ accessToken }: Token, uid: string, params?: {limit?: number, direction?: string, dateFrom?: Date, stmtId?: string}): Promise<IStatement> {
    params = params || {};
    const query = {
      v2: false,
      limit: params.limit || 50,
      direction: params.direction,
      stmtId: params.stmtId,
      dateFrom: params.dateFrom && params.dateFrom.toISOString(),
    };
    const url = new URL(`https://mob-gateway.monobank.com.ua/api/card/${uid}/statement`);
    Object.keys(query).forEach(key => query[key] !== undefined && url.searchParams.append(key, query[key]));
    return this.api(url.href, {
        Authorization: `Bearer ${accessToken}`,
    });
  }
}
