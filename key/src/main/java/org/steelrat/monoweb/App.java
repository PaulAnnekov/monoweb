package org.steelrat.monoweb;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class App {
    public static void main(String[] args) throws GenericException {
        String pin = args[0];
        String accessToken = args[1];
        String encKey = args[2];
        
        byte[] encKeyBytes = Base64.getDecoder().decode(encKey);
        byte[] pinBytes;
        if (MonoSignature.checkEncKeyLength(encKeyBytes)) {
            pinBytes = "DEFAULT".getBytes(StandardCharsets.UTF_8);
        } else {
            // if (pin != null) {
                pinBytes = pin.getBytes(StandardCharsets.UTF_8);
            // }
        }
        MonoSignature signature = MonoSignature.createSignature(encKeyBytes, pinBytes);

        byte[] accessTokenBytes = accessToken.getBytes(StandardCharsets.UTF_8);
        byte[] signed = signature.sign(accessTokenBytes);
        
        String res = Base64.getEncoder().encodeToString(signed);
        
        System.out.println(res);
    }

}
