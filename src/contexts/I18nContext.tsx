import React, { createContext, useContext, useMemo, useState } from 'react'
import zh from '../i18n/zh-CN.json'
import en from '../i18n/en-US.json'

type I18nContextType = {
  t: (key: string) => string
  language: string
  setLanguage: (lang: string) => void
}

const resources: Record<string, Record<string, string>> = {
  'zh-CN': zh as any,
  'en-US': en as any,
}

const I18nContext = createContext<I18nContextType>({
  t: (k) => k,
  language: 'zh-CN',
  setLanguage: () => {},
})

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('appLanguage')
      if (saved) return saved
    } catch {}
    const nav = (navigator.language || 'zh-CN').toLowerCase()
    if (nav.startsWith('en')) return 'en-US'
    return 'zh-CN'
  })

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('appLanguage', lang)
    } catch {}
  }

  const t = (key: string) => {
    const map = resources[language] || {}
    return map[key] ?? key
  }

  const value = useMemo(() => ({ t, language, setLanguage }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
