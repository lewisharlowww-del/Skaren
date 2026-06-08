'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Language } from './i18n'

type LanguageContextType = {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'no',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('no')

  useEffect(() => {
    const stored = localStorage.getItem('skaren-language') as Language
    if (stored === 'no' || stored === 'en') setLangState(stored)
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem('skaren-language', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang(): LanguageContextType {
  return useContext(LanguageContext)
}
