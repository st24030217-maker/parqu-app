import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  Clock,
  CreditCard,
  Compass,
  QrCode,
  Sparkles,
  Zap,
  MapPin,
  Lock,
  Activity,
} from 'lucide-react';
import { Threads } from './ui/Threads';
import { useParking } from '../context/ParkingContext';

const THREADS_COLOR = [0.16, 0.36, 1.0];
const THREADS_STYLE = { width: '100%', height: '100%' };

// Subcomponente aislado para el cronómetro en vivo dentro del Render 3D:
// evita re-renderizar toda la pantalla de carga o el shader WebGL cada segundo.
const LiveTelemetryTicker = memo(({ plates, balance, onEnter }) => {
  const [seconds, setSeconds] = useState(1462);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const liveCost = ((seconds / 60) * 0.25).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-4 sm:p-5">
      {/* Panel Izquierdo del Render: Estado de Sesión en Vivo */}
      <div className="md:col-span-7 rounded-xl bg-[#111528]/95 p-4 sm:p-5 flex flex-col justify-between text-left border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#8a94b8]">
              SESIÓN METROPOLITANA ACTIVA
            </span>
          </div>
          <span className="font-mono text-[11px] text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md">
            $0.25 MXN / MIN
          </span>
        </div>

        <div className="my-2 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8a94b8] mb-1">
              Tiempo Transcurrido
            </div>
            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white">
              00:{formattedTime}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8a94b8] mb-1">
              Cargo Exacto al Segundo
            </div>
            <div className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
              ${liveCost} <span className="text-xs text-[#8a94b8]">MXN</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3.5 bg-[#0b0e1c] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-4 h-4 text-[#807DFE]" />
            <span className="font-mono text-xs text-white font-semibold">
              PLACA: {plates || 'ABC-123-A'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400">
            ● BLINDAJE QR VERIFICADO
          </span>
        </div>
      </div>

      {/* Panel Derecho del Render: Comandos Rápidos y Billetera */}
      <div className="md:col-span-5 flex flex-col gap-3.5 text-left">
        <div className="rounded-xl bg-[#111528]/95 p-4 border-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8a94b8]">
              Billetera Digital Parqu
            </span>
            <CreditCard className="w-4 h-4 text-[#807DFE]" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ${Number(balance ?? 250).toFixed(2)} <span className="text-xs font-normal text-[#8a94b8]">MXN</span>
          </div>
          <div className="mt-1 text-[12px] text-[#8a94b8]">
            Autocobro sin comisiones • Cifrado AES-256
          </div>
        </div>

        <div
          onClick={onEnter}
          className="flex-1 rounded-xl bg-[#111528]/95 hover:bg-[#171c36] p-4 flex flex-col justify-between cursor-pointer transition-colors border-0 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#807DFE]">
              ACCESO DIRECTO
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#8a94b8] group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Abrir Consola de Parquímetro
            </div>
            <div className="text-xs text-[#8a94b8] mt-0.5">
              Gestiona zonas, placas y pase QR en tiempo real.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const EXPECTATIONS_ITEMS = [
  {
    index: '01',
    title: 'Cobro exacto al segundo',
    description:
      'Olvídate de pagar horas completas por adelantado. Parqu contabiliza únicamente los segundos reales de tu estancia a $0.25 MXN por minuto.',
    linkLabel: 'Explorar tarifa justa',
  },
  {
    index: '02',
    title: 'Blindaje vial cero multas',
    description:
      'Tu placa queda sincronizada al instante con los supervisores viales mediante una credencial QR dinámica imposible de falsificar.',
    linkLabel: 'Ver validación QR',
  },
  {
    index: '03',
    title: 'Billetera digital sin fricción',
    description:
      'Recarga saldo al instante, registra múltiples vehículos y recibe alertas inteligentes antes de que finalice tu tiempo.',
    linkLabel: 'Abrir billetera',
  },
];

const FAQ_ITEMS = [
  {
    q: '¿Cómo funciona el cobro por segundo en Parqu?',
    a: 'Al iniciar tu sesión en el parquímetro digital, el cronómetro activa la tarifa oficial de $0.25 MXN por minuto ($0.0041 MXN por segundo). Cuando te retiras y detienes el reloj, solo se descuenta de tu saldo el tiempo exacto utilizado.',
  },
  {
    q: '¿Cómo verifican los agentes de tránsito que mi auto tiene pago activo?',
    a: 'Tu matrícula queda activa en la red metropolitana en tiempo real y además cuentas con un Pase Digital con código QR dinámico y firma criptográfica para validación inmediata.',
  },
  {
    q: '¿Puedo cambiar de zona metropolitana con el mismo saldo?',
    a: 'Sí. Tu saldo digital de Parqu es universal en todos los sectores metropolitanos conectados (Centro Histórico, Zona Financiera, Corredor Comercial y Polígonos Turísticos).',
  },
  {
    q: '¿Qué sucede si me quedo sin batería o sin conexión?',
    a: 'La sesión corre de forma segura en la nube metropolitana vinculada a tus placas registradas, protegiendo tu vehículo contra infracciones en todo momento.',
  },
];

export const LoadingScreen = ({ onComplete }) => {
  const { vehicle, card } = useParking();
  const [isExiting, setIsExiting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const hasExitedRef = useRef(false);

  // Ejecuta la animación de salida suave y reactiva inmediatamente el fondo principal
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    document.body.dataset.loadingActive = 'false';
    setIsExiting(true);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 620);
  }, [onComplete]);

  // Atajo de teclado: Enter para entrar al sistema rápidamente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTriggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerExit]);

  // Pausa el shader secundario (CloudSky) mientras la pantalla de inicio está activa
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.loadingActive = 'true';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.dataset.loadingActive = 'false';
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.62s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.45s ease',
        willChange: 'transform, opacity',
      }}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto bg-[#06070f] text-white font-sans"
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FONDO ANIMADO THREADS (REACT BITS) + RESPLANDOR ATMOSFÉRICO
        ══════════════════════════════════════════════════════════════
      */}
      <div className="fixed inset-0 z-0 pointer-events-auto overflow-hidden">
        <Threads
          color={THREADS_COLOR}
          amplitude={1.15}
          distance={0.22}
          enableMouseInteraction={true}
          style={THREADS_STYLE}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 28%, rgba(0, 51, 255, 0.26) 0%, rgba(6, 7, 15, 0.72) 52%, rgba(6, 7, 15, 0.95) 100%)',
          }}
        />
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════
        1. NAVIGATION BAR: Oscura de ancho completo, logo a la izquierda,
        ~7 enlaces centro-derecha, link plano y botón píldora blanco
        ══════════════════════════════════════════════════════════════
      */}
      <header className="sticky top-0 z-30 w-full bg-[#06070f]/80 backdrop-blur-md border-0">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo Izquierda */}
          <div
            onClick={handleTriggerExit}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0033FF] flex items-center justify-center shadow-[0_0_16px_rgba(0,51,255,0.6)]">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className="h-4 w-auto object-contain"
              />
            </div>
            <span className="text-white font-bold text-[15px] tracking-tight">
              Parqu
            </span>
          </div>

          {/* Enlaces Centro-Derecha + Link Plano + Botón Píldora Blanco */}
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-6 text-[13px] text-[#8a94b8]">
              <button
                type="button"
                onClick={() => scrollToSection('parqu-expectations')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Autocobro
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('parqu-spotlight')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Telemetría
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('parqu-bento')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Funciones
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('parqu-bento')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Pase QR
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('parqu-resources')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Seguridad
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('parqu-faq')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Preguntas
              </button>
              <button
                type="button"
                onClick={handleTriggerExit}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Mapa 3D
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleTriggerExit}
                className="hidden sm:inline-block text-[13px] text-[#8a94b8] hover:text-white transition-colors cursor-pointer"
              >
                Pase Digital
              </button>

              <button
                type="button"
                onClick={handleTriggerExit}
                className="px-4 py-1.5 rounded-[10px] bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] transition-all active:scale-95 cursor-pointer border-0 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                Entrar al Sistema
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        ══════════════════════════════════════════════════════════════
        2. HERO: Titular centrado de dos líneas (primera atenuada, segunda
        blanca), subtítulo corto gris, botón píldora blanco, nota monospace
        y render 3D oscuro que se funde hacia el fondo negro inferior
        ══════════════════════════════════════════════════════════════
      */}
      <section className="relative z-10 max-w-[1160px] mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-8 text-center">
        {/* Titular de dos líneas con jerarquía por luminancia */}
        <h1 className="text-[36px] sm:text-[54px] md:text-[66px] font-semibold tracking-[-0.035em] leading-[1.06] max-w-4xl mx-auto">
          <span className="block text-[#8a94b8]">
            Tu parquímetro metropolitano.
          </span>
          <span className="block text-white">
            Ahora al segundo exacto.
          </span>
        </h1>

        {/* Sublínea corta atenuada */}
        <p className="mt-5 text-[15px] sm:text-[17px] text-[#8a94b8] max-w-xl mx-auto leading-relaxed font-normal">
          Diseñado para eliminar las monedas, las filas y las multas. Controla tu estancia, saldo y blindaje QR desde una sola consola inteligente.
        </p>

        {/* Único botón CTA blanco de alto contraste */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleTriggerExit}
            className="px-7 py-3.5 rounded-[10px] bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] inline-flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer border-0 shadow-[0_10px_40px_rgba(255,255,255,0.25)] group"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span>Entrar a Parqu 2.0</span>
            <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Nota técnica en monospace debajo del botón */}
          <span className="mt-3.5 font-mono text-[11px] tracking-widest uppercase text-[#8a94b8]/75">
            PARQU OS v2.6  •  TARIFA $0.25 MXN/MIN  •  WEB / IOS / ANDROID
          </span>
        </div>

        {/* Render 3D Oscuro en perspectiva que se desvanece en el borde inferior */}
        <div
          className="relative mt-10 sm:mt-14 mx-auto max-w-[980px]"
          style={{ perspective: '1300px' }}
        >
          {/* Resplandor detrás del render */}
          <div
            className="absolute -inset-x-6 -top-8 h-64 pointer-events-none opacity-75 blur-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0, 51, 255, 0.42) 0%, rgba(128, 125, 254, 0.15) 45%, transparent 75%)',
            }}
          />

          <div
            style={{
              transform: 'rotateX(12deg) scale(0.98)',
              transformOrigin: 'center top',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)',
            }}
            className="relative rounded-2xl bg-[#0b0e1c] p-2 sm:p-3 shadow-[0_30px_90px_rgba(0,0,0,0.9)] border-0"
          >
            {/* Barra superior estilo launcher de comando */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111528] rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="ml-2 font-mono text-xs text-[#8a94b8]">
                  parqu://control-metropolitano — {vehicle?.plates || 'ABC-123-A'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#807DFE]">
                ESC / ENTER PARA INICIAR
              </span>
            </div>

            {/* Contenido interactivo del Render 3D */}
            <LiveTelemetryTicker
              plates={vehicle?.plates}
              balance={card?.balance}
              onEnter={handleTriggerExit}
            />
          </div>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        3. EXPECTATIONS ROW: Tres columnas iguales etiquetadas 01 / 02 / 03
        en monospace atenuado, título corto en negrita, párrafo gris de 2
        líneas y píldora pequeña con icono de flecha externa
        ══════════════════════════════════════════════════════════════
      */}
      <section
        id="parqu-expectations"
        className="relative z-10 max-w-[1160px] mx-auto px-5 sm:px-8 py-14 sm:py-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {EXPECTATIONS_ITEMS.map((item) => (
            <div key={item.index} className="flex flex-col items-start text-left">
              <span className="font-mono text-xs text-[#8a94b8]/70 tracking-widest mb-3">
                {item.index}
              </span>
              <h3 className="text-lg font-semibold text-white tracking-tight mb-2">
                {item.title}
              </h3>
              <p className="text-[14px] text-[#8a94b8] leading-relaxed mb-5">
                {item.description}
              </p>
              <button
                type="button"
                onClick={handleTriggerExit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121629] hover:bg-[#1a203b] text-xs font-medium text-white/90 transition-colors cursor-pointer border-0"
              >
                <span>{item.linkLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8a94b8]" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        4. FEATURE SPOTLIGHT: Sección dividida, bloque de texto a la
        izquierda y render UI inclinado a la derecha emergiendo de la sombra
        ══════════════════════════════════════════════════════════════
      */}
      <section
        id="parqu-spotlight"
        className="relative z-10 max-w-[1160px] mx-auto px-5 sm:px-8 py-16 sm:py-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Texto a la izquierda */}
          <div className="lg:col-span-5 text-left space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#807DFE]">
              TELEMETRÍA URBANA EN VIVO
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
              Sincronización instantánea con toda la ciudad.
            </h2>
            <p className="text-[15px] text-[#8a94b8] leading-relaxed">
              Visualiza disponibilidad por sector en el Selector Orbital 3D y activa tu parquímetro con un solo toque sin bajar de tu vehículo.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerExit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121629] hover:bg-[#1a203b] text-xs font-semibold text-white transition-colors cursor-pointer border-0"
              >
                <span>Probar Selector Orbital 3D</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#807DFE]" />
              </button>
            </div>
          </div>

          {/* Render UI inclinado a la derecha emergiendo de la sombra */}
          <div className="lg:col-span-7" style={{ perspective: '1100px' }}>
            <div
              onClick={handleTriggerExit}
              style={{
                transform: 'rotateY(-8deg) rotateX(6deg)',
                maskImage:
                  'linear-gradient(135deg, rgba(0,0,0,1) 60%, rgba(0,0,0,0.15) 100%)',
                WebkitMaskImage:
                  'linear-gradient(135deg, rgba(0,0,0,1) 60%, rgba(0,0,0,0.15) 100%)',
              }}
              className="rounded-2xl bg-[#101426] p-6 sm:p-8 shadow-2xl cursor-pointer transition-transform duration-500 hover:scale-[1.01] border-0"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-[#0033FF]" />
                  <span className="font-semibold text-sm text-white">
                    Radar de Polígonos Metropolitanos
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  98.4% PRECISIÓN GPS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="rounded-xl bg-[#0a0c18] p-4 text-left">
                  <div className="font-mono text-[11px] text-[#8a94b8]">SECTOR A-01</div>
                  <div className="text-lg font-bold text-white mt-1">Centro Histórico</div>
                  <div className="text-xs text-emerald-400 font-mono mt-2">● 42 cajones libres</div>
                </div>
                <div className="rounded-xl bg-[#0a0c18] p-4 text-left">
                  <div className="font-mono text-[11px] text-[#8a94b8]">SECTOR B-04</div>
                  <div className="text-lg font-bold text-white mt-1">Zona Financiera</div>
                  <div className="text-xs text-emerald-400 font-mono mt-2">● 19 cajones libres</div>
                </div>
                <div className="rounded-xl bg-[#0a0c18] p-4 text-left col-span-2 sm:col-span-1">
                  <div className="font-mono text-[11px] text-[#8a94b8]">SECTOR C-08</div>
                  <div className="text-lg font-bold text-white mt-1">Corredor Cultural</div>
                  <div className="text-xs text-[#807DFE] font-mono mt-2">● Tarifa $0.25/min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        5. PIVOT HEADING & 6. BENTO FEATURE GRID:
        Declaración centrada de dos líneas (primera gris, segunda blanca),
        seguida de 1 tarjeta ancha + 2 medianas, y 1 fila de 3 compactas.
        ══════════════════════════════════════════════════════════════
      */}
      <section
        id="parqu-bento"
        className="relative z-10 max-w-[1160px] mx-auto px-5 sm:px-8 py-14 sm:py-20"
      >
        {/* Pivot Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
            <span className="block text-[#8a94b8]">
              Menos filas y monedas.
            </span>
            <span className="block text-white">
              Más control en cada estacionamiento.
            </span>
          </h2>
        </div>

        {/* Bento Grid: Fila 1 (1 ancha + 2 medianas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tarjeta Ancha */}
          <div
            onClick={handleTriggerExit}
            className="lg:col-span-6 rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 sm:p-7 flex flex-col justify-between min-h-[260px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="rounded-xl bg-[#090b14] p-4 mb-6">
              <div className="flex items-center justify-between text-xs font-mono text-[#8a94b8] mb-2">
                <span>CRONÓMETRO INTELIGENTE</span>
                <span className="text-emerald-400">ACTIVO</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                  $0.25 <span className="text-xs font-normal text-[#8a94b8]">MXN/min</span>
                </span>
                <span className="font-mono text-xs text-[#807DFE]">Sin cobro mínimo</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Tarificación por Segundo en Tiempo Real
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Activa y detén tu estancia cuando quieras pagando solo el tiempo exacto.
              </p>
            </div>
          </div>

          {/* Mediana 1 */}
          <div
            onClick={handleTriggerExit}
            className="lg:col-span-3 rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 flex flex-col justify-between min-h-[260px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="rounded-xl bg-[#090b14] p-4 flex items-center justify-center h-28">
              <QrCode className="w-12 h-12 text-[#0033FF]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Pase Digital QR
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Verificación criptográfica instantánea para supervisores viales.
              </p>
            </div>
          </div>

          {/* Mediana 2 */}
          <div
            onClick={handleTriggerExit}
            className="lg:col-span-3 rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 flex flex-col justify-between min-h-[260px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="rounded-xl bg-[#090b14] p-4 flex items-center justify-center h-28">
              <Compass className="w-12 h-12 text-[#807DFE]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Selector Orbital 3D
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Explora sectores y disponibilidad urbana en un entorno interactivo.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid: Fila 2 (3 tarjetas compactas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div
            onClick={handleTriggerExit}
            className="rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 flex flex-col justify-between min-h-[210px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0033FF]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#807DFE]" />
            </div>
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white">
                Seguridad Bancaria AES-256
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Tus recargas y tarjetas están protegidas con bóveda tokenizada.
              </p>
            </div>
          </div>

          <div
            onClick={handleTriggerExit}
            className="rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 flex flex-col justify-between min-h-[210px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0033FF]/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white">
                Alertas Preventivas
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Notificaciones automáticas antes de que tu saldo o tiempo concluya.
              </p>
            </div>
          </div>

          <div
            onClick={handleTriggerExit}
            className="rounded-2xl bg-[#111424] hover:bg-[#15192d] p-6 flex flex-col justify-between min-h-[210px] cursor-pointer transition-colors text-left border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0033FF]/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white">
                Multi-Vehículo Simultáneo
              </h3>
              <p className="text-sm text-[#8a94b8] mt-1">
                Cambia de placas en un clic para proteger autos o motocicletas.
              </p>
            </div>
          </div>
        </div>

        {/* 7. TEXT LINK: Único enlace centrado con flecha cerrando la sección Bento */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleTriggerExit}
            className="inline-flex items-center gap-2 text-sm text-white hover:text-[#807DFE] underline underline-offset-4 transition-colors cursor-pointer"
          >
            <span>Explorar todas las herramientas del panel metropolitano</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        8. RESOURCE LIST: Dos filas horizontales apiladas con icono a la
        izquierda, título + descripción de una línea al centro y flecha ↗
        ══════════════════════════════════════════════════════════════
      */}
      <section
        id="parqu-resources"
        className="relative z-10 max-w-[920px] mx-auto px-5 sm:px-8 py-10"
      >
        <div className="space-y-3">
          <div
            onClick={handleTriggerExit}
            className="rounded-2xl bg-[#111424] hover:bg-[#161a2e] p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors border-0"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-[#0033FF]/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#807DFE]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white">
                  Garantía Oficial Cero Infracciones
                </h4>
                <p className="text-xs sm:text-sm text-[#8a94b8]">
                  Respaldo directo en línea con el sistema de supervisión vial municipal.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#8a94b8] shrink-0" />
          </div>

          <div
            onClick={handleTriggerExit}
            className="rounded-2xl bg-[#111424] hover:bg-[#161a2e] p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors border-0"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-[#0033FF]/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white">
                  Historial y Comprobantes Digitales al Instante
                </h4>
                <p className="text-xs sm:text-sm text-[#8a94b8]">
                  Consulta cada segundo pagado y descarga tus tickets verificados desde tu perfil.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#8a94b8] shrink-0" />
          </div>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        9. FAQ: Encabezado centrado y cuatro filas de acordeón con iconos
        chevron y amplio espaciado vertical
        ══════════════════════════════════════════════════════════════
      */}
      <section
        id="parqu-faq"
        className="relative z-10 max-w-[820px] mx-auto px-5 sm:px-8 py-16 sm:py-24"
      >
        <h2 className="text-2xl sm:text-4xl font-semibold text-white text-center tracking-tight mb-10">
          Preguntas frecuentes
        </h2>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#111424] overflow-hidden transition-colors border-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-sm sm:text-[15px] font-medium text-white pr-4">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8a94b8] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#8a94b8] leading-relaxed text-left">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        10. CLOSING CTA: Refleja exactamente el Hero — titular con primera
        línea atenuada, botón píldora blanco y nota técnica en monospace
        ══════════════════════════════════════════════════════════════
      */}
      <section className="relative z-10 max-w-[960px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
          <span className="block text-[#8a94b8]">
            Estaciona con tranquilidad.
          </span>
          <span className="block text-white">
            Activa tu pase digital hoy.
          </span>
        </h2>

        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={handleTriggerExit}
            className="px-8 py-3.5 rounded-[10px] bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] inline-flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer border-0 shadow-[0_10px_40px_rgba(255,255,255,0.25)]"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Iniciar Parqu Ahora</span>
          </button>
          <span className="mt-3.5 font-mono text-[11px] uppercase tracking-widest text-[#8a94b8]/75">
            SIN COMISIONES OCULTAS  •  ACCESO INMEDIATO  •  SSS.SOLUTIONS
          </span>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════
        11. FOOTER: Superficie ligeramente más clara con 6 columnas de
        enlaces y barra inferior legal
        ══════════════════════════════════════════════════════════════
      */}
      <footer className="relative z-10 bg-[#0d101f] pt-14 pb-10 px-5 sm:px-8 mt-8">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 text-left pb-12">
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Producto
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Autocobro Digital</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Cronómetro en Vivo</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Tarifa por Segundo</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Funciones
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Pase QR Dinámico</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Selector Orbital 3D</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Billetera Parqu</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Sectores
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Centro Histórico</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Zona Financiera</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Corredor Cultural</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Seguridad
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Cifrado AES-256</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Blindaje Cero Multas</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Verificación Vial</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Plataforma
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Web App</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">iOS & iPadOS</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Android OS</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Compañía
              </div>
              <ul className="space-y-2 text-xs text-[#8a94b8]">
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">SSS.Solutions</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Soporte 24/7</li>
                <li onClick={handleTriggerExit} className="hover:text-white cursor-pointer">Entrar al Sistema</li>
              </ul>
            </div>
          </div>

          {/* Barra inferior con suscripción de novedades y microcopia legal */}
          <div className="pt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-xs text-[#8a94b8]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-white font-medium">
                Actualizaciones viales y nuevas zonas:
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTriggerExit();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  aria-label="Correo electrónico para novedades de Parqu"
                  className="px-3.5 py-2 rounded-lg bg-[#14192e] text-white placeholder-[#8a94b8]/60 text-xs focus:outline-none border-0"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors cursor-pointer border-0"
                >
                  Suscribirse
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="./parqu-logo-white.png"
                  alt="Parqu"
                  className="h-4 w-auto object-contain opacity-80"
                />
                <span>© 2026 Parqu • Tecnología Metropolitana SSS.Solutions</span>
              </div>
              <span className="font-mono text-[11px] text-[#8a94b8]/75">
                PRESIONA ENTER PARA ENTRAR
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoadingScreen;
