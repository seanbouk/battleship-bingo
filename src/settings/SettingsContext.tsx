import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Style = 'sonar' | 'recon'
export type Mode = 'day' | 'night'

export interface Settings {
  style: Style
  mode: Mode
  setStyle: (s: Style) => void
  setMode: (m: Mode) => void
}

const SettingsContext = createContext<Settings | null>(null)

const STORE_KEY = 'bb.settings'

function load(): { style: Style; mode: Mode } {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if ((v.style === 'sonar' || v.style === 'recon') && (v.mode === 'day' || v.mode === 'night')) {
        return v
      }
    }
  } catch {
    /* ignore */
  }
  return { style: 'sonar', mode: 'night' }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const initial = load()
  const [style, setStyle] = useState<Style>(initial.style)
  const [mode, setMode] = useState<Mode>(initial.mode)

  // The chosen style/mode is the single source of truth for the whole site AND
  // for exported PDFs. We mirror it onto <html data-style data-mode> so plain CSS
  // can theme the chrome, and persist it so the setting sticks between visits.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-style', style)
    root.setAttribute('data-mode', mode)
    localStorage.setItem(STORE_KEY, JSON.stringify({ style, mode }))
  }, [style, mode])

  return (
    <SettingsContext.Provider value={{ style, mode, setStyle, setMode }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
