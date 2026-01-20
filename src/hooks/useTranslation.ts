import { useStore } from '../stores/useStore'
import { translations, type TranslationKey, type Language } from '../i18n/translations'

export function useTranslation() {
  const language = useStore(state => state.language) as Language

  const t = (key: TranslationKey): string => {
    const lang = language in translations ? language : 'ht'
    return translations[lang][key] || translations.ht[key] || key
  }

  return { t, language }
}
