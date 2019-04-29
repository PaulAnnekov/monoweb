import * as CryptoJS from 'crypto-js';
import { Language } from "../types";

export function moneyFormat(num: number) {
  const formatter = new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatter.format(num).replace(/,/g, ' ');
}

export function currency(ccy: string): string {
  const CURRENCIES: { [index: string]: string } = {
    980: '₴',
    840: '$',
    978: '€',
  };

  return CURRENCIES[ccy];
}

export function getLanguage(): Language {
  let lang = '';
  if (navigator.language) {
      lang = navigator.language.split('-')[0];
  }

  return lang && Language[lang] ? Language[lang] : Language.uk;
}

export function genDeviceID(): string {
  // Instead ANDROID_ID (64 bit in hex) + WiFi MAC (XX:XX:XX:XX:XX:XX).
  const id = CryptoJS.lib.WordArray.random(8).toString()
  // https://stackoverflow.com/a/24621956/782599
  const mac = "XX:XX:XX:XX:XX:XX".replace(/X/g, function() {
      return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
  });
  const sha1 = CryptoJS.SHA1(id + mac);
  return sha1.toString().toUpperCase();
}
