import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { sileo } from 'sileo';
import {
  Eye,
  Volume2,
  Hand,
  Sparkles,
  Check,
  ShieldCheck,
  HeartHandshake,
  Sliders,
  Type,
  Maximize2,
  RotateCcw,
  VolumeX,
  Keyboard,
  Info,
  CheckCircle2,
  Play
} from 'lucide-react';

export const AccessibilitySection = () => {
  const {
    settings,
    updateSetting,
    applyProfilePreset,
    showVisualSubtitle,
    speakText,
    openAccessibilityModal,
  } = useAccessibility();

  const [testText, setTestText] = useState('Parqu: saldo disponible 250 pesos, parquímetro activo en cajón 14.');

  const handleTestVoice = () => {
    speakText(testText);
    sileo.success({
      title: 'Lectura en Voz Alta',
      description: 'Audio emitido para lectores de pantalla TalkBack / VoiceOver.',
    });
  };

  const handleTestSubtitle = () => {
    showVisualSubtitle('🔔 Alerta visual: Parquímetro sincronizado correctamente. Saldo protegido.');
    sileo.info({
      title: 'Subtítulo en Pantalla',
      description: 'Transcripción visual desplegada para usuarios con discapacidad auditiva.',
    });
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* ═══ ENCABEZADO DEL CENTRO DE ACCESIBILIDAD ═══ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tracking-widest uppercase font-bold text-slate-800">SISTEMA INCLUSIVO UNIVERSAL</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">WCAG 2.2 AA / AAA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-3 font-sans">
            <HeartHandshake className="w-7 h-7 text-black shrink-0" />
            <span>Centro de Accesibilidad e Inclusión</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans max-w-2xl leading-relaxed">
            Plataforma adaptada según los lineamientos oficiales para personas con discapacidad visual, auditiva, motora y cognitiva.
          </p>
        </div>

        <button
          type="button"
          onClick={openAccessibilityModal}
          className="px-5 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Sliders className="w-4 h-4 text-white" />
          <span>Asistente de Bienvenida</span>
        </button>
      </div>

      {/* ═══ SELECTOR DE PERFILES RÁPIDOS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'visual', title: 'Visual', icon: Eye, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { id: 'auditory', title: 'Auditiva', icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { id: 'motor', title: 'Motora / Física', icon: Hand, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { id: 'cognitive', title: 'Cognitiva', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        ].map((p) => {
          const isActive = settings.profile === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyProfilePreset(p.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isActive
                  ? 'border-black bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl border ${isActive ? 'bg-white/10 border-white/20 text-white' : p.color}`}>
                  <Icon size={18} />
                </div>
                {isActive && <span className="text-[10px] font-mono font-bold text-emerald-400">ACTIVO</span>}
              </div>
              <span className="font-bold text-xs sm:text-sm font-sans block">
                {p.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══ 1. REGLAS PARA DISCAPACIDAD VISUAL ═══ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <Eye size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">Reglas para Discapacidad Visual</h3>
            <p className="text-xs text-slate-500">Lectores de pantalla, contraste elevado y fuentes ajustables</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alto Contraste AAA */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Modo Alto Contraste (AAA)</span>
              <span className="text-[11px] text-slate-600">Proporción de contraste superior a 7:1 para baja visión.</span>
            </div>
            <input
              type="checkbox"
              aria-label="Activar alto contraste"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Tamaño de Letra Ajustable */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Tamaño de Letra</span>
              <span className="text-[11px] text-slate-600">Escala de fuente sin romper la pantalla.</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { label: 'A', value: 'normal', title: 'Normal' },
                { label: 'A+', value: 'large', title: 'Grande (+15%)' },
                { label: 'A++', value: 'xlarge', title: 'Extra (+30%)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  onClick={() => updateSetting('fontSize', opt.value)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer ${
                    settings.fontSize === opt.value
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asistente de Lectura en Voz Alta */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Asistente de Voz / Lectura</span>
              <span className="text-[11px] text-slate-600">Lee en voz alta opciones y estados en tiempo real.</span>
            </div>
            <input
              type="checkbox"
              aria-label="Activar asistente de voz"
              checked={settings.speechAssist}
              onChange={(e) => updateSetting('speechAssist', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Probador de Lectura */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Probar Lectura Hablada</span>
              <span className="text-[11px] text-slate-600">Verifica la síntesis de voz en tu dispositivo.</span>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play size={12} fill="white" />
              <span>Escuchar</span>
            </button>
          </div>
        </div>

        {/* Garantía de Lectores de Pantalla */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>TalkBack (Android) y VoiceOver (iOS) certificados:</strong> Todos los botones, imágenes y formularios cuentan con atributos <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">aria-label</code> y <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">alt</code> explícitos.
          </span>
        </div>
      </div>

      {/* ═══ 2. REGLAS PARA DISCAPACIDAD AUDITIVA ═══ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
            <Volume2 size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">Reglas para Discapacidad Auditiva</h3>
            <p className="text-xs text-slate-500">Subtítulos en pantalla, transcripciones y alertas hápticas y visuales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subtítulos en Pantalla */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Subtítulos y Transcripción en Vivo</span>
              <span className="text-[11px] text-slate-600">Muestra texto sincronizado ante música o sonidos.</span>
            </div>
            <input
              type="checkbox"
              aria-label="Activar subtítulos en pantalla"
              checked={settings.visualSubtitles}
              onChange={(e) => updateSetting('visualSubtitles', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Probador de Subtítulo */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Probar Alerta Visual y Subtítulo</span>
              <span className="text-[11px] text-slate-600">Despliega un ejemplo de alerta visual en pantalla.</span>
            </div>
            <button
              type="button"
              onClick={handleTestSubtitle}
              className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={12} />
              <span>Probar</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Cero dependencia acústica:</strong> Ningún estado ni notificación depende exclusivamente de sonidos. Cada alerta va respaldada por color, texto e impulsos hápticos por vibración.
          </span>
        </div>
      </div>

      {/* ═══ 3. REGLAS PARA DISCAPACIDAD MOTORA Y FÍSICA ═══ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Hand size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">Reglas para Discapacidad Motora y Física</h3>
            <p className="text-xs text-slate-500">Zonas táctiles grandes (48x48px) y navegación universal por teclado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zonas Táctiles Grandes */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Zonas Táctiles Grandes (48x48 px)</span>
              <span className="text-[11px] text-slate-600">Facilita el toque evitando pulsaciones accidentales.</span>
            </div>
            <input
              type="checkbox"
              aria-label="Activar zonas táctiles de 48 píxeles"
              checked={settings.largeTouchTargets}
              onChange={(e) => updateSetting('largeTouchTargets', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Reducción de Movimiento */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-black block">Reducir Movimiento y Parallax</span>
              <span className="text-[11px] text-slate-600">Suprime animaciones rápidas o giros tridimensionales.</span>
            </div>
            <input
              type="checkbox"
              aria-label="Reducir animaciones y movimiento"
              checked={settings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>
        </div>

        {/* Guía de Navegación por Teclado */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-xs text-black">
            <Keyboard size={16} />
            <span>Guía de Navegación por Teclado / Switches Adaptados:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 font-mono">
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-black font-bold block">Tab</span>
              <span className="text-[10px]">Avanzar foco</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-black font-bold block">Shift + Tab</span>
              <span className="text-[10px]">Retroceder foco</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-black font-bold block">Enter / Espacio</span>
              <span className="text-[10px]">Activar botón</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-black font-bold block">Flechas ↑ ↓</span>
              <span className="text-[10px]">Girar opciones 3D</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 4. REGLAS PARA DISCAPACIDAD COGNITIVA ═══ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">Reglas para Discapacidad Cognitiva</h3>
            <p className="text-xs text-slate-500">Diseño simple, lenguaje sin tecnicismos y tolerancia ante errores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-black block">Lenguaje Claro</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Explicaciones transparentes de cada costo ($0.25/min) sin letra chica ni cobros ocultos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-black block">Tolerancia al Error</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Posibilidad de cancelar recargas, confirmar antes de debitar y deshacer estancias sin penalización.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-black block">Sin Límite de Tiempo</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Los formularios no expiran mientras llenas tus datos; puedes completarlos con tranquilidad a tu propio ritmo.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AccessibilitySection;
