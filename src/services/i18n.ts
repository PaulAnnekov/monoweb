import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from '../locales/ru.json';
import i18next from 'i18next';
import { Language } from '../types';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      [Language.ru]: {
        translation: ru
      }
    },
    lng: Language.uk,
    fallbackLng: Language.uk,
    interpolation: {
      escapeValue: false // React already safes from xss.
    },
    keySeparator: '::',
    nsSeparator: null,
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: "${key}"`);
    }
  });

export function t(key: string, options?: {[index: string]: string}) {
  return i18next.t(key, options);
}
