package org.steelrat.monoweb;

import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.security.Security;
import java.util.Arrays;
import java.util.Enumeration;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.ASN1Sequence;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.jce.spec.ECPrivateKeySpec;
import org.bouncycastle.jce.spec.ECPublicKeySpec;

public class MonoSignature {
    private Signature sha256;
    private Cipher aesCtr;
    private PrivateKey privateKey;
    private PublicKey publicKey;
    boolean f12221a;
    private MessageDigest sha1;
    private final byte[] f12234l = new byte[16];
    private ECParameterSpec f12235m;

    public MonoSignature() throws GenericException {
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.sha256 = Signature.getInstance("SHA256WithECDSA", BouncyCastleProvider.PROVIDER_NAME);
            this.aesCtr = Cipher.getInstance("AES/CTR/NoPadding", BouncyCastleProvider.PROVIDER_NAME);
            this.sha1 = MessageDigest.getInstance("SHA1", BouncyCastleProvider.PROVIDER_NAME);
            this.f12235m = ECNamedCurveTable.getParameterSpec("secp256k1");
            // if (this.f12235m == null) {
            // this.f12235m = m18912i();
            // }
        } catch (NoSuchAlgorithmException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        } catch (NoSuchProviderException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        } catch (NoSuchPaddingException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        }
    }

    private byte[] m18903c(byte[] bArr) throws GenericException {
        Enumeration res;
        try {
            res = ASN1Sequence.getInstance(ASN1Primitive.fromByteArray(bArr)).getObjects();
        } catch (IOException e) {
            throw new GenericException("IOException " + e);
        }
        byte[] toByteArray = ((ASN1Integer) res.nextElement()).getValue().toByteArray();
        byte[] res1 = ((ASN1Integer) res.nextElement()).getValue().toByteArray();
        byte[] obj = new byte[64];
        int length = toByteArray.length - 32;
        if (length < 0) {
            System.arraycopy(toByteArray, 0, obj, -length, toByteArray.length);
        } else {
            System.arraycopy(toByteArray, length, obj, 0, 32);
        }
        int length2 = res1.length - 32;
        if (length2 < 0) {
            System.arraycopy(res1, 0, obj, 32 - length2, res1.length);
        } else {
            System.arraycopy(res1, length2, obj, 32, 32);
        }
        return obj;
    }

    public byte[] sign(byte[] bArr) throws GenericException {
        try {
            sha256.initSign(this.privateKey);
            sha256.update(bArr);
            return m18903c(sha256.sign());
        } catch (InvalidKeyException e) {
            throw new GenericException("Error init sign " + e);
        } catch (SignatureException e) {
            throw new GenericException("Error sign " + e);
        }
    }

    private SecretKeySpec toSHA1(byte[] bytes) {
        this.sha1.update(bytes, 0, bytes.length);
        byte[] obj = new byte[16];
        System.arraycopy(this.sha1.digest(), 0, obj, 0, 16);
        return new SecretKeySpec(obj, "AES");
    }

    private byte[] aesOperation(byte[] data, byte[] key, int opmode) throws GenericException {
        try {
            this.aesCtr.init(opmode, toSHA1(key), new IvParameterSpec(this.f12234l));
            return this.aesCtr.doFinal(data);
        } catch (InvalidKeyException e) {
            throw new GenericException("Error encrypt key " + e);
        } catch (BadPaddingException e) {
            throw new GenericException("Error encrypt key " + e);
        } catch (IllegalBlockSizeException e) {
            throw new GenericException("Error encrypt key " + e);
        } catch (InvalidAlgorithmParameterException e) {
            throw new GenericException("Error ini encrypt key " + e);
        }
    }

    public Key getKey(byte[] encKey, byte[] pin) throws GenericException {
        Key key = new Key();
        if (encKey.length != 32) {
            if (encKey.length == 33) {
                boolean z = false;
                if (encKey[0] == (byte) 1) {
                    z = true;
                }
                key.f12221a = z;
                encKey = Arrays.copyOfRange(encKey, 1, 33);
            } else {
                StringBuilder stringBuilder = new StringBuilder();
                stringBuilder.append("Invalid key length = ");
                stringBuilder.append(encKey.length);
                throw new IllegalStateException(stringBuilder.toString());
            }
        }
        // Хешем от пин-кода расшифровывается ключ (странно).
        key.f12222b = aesOperation(encKey, pin, Cipher.DECRYPT_MODE);
        return key;
    }

    public static boolean checkEncKeyLength(byte[] key) {
        if (key.length == 32) {
            return false;
        }
        if (key.length == 33) {
            boolean z = true;
            if (key[0] != 1) {
                z = false;
            }
            return z;
        }
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("Invalid key length = ");
        stringBuilder.append(key.length);
        throw new IllegalStateException(stringBuilder.toString());
    }
    
    public class Key {
        boolean f12221a;
        byte[] f12222b;
    }

    public static MonoSignature createSignature(byte[] encKey, byte[] pin) throws GenericException {
        MonoSignature signature = new MonoSignature();
        Key key = signature.getKey(encKey, pin);
        BigInteger intKey = new BigInteger(1, key.f12222b);
        try {
            KeySpec eCPrivateKeySpec = new ECPrivateKeySpec(intKey, signature.f12235m);
            KeySpec eCPublicKeySpec = new ECPublicKeySpec(signature.f12235m.getG().multiply(intKey), signature.f12235m);
            KeyFactory keyFactory = KeyFactory.getInstance("ECDSA", BouncyCastleProvider.PROVIDER_NAME);
            signature.privateKey = keyFactory.generatePrivate(eCPrivateKeySpec);
            signature.publicKey = keyFactory.generatePublic(eCPublicKeySpec);
            signature.f12221a = key.f12221a;
            return signature;
        } catch (NoSuchAlgorithmException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        } catch (NoSuchProviderException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        } catch (InvalidKeySpecException e) {
            throw new GenericException("Error init BouncyCastleProvider " + e);
        }
    }
}
