import * as elliptic from 'elliptic';
import * as CryptoJS from 'crypto-js';

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

async function api(url: string, headers: { [key: string]: string } = {}, body?: {}) {
    headers['Device-Id'] = '';
    headers['Device-Name'] = '';
    headers['App-Version'] = '';
    headers['Lang'] = '';

    const params: RequestInit = {
        method: body ? 'POST' : 'GET',
        headers: new Headers(headers),
        body: null,
    };
    if (body) {
        params.body = JSON.stringify(body);
    }
    const res = await fetch('https://cors-anywhere.herokuapp.com/' + url, params);
    return await res.json();
}

async function load() {
    debugger;
    const Fingerprint = '';
    const phone = await new Promise(function(resolve) {
        const phoneEl = document.querySelector('#phone') as HTMLInputElement;
        phoneEl.addEventListener('keydown', (event: KeyboardEvent)=>{
            if (event.keyCode != 13)
                return;
            resolve(phoneEl.value);
        });
    });
    debugger;
    await api('https://pki-auth.monobank.com.ua/otp', {Fingerprint}, {
        'channel': 'sms',
        'phone': phone,
    });
    debugger;
    const code = await new Promise(function(resolve) {
        const smsEl = document.querySelector('#sms') as HTMLInputElement;
        smsEl.addEventListener('input', ()=>{
            if (smsEl.value.length != 4)
                return;
            resolve(smsEl.value);
        });
    });
    debugger;
    const tokens = await api('https://pki-auth.monobank.com.ua/token', {Fingerprint}, {
        'channel': 'sms',
        'grant_type': 'password',
        'password': code,
        'username': phone,
    });
    debugger;
    const keys = await api('https://pki-auth.monobank.com.ua/keys', {
        Authorization: `Bearer ${tokens['access_token']}`,
        Fingerprint,
    });
    debugger;
    const pinEl = document.querySelector('#pin') as HTMLInputElement;
    const sign = gen(keys.keys[0].enc_key, pinEl.value, tokens.access_token)
    const newTokens = await api('https://pki-auth.monobank.com.ua/auth', {
        Authorization: `Bearer ${tokens.access_token}`,
        Fingerprint,
    }, {
        auth: [{
            name: keys.keys[0].name,
            sign,
        }]
    });
    debugger;
    const overall = await api('https://mob-gateway.monobank.com.ua/api/app-overall', {
        Authorization: `Bearer ${newTokens.access_token}`,
    });
    debugger;
    console.log('overall', overall);
}

load();

// let params = (new URL(document.location.toString())).searchParams;
// const signature = gen(params.get('enc_key'), params.get('pin'), params.get('access_token'));
// console.log('signature', signature);
