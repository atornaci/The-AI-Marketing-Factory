// =========================================
// Internationalization (i18n) System
// Supports: tr, en, es, de, fr
// =========================================

export type Language = 'tr' | 'en' | 'es' | 'de' | 'fr'

export interface LanguageInfo {
    code: Language
    name: string
    nativeName: string
    flag: string
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
]

export const DEFAULT_LANGUAGE: Language = 'tr'

// Translation dictionary type
export interface Translations {
    // Navigation
    nav: {
        home: string
        dashboard: string
        newProject: string
        settings: string
        logout: string
        searchProjects: string
    }
    // Hero / Landing
    hero: {
        badge: string
        titleLine1: string
        titleHighlight: string
        titleLine2: string
        subtitle: string
        urlPlaceholder: string
        ctaButton: string
        trustedBy: string
    }
    // Features
    features: {
        title: string
        subtitle: string
        analysis: { title: string; description: string }
        influencer: { title: string; description: string }
        video: { title: string; description: string }
        multiPlatform: { title: string; description: string }
    }
    // How it works
    steps: {
        title: string
        subtitle: string
        step1: { title: string; description: string }
        step2: { title: string; description: string }
        step3: { title: string; description: string }
        step4: { title: string; description: string }
    }
    // CTA
    cta: {
        title: string
        subtitle: string
        button: string
    }
    // Dashboard
    dashboard: {
        totalProjects: string
        generatedVideos: string
        aiInfluencers: string
        totalViews: string
        myProjects: string
        myProjectsSubtitle: string
        newProject: string
        searchPlaceholder: string
        completed: string
        analyzing: string
        pending: string
        failed: string
        videos: string
        recentActivity: string
        noProjects: string
        addNewProject: string
    }
    // Project Detail
    project: {
        overview: string
        aiInfluencer: string
        videosTab: string
        assets: string
        analysisResults: string
        targetAudience: string
        valueProposition: string
        competitors: string
        brandTone: string
        keywords: string
        influencerProfile: string
        generateVideo: string
        generateInfluencer: string
        videoGallery: string
        selectPlatform: string
        draft: string
        ready: string
        published: string
        back: string
        demographics: string
        interests: string
        painPoints: string
    }
    // Create Project Dialog
    createProject: {
        title: string
        subtitle: string
        urlLabel: string
        urlPlaceholder: string
        languageLabel: string
        languageHelp: string
        startButton: string
        analyzing: string
        steps: {
            scraping: string
            analyzing: string
            constitution: string
            saving: string
        }
    }
    // Video Script
    videoScript: {
        generating: string
        hook: string
        body: string
        cta: string
        fullScript: string
        duration: string
        seconds: string
        platform: {
            instagram: string
            tiktok: string
            linkedin: string
        }
    }
    // Common
    common: {
        loading: string
        error: string
        success: string
        cancel: string
        save: string
        delete: string
        edit: string
        create: string
        close: string
        next: string
        previous: string
        language: string
        selectLanguage: string
        ago: string
        minutes: string
        hours: string
        days: string
        thisWeek: string
        thisMonth: string
        active: string
    }
}

// =========================================
// TURKISH (Default)
// =========================================
export const tr: Translations = {
    nav: {
        home: 'Ana Sayfa',
        dashboard: 'Panel',
        newProject: 'Yeni Proje',
        settings: 'Ayarlar',
        logout: 'Çıkış Yap',
        searchProjects: 'Proje ara...',
    },
    hero: {
        badge: 'Otonom AI Pazarlama Platformu',
        titleLine1: 'URL\'nizi Girin,',
        titleHighlight: 'AI Influencer',
        titleLine2: 'Videonuzu Üretsin',
        subtitle: 'Web projenizi analiz eden, özel AI Influencer oluşturan ve Instagram, TikTok, LinkedIn için otomatik pazarlama videoları üreten platform.',
        urlPlaceholder: 'Projenizin URL\'sini girin...',
        ctaButton: 'Analize Başla',
        trustedBy: 'Güvenilir markalar tarafından tercih ediliyor',
    },
    features: {
        title: 'Güçlü Özellikler',
        subtitle: 'Pazarlama sürecinizi tamamen otomatikleştirin',
        analysis: { title: 'Akıllı Analiz', description: 'URL\'nizi girin, AI projenizi derinlemesine analiz etsin.' },
        influencer: { title: 'AI Influencer', description: 'Markanıza özel AI karakter oluşturun.' },
        video: { title: 'Video Üretimi', description: 'Platform-spesifik pazarlama videoları otomatik üretin.' },
        multiPlatform: { title: 'Çoklu Platform', description: 'Instagram, TikTok ve LinkedIn için optimize edilmiş içerikler.' },
    },
    steps: {
        title: 'Nasıl Çalışır?',
        subtitle: '4 adımda pazarlama videonuzu oluşturun',
        step1: { title: 'URL\'yi Girin', description: 'Web projenizin adresini yapıştırın' },
        step2: { title: 'AI Analiz', description: 'Projeniz otomatik olarak analiz edilir' },
        step3: { title: 'Influencer Oluştur', description: 'Markanıza özel AI karakter' },
        step4: { title: 'Video Üret', description: 'Platformlara özel videolar' },
    },
    cta: {
        title: 'Pazarlamanızı Dönüştürmeye Hazır mısınız?',
        subtitle: 'Hemen başlayın, ilk videonuzu dakikalar içinde oluşturun.',
        button: 'Ücretsiz Başla',
    },
    dashboard: {
        totalProjects: 'Toplam Proje',
        generatedVideos: 'Üretilen Video',
        aiInfluencers: 'AI Influencer',
        totalViews: 'Toplam İzlenme',
        myProjects: 'Projelerim',
        myProjectsSubtitle: 'Aktif projelerinizi yönetin ve yeni pazarlama içerikleri üretin',
        newProject: 'Yeni Proje',
        searchPlaceholder: 'Proje ara...',
        completed: 'Tamamlandı',
        analyzing: 'Analiz Ediliyor',
        pending: 'Bekliyor',
        failed: 'Başarısız',
        videos: 'video',
        recentActivity: 'Son Aktiviteler',
        noProjects: 'Henüz proje yok',
        addNewProject: 'Yeni Proje Ekle',
    },
    project: {
        overview: 'Genel Bakış',
        aiInfluencer: 'AI Influencer',
        videosTab: 'Videolar',
        assets: 'Görseller',
        analysisResults: 'Analiz Sonuçları',
        targetAudience: 'Hedef Kitle',
        valueProposition: 'Değer Önerisi',
        competitors: 'Rakipler',
        brandTone: 'Marka Tonu',
        keywords: 'Anahtar Kelimeler',
        influencerProfile: 'Influencer Profili',
        generateVideo: 'Video Üret',
        generateInfluencer: 'Influencer Oluştur',
        videoGallery: 'Video Galerisi',
        selectPlatform: 'Platform Seçin',
        draft: 'Taslak',
        ready: 'Hazır',
        published: 'Yayınlandı',
        back: 'Geri',
        demographics: 'Demografi',
        interests: 'İlgi Alanları',
        painPoints: 'Sorunlar',
    },
    createProject: {
        title: 'Yeni Proje Oluştur',
        subtitle: 'Projenizin URL\'sini girin, AI her şeyi halletsin',
        urlLabel: 'Proje URL\'si',
        urlPlaceholder: 'https://ornek.com',
        languageLabel: 'İçerik Dili',
        languageHelp: 'Oluşturulacak içerikler bu dilde olacaktır',
        startButton: 'Projeyi Başlat',
        analyzing: 'Analiz ediliyor...',
        steps: {
            scraping: 'Web sayfası taranıyor...',
            analyzing: 'AI analiz yapıyor...',
            constitution: 'Pazarlama stratejisi oluşturuluyor...',
            saving: 'Proje kaydediliyor...',
        },
    },
    videoScript: {
        generating: 'Video senaryosu oluşturuluyor...',
        hook: 'Kanca',
        body: 'İçerik',
        cta: 'Eylem Çağrısı',
        fullScript: 'Tam Senaryo',
        duration: 'Süre',
        seconds: 'saniye',
        platform: {
            instagram: 'Instagram Reels',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn Video',
        },
    },
    common: {
        loading: 'Yükleniyor...',
        error: 'Bir hata oluştu',
        success: 'Başarılı!',
        cancel: 'İptal',
        save: 'Kaydet',
        delete: 'Sil',
        edit: 'Düzenle',
        create: 'Oluştur',
        close: 'Kapat',
        next: 'İleri',
        previous: 'Geri',
        language: 'Dil',
        selectLanguage: 'Dil Seçin',
        ago: 'önce',
        minutes: 'dk',
        hours: 'saat',
        days: 'gün',
        thisWeek: 'bu hafta',
        thisMonth: 'bu ay',
        active: 'Aktif',
    },
}

// =========================================
// ENGLISH
// =========================================
export const en: Translations = {
    nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        newProject: 'New Project',
        settings: 'Settings',
        logout: 'Logout',
        searchProjects: 'Search projects...',
    },
    hero: {
        badge: 'Autonomous AI Marketing Platform',
        titleLine1: 'Enter Your URL,',
        titleHighlight: 'AI Influencer',
        titleLine2: 'Creates Your Video',
        subtitle: 'A platform that analyzes your web project, creates a custom AI Influencer, and automatically produces marketing videos for Instagram, TikTok, and LinkedIn.',
        urlPlaceholder: 'Enter your project URL...',
        ctaButton: 'Start Analysis',
        trustedBy: 'Trusted by leading brands',
    },
    features: {
        title: 'Powerful Features',
        subtitle: 'Fully automate your marketing process',
        analysis: { title: 'Smart Analysis', description: 'Enter your URL, let AI deeply analyze your project.' },
        influencer: { title: 'AI Influencer', description: 'Create a custom AI character for your brand.' },
        video: { title: 'Video Production', description: 'Automatically produce platform-specific marketing videos.' },
        multiPlatform: { title: 'Multi-Platform', description: 'Optimized content for Instagram, TikTok, and LinkedIn.' },
    },
    steps: {
        title: 'How It Works',
        subtitle: 'Create your marketing video in 4 steps',
        step1: { title: 'Enter URL', description: 'Paste your web project address' },
        step2: { title: 'AI Analysis', description: 'Your project is automatically analyzed' },
        step3: { title: 'Create Influencer', description: 'Custom AI character for your brand' },
        step4: { title: 'Generate Video', description: 'Platform-specific videos' },
    },
    cta: {
        title: 'Ready to Transform Your Marketing?',
        subtitle: 'Get started now, create your first video in minutes.',
        button: 'Start Free',
    },
    dashboard: {
        totalProjects: 'Total Projects',
        generatedVideos: 'Generated Videos',
        aiInfluencers: 'AI Influencers',
        totalViews: 'Total Views',
        myProjects: 'My Projects',
        myProjectsSubtitle: 'Manage your active projects and create new marketing content',
        newProject: 'New Project',
        searchPlaceholder: 'Search projects...',
        completed: 'Completed',
        analyzing: 'Analyzing',
        pending: 'Pending',
        failed: 'Failed',
        videos: 'videos',
        recentActivity: 'Recent Activity',
        noProjects: 'No projects yet',
        addNewProject: 'Add New Project',
    },
    project: {
        overview: 'Overview',
        aiInfluencer: 'AI Influencer',
        videosTab: 'Videos',
        assets: 'Assets',
        analysisResults: 'Analysis Results',
        targetAudience: 'Target Audience',
        valueProposition: 'Value Proposition',
        competitors: 'Competitors',
        brandTone: 'Brand Tone',
        keywords: 'Keywords',
        influencerProfile: 'Influencer Profile',
        generateVideo: 'Generate Video',
        generateInfluencer: 'Create Influencer',
        videoGallery: 'Video Gallery',
        selectPlatform: 'Select Platform',
        draft: 'Draft',
        ready: 'Ready',
        published: 'Published',
        back: 'Back',
        demographics: 'Demographics',
        interests: 'Interests',
        painPoints: 'Pain Points',
    },
    createProject: {
        title: 'Create New Project',
        subtitle: 'Enter your project URL, let AI handle everything',
        urlLabel: 'Project URL',
        urlPlaceholder: 'https://example.com',
        languageLabel: 'Content Language',
        languageHelp: 'Generated content will be in this language',
        startButton: 'Start Project',
        analyzing: 'Analyzing...',
        steps: {
            scraping: 'Scraping web page...',
            analyzing: 'AI is analyzing...',
            constitution: 'Creating marketing strategy...',
            saving: 'Saving project...',
        },
    },
    videoScript: {
        generating: 'Generating video script...',
        hook: 'Hook',
        body: 'Body',
        cta: 'Call to Action',
        fullScript: 'Full Script',
        duration: 'Duration',
        seconds: 'seconds',
        platform: {
            instagram: 'Instagram Reels',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn Video',
        },
    },
    common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success!',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        close: 'Close',
        next: 'Next',
        previous: 'Previous',
        language: 'Language',
        selectLanguage: 'Select Language',
        ago: 'ago',
        minutes: 'min',
        hours: 'hours',
        days: 'days',
        thisWeek: 'this week',
        thisMonth: 'this month',
        active: 'Active',
    },
}

// =========================================
// SPANISH
// =========================================
export const es: Translations = {
    nav: {
        home: 'Inicio',
        dashboard: 'Panel',
        newProject: 'Nuevo Proyecto',
        settings: 'Configuración',
        logout: 'Cerrar Sesión',
        searchProjects: 'Buscar proyectos...',
    },
    hero: {
        badge: 'Plataforma Autónoma de Marketing con IA',
        titleLine1: 'Ingresa tu URL,',
        titleHighlight: 'AI Influencer',
        titleLine2: 'Crea tu Video',
        subtitle: 'Una plataforma que analiza tu proyecto web, crea un AI Influencer personalizado y produce automáticamente videos de marketing para Instagram, TikTok y LinkedIn.',
        urlPlaceholder: 'Ingresa la URL de tu proyecto...',
        ctaButton: 'Iniciar Análisis',
        trustedBy: 'Confianza de marcas líderes',
    },
    features: {
        title: 'Funciones Potentes',
        subtitle: 'Automatiza completamente tu proceso de marketing',
        analysis: { title: 'Análisis Inteligente', description: 'Ingresa tu URL, deja que la IA analice tu proyecto.' },
        influencer: { title: 'AI Influencer', description: 'Crea un personaje IA personalizado para tu marca.' },
        video: { title: 'Producción de Video', description: 'Produce automáticamente videos de marketing específicos.' },
        multiPlatform: { title: 'Multiplataforma', description: 'Contenido optimizado para Instagram, TikTok y LinkedIn.' },
    },
    steps: {
        title: '¿Cómo Funciona?',
        subtitle: 'Crea tu video de marketing en 4 pasos',
        step1: { title: 'Ingresa URL', description: 'Pega la dirección de tu proyecto' },
        step2: { title: 'Análisis IA', description: 'Tu proyecto se analiza automáticamente' },
        step3: { title: 'Crear Influencer', description: 'Personaje IA para tu marca' },
        step4: { title: 'Generar Video', description: 'Videos específicos por plataforma' },
    },
    cta: {
        title: '¿Listo para Transformar tu Marketing?',
        subtitle: 'Comienza ahora, crea tu primer video en minutos.',
        button: 'Comenzar Gratis',
    },
    dashboard: {
        totalProjects: 'Proyectos Totales',
        generatedVideos: 'Videos Generados',
        aiInfluencers: 'AI Influencers',
        totalViews: 'Vistas Totales',
        myProjects: 'Mis Proyectos',
        myProjectsSubtitle: 'Administra tus proyectos activos y crea nuevo contenido de marketing',
        newProject: 'Nuevo Proyecto',
        searchPlaceholder: 'Buscar proyectos...',
        completed: 'Completado',
        analyzing: 'Analizando',
        pending: 'Pendiente',
        failed: 'Fallido',
        videos: 'videos',
        recentActivity: 'Actividad Reciente',
        noProjects: 'Aún no hay proyectos',
        addNewProject: 'Agregar Nuevo Proyecto',
    },
    project: {
        overview: 'Resumen',
        aiInfluencer: 'AI Influencer',
        videosTab: 'Videos',
        assets: 'Recursos',
        analysisResults: 'Resultados del Análisis',
        targetAudience: 'Público Objetivo',
        valueProposition: 'Propuesta de Valor',
        competitors: 'Competidores',
        brandTone: 'Tono de Marca',
        keywords: 'Palabras Clave',
        influencerProfile: 'Perfil del Influencer',
        generateVideo: 'Generar Video',
        generateInfluencer: 'Crear Influencer',
        videoGallery: 'Galería de Videos',
        selectPlatform: 'Seleccionar Plataforma',
        draft: 'Borrador',
        ready: 'Listo',
        published: 'Publicado',
        back: 'Atrás',
        demographics: 'Demografía',
        interests: 'Intereses',
        painPoints: 'Puntos de Dolor',
    },
    createProject: {
        title: 'Crear Nuevo Proyecto',
        subtitle: 'Ingresa la URL de tu proyecto, deja que la IA se encargue',
        urlLabel: 'URL del Proyecto',
        urlPlaceholder: 'https://ejemplo.com',
        languageLabel: 'Idioma del Contenido',
        languageHelp: 'El contenido generado estará en este idioma',
        startButton: 'Iniciar Proyecto',
        analyzing: 'Analizando...',
        steps: {
            scraping: 'Escaneando página web...',
            analyzing: 'IA analizando...',
            constitution: 'Creando estrategia de marketing...',
            saving: 'Guardando proyecto...',
        },
    },
    videoScript: {
        generating: 'Generando guión de video...',
        hook: 'Gancho',
        body: 'Contenido',
        cta: 'Llamada a la Acción',
        fullScript: 'Guión Completo',
        duration: 'Duración',
        seconds: 'segundos',
        platform: {
            instagram: 'Instagram Reels',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn Video',
        },
    },
    common: {
        loading: 'Cargando...',
        error: 'Ocurrió un error',
        success: '¡Éxito!',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        close: 'Cerrar',
        next: 'Siguiente',
        previous: 'Anterior',
        language: 'Idioma',
        selectLanguage: 'Seleccionar Idioma',
        ago: 'hace',
        minutes: 'min',
        hours: 'horas',
        days: 'días',
        thisWeek: 'esta semana',
        thisMonth: 'este mes',
        active: 'Activo',
    },
}

// =========================================
// GERMAN
// =========================================
export const de: Translations = {
    nav: {
        home: 'Startseite',
        dashboard: 'Dashboard',
        newProject: 'Neues Projekt',
        settings: 'Einstellungen',
        logout: 'Abmelden',
        searchProjects: 'Projekte suchen...',
    },
    hero: {
        badge: 'Autonome KI-Marketing-Plattform',
        titleLine1: 'Geben Sie Ihre URL ein,',
        titleHighlight: 'KI-Influencer',
        titleLine2: 'erstellt Ihr Video',
        subtitle: 'Eine Plattform, die Ihr Webprojekt analysiert, einen maßgeschneiderten KI-Influencer erstellt und automatisch Marketing-Videos für Instagram, TikTok und LinkedIn produziert.',
        urlPlaceholder: 'Geben Sie Ihre Projekt-URL ein...',
        ctaButton: 'Analyse starten',
        trustedBy: 'Vertraut von führenden Marken',
    },
    features: {
        title: 'Leistungsstarke Funktionen',
        subtitle: 'Automatisieren Sie Ihren Marketing-Prozess vollständig',
        analysis: { title: 'Intelligente Analyse', description: 'Geben Sie Ihre URL ein, lassen Sie KI Ihr Projekt analysieren.' },
        influencer: { title: 'KI-Influencer', description: 'Erstellen Sie einen maßgeschneiderten KI-Charakter für Ihre Marke.' },
        video: { title: 'Videoproduktion', description: 'Produzieren Sie automatisch plattformspezifische Marketing-Videos.' },
        multiPlatform: { title: 'Multi-Plattform', description: 'Optimierte Inhalte für Instagram, TikTok und LinkedIn.' },
    },
    steps: {
        title: 'Wie funktioniert es?',
        subtitle: 'Erstellen Sie Ihr Marketing-Video in 4 Schritten',
        step1: { title: 'URL eingeben', description: 'Fügen Sie Ihre Webprojekt-Adresse ein' },
        step2: { title: 'KI-Analyse', description: 'Ihr Projekt wird automatisch analysiert' },
        step3: { title: 'Influencer erstellen', description: 'Maßgeschneiderter KI-Charakter' },
        step4: { title: 'Video generieren', description: 'Plattformspezifische Videos' },
    },
    cta: {
        title: 'Bereit, Ihr Marketing zu transformieren?',
        subtitle: 'Starten Sie jetzt, erstellen Sie Ihr erstes Video in Minuten.',
        button: 'Kostenlos starten',
    },
    dashboard: {
        totalProjects: 'Gesamtprojekte',
        generatedVideos: 'Generierte Videos',
        aiInfluencers: 'KI-Influencer',
        totalViews: 'Gesamtaufrufe',
        myProjects: 'Meine Projekte',
        myProjectsSubtitle: 'Verwalten Sie Ihre aktiven Projekte und erstellen Sie neue Marketing-Inhalte',
        newProject: 'Neues Projekt',
        searchPlaceholder: 'Projekte suchen...',
        completed: 'Abgeschlossen',
        analyzing: 'Wird analysiert',
        pending: 'Ausstehend',
        failed: 'Fehlgeschlagen',
        videos: 'Videos',
        recentActivity: 'Letzte Aktivitäten',
        noProjects: 'Noch keine Projekte',
        addNewProject: 'Neues Projekt hinzufügen',
    },
    project: {
        overview: 'Übersicht',
        aiInfluencer: 'KI-Influencer',
        videosTab: 'Videos',
        assets: 'Medien',
        analysisResults: 'Analyseergebnisse',
        targetAudience: 'Zielgruppe',
        valueProposition: 'Wertversprechen',
        competitors: 'Wettbewerber',
        brandTone: 'Markenton',
        keywords: 'Schlüsselwörter',
        influencerProfile: 'Influencer-Profil',
        generateVideo: 'Video generieren',
        generateInfluencer: 'Influencer erstellen',
        videoGallery: 'Video-Galerie',
        selectPlatform: 'Plattform wählen',
        draft: 'Entwurf',
        ready: 'Bereit',
        published: 'Veröffentlicht',
        back: 'Zurück',
        demographics: 'Demografie',
        interests: 'Interessen',
        painPoints: 'Schmerzpunkte',
    },
    createProject: {
        title: 'Neues Projekt erstellen',
        subtitle: 'Geben Sie Ihre Projekt-URL ein, lassen Sie KI alles erledigen',
        urlLabel: 'Projekt-URL',
        urlPlaceholder: 'https://beispiel.de',
        languageLabel: 'Inhaltssprache',
        languageHelp: 'Generierte Inhalte werden in dieser Sprache sein',
        startButton: 'Projekt starten',
        analyzing: 'Wird analysiert...',
        steps: {
            scraping: 'Webseite wird gescannt...',
            analyzing: 'KI analysiert...',
            constitution: 'Marketing-Strategie wird erstellt...',
            saving: 'Projekt wird gespeichert...',
        },
    },
    videoScript: {
        generating: 'Video-Skript wird erstellt...',
        hook: 'Aufhänger',
        body: 'Inhalt',
        cta: 'Handlungsaufforderung',
        fullScript: 'Vollständiges Skript',
        duration: 'Dauer',
        seconds: 'Sekunden',
        platform: {
            instagram: 'Instagram Reels',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn Video',
        },
    },
    common: {
        loading: 'Wird geladen...',
        error: 'Ein Fehler ist aufgetreten',
        success: 'Erfolgreich!',
        cancel: 'Abbrechen',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        create: 'Erstellen',
        close: 'Schließen',
        next: 'Weiter',
        previous: 'Zurück',
        language: 'Sprache',
        selectLanguage: 'Sprache wählen',
        ago: 'vor',
        minutes: 'Min',
        hours: 'Std',
        days: 'Tage',
        thisWeek: 'diese Woche',
        thisMonth: 'diesen Monat',
        active: 'Aktiv',
    },
}

// =========================================
// FRENCH
// =========================================
export const fr: Translations = {
    nav: {
        home: 'Accueil',
        dashboard: 'Tableau de bord',
        newProject: 'Nouveau Projet',
        settings: 'Paramètres',
        logout: 'Déconnexion',
        searchProjects: 'Rechercher des projets...',
    },
    hero: {
        badge: 'Plateforme de Marketing IA Autonome',
        titleLine1: 'Entrez votre URL,',
        titleHighlight: 'AI Influencer',
        titleLine2: 'crée votre vidéo',
        subtitle: 'Une plateforme qui analyse votre projet web, crée un AI Influencer personnalisé et produit automatiquement des vidéos marketing pour Instagram, TikTok et LinkedIn.',
        urlPlaceholder: 'Entrez l\'URL de votre projet...',
        ctaButton: 'Démarrer l\'analyse',
        trustedBy: 'Utilisé par des marques de premier plan',
    },
    features: {
        title: 'Fonctionnalités Puissantes',
        subtitle: 'Automatisez entièrement votre processus marketing',
        analysis: { title: 'Analyse Intelligente', description: 'Entrez votre URL, laissez l\'IA analyser votre projet.' },
        influencer: { title: 'AI Influencer', description: 'Créez un personnage IA personnalisé pour votre marque.' },
        video: { title: 'Production Vidéo', description: 'Produisez automatiquement des vidéos marketing spécifiques.' },
        multiPlatform: { title: 'Multi-Plateforme', description: 'Contenu optimisé pour Instagram, TikTok et LinkedIn.' },
    },
    steps: {
        title: 'Comment ça marche?',
        subtitle: 'Créez votre vidéo marketing en 4 étapes',
        step1: { title: 'Entrez l\'URL', description: 'Collez l\'adresse de votre projet' },
        step2: { title: 'Analyse IA', description: 'Votre projet est automatiquement analysé' },
        step3: { title: 'Créer Influencer', description: 'Personnage IA pour votre marque' },
        step4: { title: 'Générer Vidéo', description: 'Vidéos spécifiques par plateforme' },
    },
    cta: {
        title: 'Prêt à Transformer votre Marketing?',
        subtitle: 'Commencez maintenant, créez votre première vidéo en minutes.',
        button: 'Commencer Gratuitement',
    },
    dashboard: {
        totalProjects: 'Projets Totaux',
        generatedVideos: 'Vidéos Générées',
        aiInfluencers: 'AI Influencers',
        totalViews: 'Vues Totales',
        myProjects: 'Mes Projets',
        myProjectsSubtitle: 'Gérez vos projets actifs et créez de nouveaux contenus marketing',
        newProject: 'Nouveau Projet',
        searchPlaceholder: 'Rechercher des projets...',
        completed: 'Terminé',
        analyzing: 'En cours d\'analyse',
        pending: 'En attente',
        failed: 'Échoué',
        videos: 'vidéos',
        recentActivity: 'Activité Récente',
        noProjects: 'Pas encore de projets',
        addNewProject: 'Ajouter un Nouveau Projet',
    },
    project: {
        overview: 'Aperçu',
        aiInfluencer: 'AI Influencer',
        videosTab: 'Vidéos',
        assets: 'Ressources',
        analysisResults: 'Résultats d\'Analyse',
        targetAudience: 'Public Cible',
        valueProposition: 'Proposition de Valeur',
        competitors: 'Concurrents',
        brandTone: 'Ton de Marque',
        keywords: 'Mots-clés',
        influencerProfile: 'Profil Influencer',
        generateVideo: 'Générer Vidéo',
        generateInfluencer: 'Créer Influencer',
        videoGallery: 'Galerie Vidéo',
        selectPlatform: 'Sélectionner Plateforme',
        draft: 'Brouillon',
        ready: 'Prêt',
        published: 'Publié',
        back: 'Retour',
        demographics: 'Démographie',
        interests: 'Intérêts',
        painPoints: 'Points de Douleur',
    },
    createProject: {
        title: 'Créer un Nouveau Projet',
        subtitle: 'Entrez l\'URL de votre projet, laissez l\'IA s\'occuper du reste',
        urlLabel: 'URL du Projet',
        urlPlaceholder: 'https://exemple.fr',
        languageLabel: 'Langue du Contenu',
        languageHelp: 'Le contenu généré sera dans cette langue',
        startButton: 'Démarrer le Projet',
        analyzing: 'Analyse en cours...',
        steps: {
            scraping: 'Scan de la page web...',
            analyzing: 'L\'IA analyse...',
            constitution: 'Création de la stratégie marketing...',
            saving: 'Sauvegarde du projet...',
        },
    },
    videoScript: {
        generating: 'Génération du script vidéo...',
        hook: 'Accroche',
        body: 'Contenu',
        cta: 'Appel à l\'action',
        fullScript: 'Script Complet',
        duration: 'Durée',
        seconds: 'secondes',
        platform: {
            instagram: 'Instagram Reels',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn Vidéo',
        },
    },
    common: {
        loading: 'Chargement...',
        error: 'Une erreur est survenue',
        success: 'Succès!',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        close: 'Fermer',
        next: 'Suivant',
        previous: 'Précédent',
        language: 'Langue',
        selectLanguage: 'Choisir la langue',
        ago: 'il y a',
        minutes: 'min',
        hours: 'heures',
        days: 'jours',
        thisWeek: 'cette semaine',
        thisMonth: 'ce mois',
        active: 'Actif',
    },
}

// =========================================
// Translation Map & Helper
// =========================================
const translationMap: Record<Language, Translations> = { tr, en, es, de, fr }

export function getTranslations(lang: Language): Translations {
    return translationMap[lang] || translationMap[DEFAULT_LANGUAGE]
}

export function getLanguageInfo(code: Language): LanguageInfo {
    return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0]
}
