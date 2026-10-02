import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Eye, 
  Volume2, 
  Hand, 
  Sparkles, 
  Check, 
  Sliders, 
  ArrowRight, 
  ShieldCheck, 
  HeartHandshake,
  CheckCircle2,
  X
} from 'lucide-react';

export const AccessibilityOnboardingModal = () => {
  const { 
    isSetupModalOpen, 
    closeAccessibilityModal, 
    completeOnboarding,
    settings,
    applyProfilePreset,
    updateSetting 
  } = useAccessibility();

  const [selectedProfile, setSelectedProfile] = useState(settings.profile || 'standard');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isSetupModalOpen) return null;

  const PROFILES = [
    {
      id: 'visual',
      title: 'Discapacidad Visual',
      badge: 'BAJA VISIÓN / CEGUERA',
      icon: Eye,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      description: 'Alto contraste (AAA), texto ampliado, asistente de voz y soporte para lectores de pantalla TalkBack y VoiceOver.',
      features: ['Alto Contraste AAA', 'Texto Ampliado', 'Lectores de Pantalla', 'Sin Animaciones Agresivas'],
    },
    {
      id: 'auditory',
      title: 'Discapacidad Auditiva',
      badge: 'SUBTÍTULOS & HÁPTICOS',
      icon: Volume2,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      description: 'Alertas 100% visuales con colores e iconos, vibraciones hápticas y subtítulos en pantalla para todos los sonidos y notas musicales.',
      features: ['Subtítulos en Pantalla', 'Alertas por Color y Vibración', 'Cero Dependencia de Sonido'],
    },
    {
      id: 'motor',
      title: 'Discapacidad Motora o Física',
      badge: 'ZONAS TÁCTILES 48PX+',
      icon: Hand,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      description: 'Botones y áreas interactivas de al menos 48x48 píxeles. Compatible con navegación por teclado y switches adaptados sin gestos complejos.',
      features: ['Botones Grandes (48px+)', 'Navegación por Teclado', 'Sin Arrastre Obligatorio'],
    },
    {
      id: 'cognitive',
      title: 'Discapacidad Cognitiva',
      badge: 'DISEÑO SIMPLE & CLARO',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      description: 'Lenguaje claro, interfaz limpia sin distracciones visuales, tiempo extra en formularios y opción fácil de corregir o deshacer acciones.',
      features: ['Lenguaje Sencillo', 'Sin Distracciones', 'Tolerancia a Errores'],
    },
    {
      id: 'standard',
      title: 'Experiencia Estándar',
      badge: 'MODO PREDETERMINADO',
      icon: CheckCircle2,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      description: 'Experiencia visual, sonora y táctil completa de Parqu con la configuración original.',
      features: ['Menú 3D Fluido', 'Música y Sonidos', 'Diseño Moderno'],
    },
  ];

  const handleSelect = (id) => {
    setSelectedProfile(id);
    applyProfilePreset(id);
  };

  const handleSaveAndEnter = () => {
    completeOnboarding(selectedProfile);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-modal-title"
      aria-describedby="accessibility-modal-desc"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full p-5 sm:p-8 text-left shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Botón cerrar si ya no es primer ingreso */}
        <button
          type="button"
          aria-label="Cerrar asistente de accesibilidad"
          onClick={closeAccessibilityModal}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <X size={18} />
        </button>

        {/* Encabezado de presentación inclusiva */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <HeartHandshake className="w-5 h-5 text-white" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-700">
              ACCESIBILIDAD UNIVERSAL • WCAG 2.2
            </span>
          </div>

          <h2 id="accessibility-modal-title" className="text-xl sm:text-2xl font-black text-slate-950 font-sans tracking-tight">
            ¿Cómo deseas que adaptemos Parqu para ti?
          </h2>
          <p id="accessibility-modal-desc" className="text-xs sm:text-sm text-slate-600 font-sans mt-1 leading-relaxed">
            Queremos que todas las personas tengan una experiencia digna, cómoda y sin barreras. Elige tu perfil preferido o personalízalo:
          </p>
        </div>

        {/* Tarjetas de Selección de Perfil */}
        <div className="space-y-2.5 max-h-[46vh] sm:max-h-[50vh] overflow-y-auto pr-1">
          {PROFILES.map((p) => {
            const isSelected = selectedProfile === p.id;
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => handleSelect(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(p.id);
                  }
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-black bg-slate-50 shadow-md ring-1 ring-black'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900 font-sans">
                      {p.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {p.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-sans leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.map((f, i) => (
                      <span key={i} className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                  isSelected ? 'border-black bg-black text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Acordeón de Personalización Avanzada */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders size={13} />
            <span>{showAdvanced ? 'Ocultar ajustes individuales' : 'Personalizar ajustes manualmente'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans animate-in fade-in duration-200">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Alto Contraste (AAA)</span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Botones Grandes (48px+)</span>
                <input
                  type="checkbox"
                  checked={settings.largeTouchTargets}
                  onChange={(e) => updateSetting('largeTouchTargets', e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Subtítulos en Pantalla</span>
                <input
                  type="checkbox"
                  checked={settings.visualSubtitles}
                  onChange={(e) => updateSetting('visualSubtitles', e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Asistente de Voz / Lectura</span>
                <input
                  type="checkbox"
                  checked={settings.speechAssist}
                  onChange={(e) => updateSetting('speechAssist', e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5 mt-2 border-t border-slate-100 font-sans">
          <button
            type="button"
            onClick={() => handleSelect('standard')}
            className="sm:w-1/3 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer text-center"
          >
            Modo Estándar
          </button>
          
          <button
            type="button"
            onClick={handleSaveAndEnter}
            className="flex-1 py-3 px-6 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer transform active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <span>Entrar a Parqu Adaptado</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccessibilityOnboardingModal;
