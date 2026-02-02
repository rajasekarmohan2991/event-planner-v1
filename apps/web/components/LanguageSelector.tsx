"use client"

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Language, languages, getCurrentLanguage, setLanguage } from '@/lib/i18n'

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())
    
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }
    
    window.addEventListener('languagechange', handleLanguageChange)
    return () => window.removeEventListener('languagechange', handleLanguageChange)
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCurrentLang(lang)
    setIsOpen(false)
    // Reload page to apply translations
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span>{languages[currentLang]}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
            <div className="py-1">
              {Object.entries(languages).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as Language)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    currentLang === code 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
