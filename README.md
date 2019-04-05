# Monobank Web

- [API findings](https://docs.google.com/document/d/1POr719p4xcl0Y7rdT8Mhi_vZajRK-2tQLOI0k1srzN0)
- Kali Linux in VM is perfect if you need apktool already configured
- unpack `apktool d -r com.ftband.mono_2019-03-29.apk`
- pack
  - create keystore `keytool -genkey -alias test -keystore test.keystore
  - pack/sign/install `apktool b . && jarsigner -verbose -keystore test.keystore dist/com.ftband.mono_2019-03-29.apk test && adb install dist/com.ftband.mono_2019-03-29.apk`
- [make](https://github.com/JesusFreke/smali/wiki/smalidea) .smali-ed app debuggable
