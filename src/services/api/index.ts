import * as CryptoJS from 'crypto-js';
import { IGrantTypeRefreshToken, IGrantTypePassword, Token } from '../../types';
import { IToken, ICategory, IKeys, IOverall, IStatement } from './types';
import { UAParser } from 'ua-parser-js';

const PLATFORM = 'android';
const PLATFORM_VERSION = '9(28)';
const APP_VERSION_NAME = '1.21.4';
const APP_VERSION_CODE = '1012';

interface PkiAPIErrorInfo {
  errCode: string;
  errText: string;
  errType: string;
}

interface MainAPIErrorInfo {
  error: string;
  message: string;
  path: string;
  status: number;
  timestamp: string;
}

interface APIOptions {
  fetch?: typeof window.fetch;
  language?: string;
}

export class APIError extends Error {
  status: number;
  error: Error;
  info: any;

  verbose() {
    let message = `${this.name}: `;
    message += this.status ? `${this.status} ` : '';
    message += this.info ? JSON.stringify(this.info) : this.error;
    return message;
  }

  toString() {
    return this.message;
  }
}

export class MainAPIError extends APIError {
  constructor(status: number, reason: MainAPIErrorInfo | Error, ...params: any[]) {
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MainAPIError);
    }

    this.name = 'MainAPIError';
    this.status = status;
    if (reason instanceof Error) {
      this.error = reason;
    } else {
      this.info = reason;
    }
    // TODO: Make it translatable.
    this.message = this.info ?
      this.info.message || 'Помилка під час запиту' :
      'Помилка мережі або програми, повторіть';
  }

  /**
   * Token expired (5 minutes) or invalid (e.g. another device authorized).
   *
   * Example response: {"status":401,"error":"Unauthorized","message":"Bad credentials"}.
   */
  isInvalidToken() {
    return this.status === 401 && (this.info as MainAPIErrorInfo).error === 'Unauthorized';
  }
}

export class PkiAPIError extends APIError {
  constructor(status: number, reason: PkiAPIErrorInfo | Error, ...params: any[]) {
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MainAPIError);
    }

    this.name = 'PkiAPIError';
    this.status = status;
    if (reason instanceof Error) {
      this.error = reason;
    } else {
      this.info = reason;
    }
    // TODO: Make it translatable.
    this.message = this.info ?
      this.info.errText || 'Помилка під час запиту' :
      'Помилка мережі або програми, повторіть';
  }

  /**
   * Token invalid, e.g. refresh_token is invalidated by logging in on another device.
   *
   * Example response: {errCode: "BAD_REQUEST", errInfo: "invalid refresh_token"}.
   */
  isInvalidToken() {
    return this.status === 400 && (this.info as PkiAPIErrorInfo).errCode === 'BAD_REQUEST';
  }
}

function getDeviceName(): string {
  // Top browsers in Ukraine according to statcounter.
  const VENDORS = {
    Chrome: 'Google',
    Firefox: 'Mozilla',
    Safari: 'Apple',
    Opera: 'Opera',
    IE: 'Microsoft',
    Edge: 'Microsoft',
    Yandex: 'Yandex',
  };
  const uaParser = new UAParser();
  const browser = uaParser.getBrowser().name;
  const vendor = VENDORS[browser];
  const device = browser && vendor ? `${vendor} ${browser}` : 'Unknown Browser';
  return `${device}, ${PLATFORM_VERSION}, ${APP_VERSION_NAME}(${APP_VERSION_CODE})`;
}

function getAppVersion(): string {
    return `${PLATFORM}-${APP_VERSION_CODE}`;
}

export default class API {
  private deviceID: string;
  private fetch: typeof window.fetch;
  private language: string;

  constructor(deviceID: string, options?: APIOptions) {
    options = options || {};
    this.deviceID = deviceID;
    this.fetch = options.fetch || window.fetch;
    this.language = options.language || 'uk';
  }

  /**
   * Sends OTP request.
   */
  async otp(phone: string): Promise<object> {
      return this.pkiAPI('otp', {}, {
          channel: 'sms',
          phone,
      });
  }

  /**
   * Gets restricted access token.
   */
  async token(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<IToken> {
      return this.pkiAPI('token', {}, grant);
  }

  /**
   * Gets encryption keys.
   */
  async keys({ access_token }: IToken): Promise<IKeys> {
      return this.pkiAPI('keys', {Authorization: `Bearer ${access_token}`});
  }

  /**
   * Gets full permissions access token.
   */
  async auth({ access_token }: IToken, sign: any): Promise<IToken> {
      return this.pkiAPI('auth', {Authorization: `Bearer ${access_token}`}, {auth: [sign]});
  }

  async appOverall({ accessToken }: Token): Promise<IOverall> {
      return this.mainAPI('app-overall', {Authorization: `Bearer ${accessToken}`});
  }

  async categories({ accessToken }: Token): Promise<ICategory[]> {
    const res = await this.mainAPI('statement/categories', {Authorization: `Bearer ${accessToken}`});
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
    const url = new URL(`http://doesnt.matter/card/${uid}/statement`);
    Object.keys(query).forEach((key) => query[key] !== undefined && url.searchParams.append(key, query[key]));
    return this.mainAPI(url.pathname.slice(1) + url.search, {Authorization: `Bearer ${accessToken}`});
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
    return this.fetch(url, params);
  }

  private async mainAPI(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    let res: Response;
    let json: any;
    try {
      res = await this.api(`https://mob-gateway.monobank.com.ua/api/${url}`, headers, body);
      json = await res.json();
    } catch (e) {
      throw new MainAPIError(res ? res.status : null, e);
    }
    if (!res.ok) {
        throw new MainAPIError(res.status, json);
    }
    return json;
  }

  private async pkiAPI(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    let res: Response;
    let json: any;
    try {
      res = await this.api(`https://pki-auth.monobank.com.ua/${url}`, headers, body);
      json = await res.json();
    } catch (e) {
      throw new PkiAPIError(res ? res.status : null, e);
    }
    if (!res.ok) {
        throw new PkiAPIError(res.status, json);
    }
    return json;
  }
}
