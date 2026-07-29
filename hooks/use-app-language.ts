import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/lib/context/preferences-context';
import { useCallback, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
] as const;

export function useAppLanguage() {
  const { i18n } = useTranslation();
  const { preferences, updatePreferences } = usePreferences();

  useEffect(() => {
    const prefLang = preferences.language;
    const currentLang = i18n.language;
    if (prefLang && prefLang !== currentLang && prefLang !== 'en') {
      i18n.changeLanguage(prefLang);
    }
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await i18n.changeLanguage(lang);
    await updatePreferences({ language: lang });
  }, [i18n, updatePreferences]);

  return {
    language: preferences.language || 'en',
    setLanguage,
    availableLanguages: LANGUAGES,
  };
}
