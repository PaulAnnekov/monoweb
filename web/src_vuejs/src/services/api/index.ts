import * as CryptoJS from 'crypto-js';
import { IGrantTypeRefreshToken, IGrantTypePassword, Token } from '@/types';
import { IToken, ICategory } from './types';

const PLATFORM = 'android';
const APP_VERSION_NAME = '1.21.4';
const APP_VERSION_CODE = '1012';

class APIError extends Error {
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

function getDeviceID(): string {
    if (!localStorage.getItem('deviceID')) {
        // Instead ANDROID_ID (64 bit in hex) + WiFi MAC (XX:XX:XX:XX:XX:XX).
        const id = CryptoJS.lib.WordArray.random(8).toString();
        // https://stackoverflow.com/a/24621956/782599
        const mac = 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
            return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
        });
        const sha1 = CryptoJS.SHA1(id + mac);
        localStorage.setItem('deviceID', sha1.toString().toUpperCase());
    }

    return localStorage.getItem('deviceID') as string;
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

function getLanguage(): string {
    const valid = ['ru', 'uk'];
    let lang = '';
    if (navigator.language) {
        lang = navigator.language.split('-')[0];
    }

    return lang && valid.includes(lang) ? lang : 'uk';
}

async function api(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    headers['Device-Id'] = getDeviceID();
    headers['Device-Name'] = getDeviceName();
    headers['App-Version'] = getAppVersion();
    headers.Lang = getLanguage();

    const params: RequestInit = {
        method: body ? 'POST' : 'GET',
        headers: new Headers(headers),
        body: null,
    };
    if (body) {
        params.body = JSON.stringify(body);
    }
    const res = await fetch('https://cors-anywhere.herokuapp.com/' + url, params);
    const json = await res.json();
    if (!res.ok) {
        throw new APIError(res.status, json);
    }
    return json;
}

export async function otp(phone: string) {
    return api('https://pki-auth.monobank.com.ua/otp', {
        Fingerprint: getFingerprint(),
    }, {
        channel: 'sms',
        phone,
    });
}

export async function token(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<IToken> {
    return api('https://pki-auth.monobank.com.ua/token', {
        Fingerprint: getFingerprint(),
    }, grant);
}

export async function keys({ access_token }: IToken) {
    return api('https://pki-auth.monobank.com.ua/keys', {
        Authorization: `Bearer ${access_token}`,
        Fingerprint: getFingerprint(),
    });
}

export async function auth({ access_token }: IToken, sign: any): Promise<IToken> {
    return api('https://pki-auth.monobank.com.ua/auth', {
        Authorization: `Bearer ${access_token}`,
        Fingerprint: getFingerprint(),
    }, {
        auth: [sign],
    });
}

export async function appOverall({ accessToken }: Token) {
    return api('https://mob-gateway.monobank.com.ua/api/app-overall', {
        Authorization: `Bearer ${accessToken}`,
    });
}

export async function categories({ accessToken }: Token): Promise<ICategory[]> {
  const res = await api('https://mob-gateway.monobank.com.ua/api/statement/categories', {
      Authorization: `Bearer ${accessToken}`,
  });
  return res.result.dc;
}

export async function cardStatement({ accessToken }: Token, uid: string) {
    return api(`https://mob-gateway.monobank.com.ua/api/card/${uid}/statement?limit=50&v2=false`, {
        Authorization: `Bearer ${accessToken}`,
    });
}
