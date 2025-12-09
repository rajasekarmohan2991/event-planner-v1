export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh'

export const languages: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文'
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.events': 'Events',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    
    // Events
    'events.title': 'Events',
    'events.create': 'Create Event',
    'events.edit': 'Edit Event',
    'events.delete': 'Delete Event',
    'events.name': 'Event Name',
    'events.description': 'Description',
    'events.date': 'Date',
    'events.location': 'Location',
    'events.price': 'Price',
    'events.capacity': 'Capacity',
    'events.status': 'Status',
    'events.registrations': 'Registrations',
    'events.speakers': 'Speakers',
    'events.sessions': 'Sessions',
    'events.team': 'Team',
    'events.calendar': 'Calendar',
    
    // Registration
    'registration.title': 'Registration',
    'registration.name': 'Full Name',
    'registration.email': 'Email Address',
    'registration.phone': 'Phone Number',
    'registration.company': 'Company',
    'registration.position': 'Position',
    'registration.submit': 'Submit Registration',
    'registration.success': 'Registration successful!',
    'registration.error': 'Registration failed',
    
    // Payment
    'payment.title': 'Payment',
    'payment.amount': 'Amount',
    'payment.method': 'Payment Method',
    'payment.card': 'Credit/Debit Card',
    'payment.upi': 'UPI',
    'payment.netbanking': 'Net Banking',
    'payment.processing': 'Processing...',
    'payment.success': 'Payment successful!',
    'payment.failed': 'Payment failed',
    
    // QR Code
    'qr.title': 'QR Code',
    'qr.checkin': 'Check-in',
    'qr.scan': 'Scan QR Code',
    'qr.success': 'Check-in successful!',
    'qr.error': 'Invalid QR code',
    
    // Admin
    'admin.dashboard': 'Admin Dashboard',
    'admin.users': 'User Management',
    'admin.roles': 'Roles & Privileges',
    'admin.payments': 'Payment Analytics',
    'admin.settings': 'System Settings'
  },
  
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.events': 'इवेंट्स',
    'nav.users': 'उपयोगकर्ता',
    'nav.settings': 'सेटिंग्स',
    'nav.logout': 'लॉग आउट',
    
    // Common
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'डिलीट करें',
    'common.edit': 'संपादित करें',
    'common.create': 'बनाएं',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.confirm': 'पुष्टि करें',
    'common.search': 'खोजें',
    'common.filter': 'फिल्टर',
    'common.export': 'निर्यात',
    'common.import': 'आयात',
    
    // Events
    'events.title': 'इवेंट्स',
    'events.create': 'इवेंट बनाएं',
    'events.edit': 'इवेंट संपादित करें',
    'events.delete': 'इवेंट डिलीट करें',
    'events.name': 'इवेंट का नाम',
    'events.description': 'विवरण',
    'events.date': 'तारीख',
    'events.location': 'स्थान',
    'events.price': 'मूल्य',
    'events.capacity': 'क्षमता',
    'events.status': 'स्थिति',
    'events.registrations': 'पंजीकरण',
    'events.speakers': 'वक्ता',
    'events.sessions': 'सत्र',
    'events.team': 'टीम',
    'events.calendar': 'कैलेंडर',
    
    // Registration
    'registration.title': 'पंजीकरण',
    'registration.name': 'पूरा नाम',
    'registration.email': 'ईमेल पता',
    'registration.phone': 'फोन नंबर',
    'registration.company': 'कंपनी',
    'registration.position': 'पद',
    'registration.submit': 'पंजीकरण जमा करें',
    'registration.success': 'पंजीकरण सफल!',
    'registration.error': 'पंजीकरण असफल',
    
    // Payment
    'payment.title': 'भुगतान',
    'payment.amount': 'राशि',
    'payment.method': 'भुगतान विधि',
    'payment.card': 'क्रेडिट/डेबिट कार्ड',
    'payment.upi': 'यूपीआई',
    'payment.netbanking': 'नेट बैंकिंग',
    'payment.processing': 'प्रसंस्करण...',
    'payment.success': 'भुगतान सफल!',
    'payment.failed': 'भुगतान असफल',
    
    // QR Code
    'qr.title': 'क्यूआर कोड',
    'qr.checkin': 'चेक-इन',
    'qr.scan': 'क्यूआर कोड स्कैन करें',
    'qr.success': 'चेक-इन सफल!',
    'qr.error': 'अमान्य क्यूआर कोड',
    
    // Admin
    'admin.dashboard': 'एडमिन डैशबोर्ड',
    'admin.users': 'उपयोगकर्ता प्रबंधन',
    'admin.roles': 'भूमिकाएं और विशेषाधिकार',
    'admin.payments': 'भुगतान विश्लेषण',
    'admin.settings': 'सिस्टम सेटिंग्स'
  },
  
  es: {
    // Navigation
    'nav.dashboard': 'Panel de Control',
    'nav.events': 'Eventos',
    'nav.users': 'Usuarios',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar Sesión',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    
    // Events
    'events.title': 'Eventos',
    'events.create': 'Crear Evento',
    'events.edit': 'Editar Evento',
    'events.delete': 'Eliminar Evento',
    'events.name': 'Nombre del Evento',
    'events.description': 'Descripción',
    'events.date': 'Fecha',
    'events.location': 'Ubicación',
    'events.price': 'Precio',
    'events.capacity': 'Capacidad',
    'events.status': 'Estado',
    'events.registrations': 'Registros',
    'events.speakers': 'Ponentes',
    'events.sessions': 'Sesiones',
    'events.team': 'Equipo',
    'events.calendar': 'Calendario'
  },
  
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.events': 'Événements',
    'nav.users': 'Utilisateurs',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.confirm': 'Confirmer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer'
  },
  
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.events': 'Veranstaltungen',
    'nav.users': 'Benutzer',
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden',
    
    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.create': 'Erstellen',
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.confirm': 'Bestätigen',
    'common.search': 'Suchen',
    'common.filter': 'Filter',
    'common.export': 'Exportieren',
    'common.import': 'Importieren'
  },
  
  ja: {
    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.events': 'イベント',
    'nav.users': 'ユーザー',
    'nav.settings': '設定',
    'nav.logout': 'ログアウト',
    
    // Common
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.create': '作成',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.confirm': '確認',
    'common.search': '検索',
    'common.filter': 'フィルター',
    'common.export': 'エクスポート',
    'common.import': 'インポート'
  },
  
  zh: {
    // Navigation
    'nav.dashboard': '仪表板',
    'nav.events': '活动',
    'nav.users': '用户',
    'nav.settings': '设置',
    'nav.logout': '登出',
    
    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '创建',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.export': '导出',
    'common.import': '导入'
  }
}

export function getTranslation(key: string, language: Language = 'en'): string {
  return translations[language]?.[key] || translations.en[key] || key
}

export function getCurrentLanguage(): Language {
  if (typeof window !== 'undefined') {
    // Try to get from API (will be cached by browser)
    const browser = navigator.language.split('-')[0] as Language
    if (browser in languages) return browser
  }
  return 'en'
}

export async function setLanguage(language: Language) {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      })
      window.dispatchEvent(new Event('languagechange'))
    } catch (err) {
      console.error('Failed to save language preference:', err)
    }
  }
}

export async function getLanguageFromDB(): Promise<Language> {
  try {
    const res = await fetch('/api/user/preferences')
    const data = await res.json()
    if (data.language && data.language in languages) {
      return data.language as Language
    }
  } catch (err) {
    console.error('Failed to load language preference:', err)
  }
  return getCurrentLanguage()
}
