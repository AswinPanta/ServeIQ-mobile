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
import ar from './locales/ar.json';
import da from './locales/da.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ko from './locales/ko.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import th from './locales/th.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ne: { translation: ne },
    fr: { translation: fr },
    es: { translation: es },
    ja: { translation: ja },
    'zh-CN': { translation: zhCN },
    ar: { translation: ar },
    da: { translation: da },
    de: { translation: de },
    it: { translation: it },
    ko: { translation: ko },
    nl: { translation: nl },
    pl: { translation: pl },
    pt: { translation: pt },
    ru: { translation: ru },
    th: { translation: th },
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
