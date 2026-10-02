import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Dispara una vibración háptica suave y nativa en dispositivos móviles (iOS / Android).
 * Si la app se ejecuta en navegador web de escritorio, no produce ningún error.
 */
export const triggerHaptic = async (style = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // silenciado si el dispositivo no soporta háptica
    }
  }
};

export const triggerSuccessHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // silenciado
    }
  }
};

export const triggerWarningHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      // silenciado
    }
  }
};
