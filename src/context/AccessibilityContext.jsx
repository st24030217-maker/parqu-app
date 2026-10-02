import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

const AccessibilityContext = createContext(null);

const STORAGE_KEY = 'parqu_accessibility_config_v1';
const FIRST_TIME_KEY = 'parqu_accessibility_onboarded_v1';

const DEFAULT_SETTINGS = {
  profile: 'standard', // 'standard' | 'visual' | 'auditory' | 'motor' | 'cognitive' | 'custom'
  highContrast: false,
  fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
  largeTouchTargets: false,
  reducedMotion: false,
  visualSubtitles: true,
  speechAssist: false,
  screenReaderFriendly: true,
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (_) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [subtitleTimer, setSubtitleTimer] = useState(null);

  // Comprobar si es la primera vez para mostrar el modal de presentación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const onboarded = localStorage.getItem(FIRST_TIME_KEY);
        if (!onboarded) {
          // Abrir modal de presentación de accesibilidad en el primer inicio
          setIsSetupModalOpen(true);
        }
      } catch (_) {}
    }
  }, []);

  // Guardar configuración en localStorage y sincronizar clases globales en el documento HTML
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (_) {}

      const root = document.documentElement;

      // 1. Alto Contraste (AAA)
      if (settings.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      // 2. Tamaño de fuente ajustable
      root.classList.remove('font-large', 'font-xlarge');
      if (settings.fontSize === 'large') {
        root.classList.add('font-large');
      } else if (settings.fontSize === 'xlarge') {
        root.classList.add('font-xlarge');
      }

      // 3. Zonas táctiles grandes (mínimo 48x48px)
      if (settings.largeTouchTargets) {
        root.classList.add('touch-large');
      } else {
        root.classList.remove('touch-large');
      }

      // 4. Reducción de movimiento
      if (settings.reducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }
    }
  }, [settings]);

  // Mostrar subtítulos visuales sincronizados para personas con discapacidad auditiva
  const showVisualSubtitle = useCallback((text, durationMs = 2800) => {
    if (!settings.visualSubtitles) return;
    setSubtitle(text);
    if (subtitleTimer) clearTimeout(subtitleTimer);
    const timer = setTimeout(() => {
      setSubtitle('');
    }, durationMs);
    setSubtitleTimer(timer);
  }, [settings.visualSubtitles, subtitleTimer]);

  // Síntesis de voz para personas con discapacidad visual (TalkBack / VoiceOver en web)
  const speakText = useCallback((text) => {
    if (!settings.speechAssist || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (_) {}
  }, [settings.speechAssist]);

  // Aplicar un perfil predefinido según las reglas de accesibilidad
  const applyProfilePreset = useCallback((profileKey) => {
    triggerHaptic();
    let newConfig = { ...DEFAULT_SETTINGS, profile: profileKey };

    switch (profileKey) {
      case 'visual':
        // Reglas para discapacidad visual: Alto contraste, texto aumentado, descripciones
        newConfig = {
          ...newConfig,
          highContrast: true,
          fontSize: 'large',
          speechAssist: true,
          screenReaderFriendly: true,
          reducedMotion: true,
          largeTouchTargets: true,
        };
        speakText('Perfil de discapacidad visual activado: alto contraste y tamaño aumentado.');
        break;

      case 'auditory':
        // Reglas para discapacidad auditiva: Alertas visuales y hápticas, subtítulos en vivo
        newConfig = {
          ...newConfig,
          visualSubtitles: true,
          largeTouchTargets: false,
          highContrast: false,
        };
        showVisualSubtitle('Perfil de discapacidad auditiva activado: subtítulos y alertas visuales.');
        break;

      case 'motor':
        // Reglas para discapacidad motora: Zonas táctiles 48px+, foco de teclado reforzado
        newConfig = {
          ...newConfig,
          largeTouchTargets: true,
          reducedMotion: true,
          fontSize: 'large',
        };
        break;

      case 'cognitive':
        // Reglas para discapacidad cognitiva: Interfaz simple, reducida, clara
        newConfig = {
          ...newConfig,
          reducedMotion: true,
          fontSize: 'large',
          visualSubtitles: true,
          largeTouchTargets: true,
        };
        break;

      case 'standard':
      default:
        newConfig = { ...DEFAULT_SETTINGS, profile: 'standard' };
        break;
    }

    setSettings(newConfig);
  }, [speakText, showVisualSubtitle]);

  const updateSetting = useCallback((key, value) => {
    triggerHaptic();
    setSettings(prev => ({
      ...prev,
      [key]: value,
      profile: 'custom',
    }));
  }, []);

  const completeOnboarding = useCallback((profileKey = 'standard') => {
    triggerHaptic();
    applyProfilePreset(profileKey);
    setIsSetupModalOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FIRST_TIME_KEY, 'true');
      } catch (_) {}
    }
  }, [applyProfilePreset]);

  const openAccessibilityModal = useCallback(() => {
    triggerHaptic();
    setIsSetupModalOpen(true);
  }, []);

  const closeAccessibilityModal = useCallback(() => {
    setIsSetupModalOpen(false);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        applyProfilePreset,
        isSetupModalOpen,
        openAccessibilityModal,
        closeAccessibilityModal,
        completeOnboarding,
        subtitle,
        showVisualSubtitle,
        speakText,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe ser utilizado dentro de un AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;
