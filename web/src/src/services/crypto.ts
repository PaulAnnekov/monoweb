import * as elliptic from 'elliptic';
import * as CryptoJS from 'crypto-js';

// Generates key from enc_key and pin.
function getKey(pin: string, data: CryptoJS.WordArray): string {
    // https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js or only parts.
    function wordsArrayToIntArray(wordArray: CryptoJS.WordArray): Uint8Array {
        return Uint8Array.from(atob(wordArray.toString(CryptoJS.enc.Base64)), (c) => c.charCodeAt(0));
    }

    function intArrayToWordsArray(intArray: Uint8Array): CryptoJS.WordArray {
        return CryptoJS.enc.Base64.parse(btoa(String.fromCharCode.apply(null, Array.from(intArray))));
    }

    const sha1 = CryptoJS.SHA1(pin);
    // console.log('sha1', sha1.toString());
    const key = intArrayToWordsArray(wordsArrayToIntArray(sha1).slice(0, 16));

    let dataTransformed = wordsArrayToIntArray(data);
    if (dataTransformed.length === 33) {
        dataTransformed = dataTransformed.slice(1);
    } else if (dataTransformed.length !== 32) {
        throw new Error(`Invalid key length = ${dataTransformed.length}`);
    }
    data = intArrayToWordsArray(dataTransformed);
    // console.log('data', data.toString());

    const iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    // @ts-ignore: Wrong .d.ts, createDecryptor expects WordArray, not string
    const aesDecryptor = CryptoJS.algo.AES.createDecryptor(key, {
        mode: CryptoJS.mode.CTR,
        iv,
        padding: CryptoJS.pad.NoPadding,
    });
    // @ts-ignore: Wrong .d.ts, process expects WordArray, not string
    const decrypted = aesDecryptor.process(data);
    const decrypted1 = aesDecryptor.finalize();

    return decrypted.toString() + decrypted1.toString();
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
            trimmed = new Int8Array(32);
            trimmed.set(arr, -length);
        } else {
            trimmed = new Int8Array(arr).subarray(length);
        }
        return trimmed;
    }

    const r = signature.r.toArray();
    const s = signature.s.toArray();

    const rPart = trim32(r);
    const sPart = trim32(s);

    const res = new Uint8Array(64);
    res.set(rPart);
    res.set(sPart, 32);

    return btoa(String.fromCharCode.apply(null, Array.from(res)));
}

function checkEncKeyLength(key: CryptoJS.LibWordArray): boolean {
    if (key.sigBytes === 32) {
        return false;
    }
    if (key.sigBytes === 33) {
        const hex = key.toString();
        return hex[0] === '0' && hex[1] === '1';
    }
    throw new Error(`Invalid key length = ${key.sigBytes}`);
}

export function gen(encKeyBase64: string, pin: string, accessToken: string) {
    const encKey = CryptoJS.enc.Base64.parse(encKeyBase64);
    if (checkEncKeyLength(encKey)) {
        pin = 'DEFAULT';
    }
    const key = getKey(pin, encKey);
    // console.log('key', key);
    const privateKey = genPrivateKey(key);
    const signature = sign(privateKey, accessToken);
    // console.log('raw signature', signature.toDER('hex'));
    const res = transformSignature(signature);

    return res;
}
