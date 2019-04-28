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
