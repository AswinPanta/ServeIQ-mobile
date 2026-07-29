import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ne from './locales/ne.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ne: { translation: ne },
    fr: { translation: fr },
    es: { translation: es },
    ja: { translation: ja },
    'zh-CN': { translation: zhCN },
  },
  lng: (() => {
    const raw = Localization.getLocales()?.[0]?.languageCode;
    if (raw === 'zh') return 'zh-CN';
    return raw ?? 'en';
  })(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
