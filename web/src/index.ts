import * as elliptic from 'elliptic';
import * as CryptoJS from 'crypto-js';
import 'reflect-metadata'; // required by 'class-transformer'
import { serialize, deserialize, Type } from 'class-transformer';

const PLATFORM = 'android';
const APP_VERSION_NAME = '1.21.4';
const APP_VERSION_CODE = '1012';
const CURRENCIES: { [index: string]: string } = {
    '980': '₴',
    '840': '$',
    '978': '€',
}

class APIError extends Error {
    status: number;
    info: Object;

    constructor(status: number, info: Object, ...params: any[]) {
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, APIError);
        }

        this.name = 'APIError';
        this.status = status;
        this.info = info;
    }

    toString(): string {
        return `${this.name}: ${this.status} ${JSON.stringify(this.info)}`;
    }
}

let token: Token;

interface IApiToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    name?: string;
}

interface IGrantTypePassword {
    channel: string;
    grant_type: string,
    password: string,
    username: string,
}

interface IGrantTypeRefreshToken {
    grant_type: string,
    refresh_token: string,
}

class Token {
    @Type(() => Date)
    date: Date;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    // Only exists for full privileged token.
    name?: string;

    isExpired(): boolean {
        return (Date.now() - this.date.getTime()) / 1000 >= this.expiresIn;
    }

    static fromAPI(data: IApiToken): Token {
        const t = new Token();
        t.date = new Date();
        t.accessToken = data.access_token;
        t.refreshToken = data.refresh_token;
        t.expiresIn = data.expires_in;
        t.name = data.name;
        return t;
    }
}

// Generates key from enc_key and pin.
function getKey(pin: string, data: CryptoJS.WordArray): string {
    // https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js or only parts.
    function wordsArrayToIntArray(wordArray: CryptoJS.WordArray): Uint8Array {
        return Uint8Array.from(atob(wordArray.toString(CryptoJS.enc.Base64)), c => c.charCodeAt(0))
    }
    
    function intArrayToWordsArray(intArray: Uint8Array): CryptoJS.WordArray {
        return CryptoJS.enc.Base64.parse(btoa(String.fromCharCode.apply(null, intArray)));
    }

    let sha1 = CryptoJS.SHA1(pin);
    console.log('sha1', sha1.toString());
    let key = intArrayToWordsArray(wordsArrayToIntArray(sha1).slice(0, 16));
    
    let dataTransformed = wordsArrayToIntArray(data);
    if (dataTransformed.length == 33) {
        dataTransformed = dataTransformed.slice(1);
    } else if (dataTransformed.length != 32) {
        throw new Error(`Invalid key length = ${dataTransformed.length}`);
    }
    data = intArrayToWordsArray(dataTransformed)
    console.log('data', data.toString());
    
    var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    // @ts-ignore: Wrong .d.ts, createDecryptor expects WordArray, not string
    var aesDecryptor = CryptoJS.algo.AES.createDecryptor(key, {
        mode: CryptoJS.mode.CTR,
        iv: iv,
        padding: CryptoJS.pad.NoPadding
    });
    // @ts-ignore: Wrong .d.ts, process expects WordArray, not string
    var decrypted = aesDecryptor.process(data);
    var decrypted1 = aesDecryptor.finalize();
    
    return decrypted.toString()+decrypted1.toString();   
}

// Generates private key from key.
function genPrivateKey(key: string): elliptic.ec.KeyPair {
    // https://cdn.jsdelivr.net/gh/indutny/elliptic/dist/elliptic.js
    const EC = elliptic.ec;
    const secp256k1 = new EC('secp256k1');

    return secp256k1.keyFromPrivate(key, 'hex');
}

// Signs data with a key.
function sign(key: elliptic.ec.KeyPair, data: string): elliptic.ec.Signature {
    const msg = CryptoJS.SHA256(data);

    return key.sign(msg.toString());
}

// Encodes signature according to monobank rules.
function transformSignature(signature: elliptic.ec.Signature): string {
    function trim32(arr: number[]): Int8Array {
        const length = arr.length - 32;
        let trimmed: Int8Array;
        if (length < 0) {
            trimmed = new Int8Array(32)
            trimmed.set(arr, -length)
        } else {
            trimmed = new Int8Array(arr).subarray(length)
        }
        return trimmed;
    }

    const r = signature.r.toArray();
    const s = signature.s.toArray();

    let rPart = trim32(r);
    let sPart = trim32(s);

    let res = new Uint8Array(64);
    res.set(rPart);
    res.set(sPart, 32);

    return btoa(String.fromCharCode.apply(null, res));
}

function checkEncKeyLength(key: CryptoJS.LibWordArray): boolean {
    if (key.sigBytes == 32) {
        return false;
    }
    if (key.sigBytes == 33) {
        const hex = key.toString();
        return hex[0] === '0' && hex[1] === '1';
    }
    throw new Error(`Invalid key length = ${key.sigBytes}`);
}

function gen(encKeyBase64: string, pin: string, accessToken: string) {
    const encKey = CryptoJS.enc.Base64.parse(encKeyBase64);
    if (checkEncKeyLength(encKey)) {
        pin = "DEFAULT";
    }
    const key = getKey(pin, encKey);
    console.log('key', key);
    const privateKey = genPrivateKey(key);
    const signature = sign(privateKey, accessToken)
    console.log('raw signature', signature.toDER('hex'));
    const res = transformSignature(signature)
    
    return res;
}

function getDeviceID(): string {
    if (!localStorage.getItem('deviceID')) {
        // Instead ANDROID_ID (64 bit in hex) + WiFi MAC (XX:XX:XX:XX:XX:XX).
        const id = CryptoJS.lib.WordArray.random(8).toString()
        // https://stackoverflow.com/a/24621956/782599
        const mac = "XX:XX:XX:XX:XX:XX".replace(/X/g, function() {
            return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
        });
        let sha1 = CryptoJS.SHA1(id + mac);
        localStorage.setItem('deviceID', sha1.toString().toUpperCase());
    }
    
    return localStorage.getItem('deviceID');
}

function getDeviceName(): string {
    // TODO: Try to use browser vendor + name instead.
    const device = 'Huawei P30Pro';
    const androidVersion = '9(28)';
    return `${device}, ${androidVersion}, ${APP_VERSION_NAME}(${APP_VERSION_CODE})`;
}

function getAppVersion(): string {
    return `${PLATFORM}-${APP_VERSION_CODE}`
}

function toggleLoader(toggle: boolean) {
    (document.querySelector(`#loader`) as HTMLElement).style.display = toggle ? 'block' : 'none';
}

function getLanguage(): string {
    const valid = ['ru', 'uk'];
    let lang: string;
    if (navigator.language) {
        lang = navigator.language.split('-')[0];
    }

    return lang && valid.includes(lang) ? lang : 'uk';
}

async function api(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    toggleLoader(true);
    headers['Device-Id'] = getDeviceID();
    headers['Device-Name'] = getDeviceName();
    headers['App-Version'] = getAppVersion();
    headers['Lang'] = getLanguage();

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
    toggleLoader(false);
    if (!res.ok)
        throw new APIError(res.status, json);
    return json;
}

function getFingerprint() {
    // TODO: Generate real fingerprint, not total random.
    const length = Math.floor(Math.random() * (500 - 400)) + 400;
    // @ts-ignore
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Base64);
}

function toggleStep(stepID: string) {
    ['phone', 'sms', 'pin', 'info'].forEach((id) => {
        (document.querySelector(`#${id}`) as HTMLElement).style.display = 'none';
    });
    (document.querySelector(`#${stepID}`) as HTMLElement).style.display = 'block';
}

function saveToken(token: Token) {
    localStorage.setItem('token', serialize(token));
}

function resetToken() {
    localStorage.removeItem('token');
}

function getToken(): Token {
    const data = localStorage.getItem('token');
    if (!data)
        return;
    return deserialize(Token, data);
}

async function tokenStep(grant: IGrantTypePassword | IGrantTypeRefreshToken): Promise<Token> {
    toggleStep('pin');
    let token: IApiToken;
    try {
        token = await api('https://pki-auth.monobank.com.ua/token', {
            Fingerprint: getFingerprint()
        }, grant);
    } catch(e) {
        return await auth();
    }
    const keys = await api('https://pki-auth.monobank.com.ua/keys', {
        Authorization: `Bearer ${token.access_token}`,
        Fingerprint: getFingerprint(),
    });
    const pin = await new Promise(function(resolve) {
        function onInput() {
            if (pinEl.value.length != 4)
                return;
            resolve(pinEl.value);
        }
        const pinEl = document.querySelector('#pin') as HTMLInputElement;
        pinEl.addEventListener('input', onInput);
        onInput();
    }) as string;
    const sign = gen(keys.keys[0].enc_key, pin, token.access_token)
    const newToken: IApiToken = await api('https://pki-auth.monobank.com.ua/auth', {
        Authorization: `Bearer ${token.access_token}`,
        Fingerprint: getFingerprint(),
    }, {
        auth: [{
            name: keys.keys[0].name,
            sign,
        }]
    });
    return Token.fromAPI(newToken);
}

function numberFormat(number: number) {
    var formatter = new Intl.NumberFormat(getLanguage(), {maximumFractionDigits: 2, minimumFractionDigits: 2});
    return formatter.format(number);
}

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

async function displayInfo() {
    let overall, statement, card;
    try {
        overall = await api('https://mob-gateway.monobank.com.ua/api/app-overall', {
            Authorization: `Bearer ${token.accessToken}`,
        });
        console.log('overall', overall);
        card = overall.result.cards[0];
        statement = await api(`https://mob-gateway.monobank.com.ua/api/card/${card.uid}/statement?limit=50&v2=false`, {
            Authorization: `Bearer ${token.accessToken}`,
        });
        console.log('statement', statement);
    } catch(e) {
        if (!(e instanceof APIError) || e.status != 401) {
            throw e;
        }
        // TODO: It can also mean access token expired and we just need to
        // refresh it.
        resetToken();
        main();
        return;
    }
    const personalData = overall.result.personalData;
    const nameEl = document.querySelector('#info .name');
    const photoEl = document.querySelector('#info .photo') as HTMLImageElement;
    const balanceEl = document.querySelector('#info .card-info .balance');
    const cardEl = document.querySelector('#info .card-info .card');
    nameEl.textContent = personalData.fullNameUk;
    photoEl.src = personalData.photoAbsoluteUrl;
    balanceEl.textContent = `${numberFormat(card.balance.balance)} ${CURRENCIES[card.balance.ccy]}`;
    cardEl.textContent = `*${card.cardNum.slice(-4)}`;
    const operationTemplate = document.querySelector('.operation-template') as HTMLTemplateElement;
    const dateTemplate = document.querySelector('.date-template') as HTMLTemplateElement;
    const list = document.querySelector('.statement .list');
    let lastDate: Date;
    statement.panStatement.listStmt.forEach((o: any)=>{
        if (o.type != 'FINANCIAL')
            return;
        const transactionDate = new Date(o.tranDate);
        if (!lastDate || !isSameDay(transactionDate, lastDate)) {
            const dateClone = document.importNode(dateTemplate.content, true);
            const dateEl = dateClone.querySelector('.date');
            dateEl.textContent = transactionDate.toLocaleDateString(getLanguage(), {month: 'long', day: 'numeric'});
            list.appendChild(dateClone);
        }
        const clone = document.importNode(operationTemplate.content, true);
        const iconEl = clone.querySelector('.icon') as HTMLImageElement;
        const descriptionEl = clone.querySelector('.description');
        const amountEl = clone.querySelector('.amount');
        const balanceEl = clone.querySelector('.balance');

        iconEl.addEventListener('error', ()=>{
            iconEl.src = 'no-icon.jpg';
        });
        if (o.iconUrl)
            iconEl.src = o.iconUrl;
        descriptionEl.textContent = o.descr;
        amountEl.textContent = numberFormat(o.debit ? -o.amt : o.amt);
        balanceEl.textContent = numberFormat(o.rest);

        list.appendChild(clone);
        lastDate = transactionDate;
    });
    toggleStep('info');
}

async function auth(): Promise<Token> {
    toggleStep('phone');
    const phone = await new Promise(function(resolve) {
        const phoneEl = document.querySelector('#phone') as HTMLInputElement;
        phoneEl.addEventListener('keydown', (event: KeyboardEvent)=>{
            if (event.keyCode != 13)
                return;
            resolve(phoneEl.value);
        });
    }) as string;
    toggleStep('sms');
    await api('https://pki-auth.monobank.com.ua/otp', {
        Fingerprint: getFingerprint()
    }, {
        'channel': 'sms',
        'phone': phone,
    });
    const code = await new Promise(function(resolve) {
        function onInput() {
            const value = smsEl.value.replace(/\D/g, '');
            if (value.length != 4)
                return;
            resolve(value);
        }
        const smsEl = document.querySelector('#sms') as HTMLInputElement;
        smsEl.addEventListener('input', onInput);
        onInput();
    }) as string;
    return tokenStep({
        channel: 'sms',
        grant_type: 'password',
        password: code,
        username: phone,
    });
}

async function main() {
    token = getToken();
    if (token) {
        if (token.isExpired()) {
            token = await tokenStep({
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken,
            });
            saveToken(token);
        }
    } else {
        token = await auth();
        saveToken(token);
    }
    displayInfo();
}

main();

// let params = (new URL(document.location.toString())).searchParams;
// const signature = gen(params.get('enc_key'), params.get('pin'), params.get('access_token'));
// console.log('signature', signature);
