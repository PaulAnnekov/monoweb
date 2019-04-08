// Generates key from enc_key and pin.
function getKey(pin: string, data: string): string {
    // https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js or only parts.
    function wordsArrayToIntArray(wordsArray) {
        return Uint8Array.from(atob(wordsArray.toString(CryptoJS.enc.Base64)), c => c.charCodeAt(0))
    }
    
    function intArrayToWordsArray(intArray) {
        return CryptoJS.enc.Base64.parse(btoa(String.fromCharCode.apply(null, intArray)));
    }
    
    let sha1 = CryptoJS.SHA1(pin);
    console.log('sha1', sha1.toString());
    let key = intArrayToWordsArray(wordsArrayToIntArray(sha1).slice(0, 16));
    console.log('sha1 cut', key.toString());
    
    var textWordsArray = CryptoJS.enc.Base64.parse(data);
    var textBytes = wordsArrayToIntArray(textWordsArray).slice(1);
    var textWordsArray = intArrayToWordsArray(textBytes)
    console.log('data', textWordsArray.toString());
    
    var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    var aesDecryptor = CryptoJS.algo.AES.createDecryptor(key, {
        mode: CryptoJS.mode.CTR,
        iv: iv,
        padding: CryptoJS.pad.NoPadding
    });
    var decrypted = aesDecryptor.process(textWordsArray);
    var decrypted1 = aesDecryptor.finalize();
    
    return decrypted.toString()+decrypted1.toString();   
}

// Generates private key from key.
function genPrivateKey(key: string) {
    // https://cdn.jsdelivr.net/gh/indutny/elliptic/dist/elliptic.js
    const EC = elliptic.ec;
    const secp256k1 = new EC('secp256k1');

    let keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
    let signature = keyPair.sign('fc74d3a97b2974f39579726b5f6ce3e5a27ccaeb0f');

    return signature;
}
