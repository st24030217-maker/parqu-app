import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InteractiveParticles } from './interactive-particles';
import { 
  CreditCard, 
  Zap, 
  Car, 
  History, 
  ShieldCheck, 
  QrCode, 
  Smartphone, 
  Sparkles, 
  MapPin, 
  Gauge, 
  Lock, 
  Receipt,
  ArrowDown,
  Layers,
  ChevronRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function StaggeredGrid({
  bentoItems = [],
  featureItems = [],
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const [activeBento, setActiveBento] = useState(0);
  const containerRef = useRef(null);
  const titleSectionRef = useRef(null);
  const titleTextRef = useRef(null);
  const bentoSectionRef = useRef(null);
  const gridSectionRef = useRef(null);

  // Divide texto en caracteres individuales para la cinemática de entrada GSAP
  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span
        key={i}
        className="char inline-block will-change-transform"
        style={{ transformOrigin: '50% 100%' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  // Lista de características de Parqu
  const defaultFeatures = [
    {
      id: 'card',
      title: 'Tarjeta Digital Inteligente',
      subtitle: 'PASE VIRTUAL ACTIVO',
      desc: 'Pase inteligente de parquímetro con saldo en tiempo real y código QR para inspectores de tránsito.',
      icon: CreditCard,
      category: 'IDENTIDAD',
      badge: 'EN VIVO',
      tab: 'dashboard'
    },
    {
      id: 'autopay',
      title: 'Autocobro por Segundo',
      subtitle: 'DEBITO AUTOMATIZADO',
      desc: 'Cobro segundo a segundo exacto. Cero filas, cero monedas y sin multas por tiempo expirado.',
      icon: Zap,
      category: 'COBRO',
      badge: 'AUTOMÁTICO',
      tab: 'autopay'
    },
    {
      id: 'parking',
      title: 'Cajones en Tiempo Real',
      subtitle: 'PARQUÍMETRO METROPOLITANO',
      desc: 'Gestiona tu estancia en parquímetros municipales, activa cronómetros y calcula tu tarifa al instante.',
      icon: MapPin,
      category: 'MOVILIDAD',
      badge: 'EN VIVO',
      tab: 'dashboard'
    },
    {
      id: 'plates',
      title: 'Gestión Vehicular y Placas',
      subtitle: 'VINCULACIÓN OFICIAL',
      desc: 'Asocia las placas de tu vehículo y datos del titular con sincronización directa al padrón vial.',
      icon: Car,
      category: 'VEHÍCULO',
      badge: 'REGISTRO',
      tab: 'vehicle'
    },
    {
      id: 'history',
      title: 'Historial y Recibos Fiscales',
      subtitle: 'COMPROBANTES CFDI',
      desc: 'Consulta tu bitácora detallada de transacciones, folios fiscales y descarga recibos al instante.',
      icon: History,
      category: 'FINANZAS',
      badge: 'AUDITABLE',
      tab: 'history'
    },
    {
      id: 'security',
      title: 'Encriptación Bancaria 256-Bit',
      subtitle: 'PROTECCIÓN TOTAL',
      desc: 'Cifrado de grado bancario y validación segura desarrollada con tecnología SSS.Solutions.',
      icon: Lock,
      category: 'SEGURIDAD',
      badge: 'PROTEGIDO',
      tab: 'autopay'
    },
    {
      id: 'qr',
      title: 'Inspección QR Instantánea',
      subtitle: 'CONTROL DE TRÁNSITO',
      desc: 'Los agentes municipales validan tu estancia en un segundo escaneando tu credencial digital.',
      icon: QrCode,
      category: 'INSPECCIÓN',
      badge: 'OFICIAL',
      tab: 'dashboard'
    },
    {
      id: 'nofines',
      title: 'Garantía Cero Multas',
      subtitle: 'COBERTURA ACTIVA',
      desc: 'Protección activa contra multas por descuido de tiempo mientras tu vehículo permanezca en el cajón.',
      icon: ShieldCheck,
      category: 'GARANTÍA',
      badge: 'GARANTIZADO',
      tab: 'autopay'
    },
    {
      id: 'realtime',
      title: 'Telemetría de Consumo',
      subtitle: 'MÉTRICAS POR MINUTO',
      desc: 'Monitoreo en vivo de saldo debitado, tiempo acumulado y proyecciones de costo de aparcamiento.',
      icon: Gauge,
      category: 'TELEMETRÍA',
      badge: 'MÉTRICAS',
      tab: 'dashboard'
    },
    {
      id: 'mobile',
      title: 'Experiencia Mobile First',
      subtitle: 'DISEÑO ADAPTATIVO',
      desc: 'Interfaz táctil reactiva optimizada para operar fluidamente desde cualquier smartphone o tableta.',
      icon: Smartphone,
      category: 'EXPERIENCIA',
      badge: 'PWA READY',
      tab: 'dashboard'
    },
    {
      id: 'receipt',
      title: 'Tarifa Justa por Minuto',
      subtitle: 'CERO COMISIONES OCULTAS',
      desc: 'Paga con exactitud matemática el tiempo que utilizas el cajón, sin redondeos abusivos.',
      icon: Receipt,
      category: 'TRANSPARENCIA',
      badge: 'EXACTITUD',
      tab: 'history'
    },
    {
      id: 'innovation',
      title: 'Infraestructura SSS.Solutions',
      subtitle: 'TECNOLOGÍA METROPOLITANA',
      desc: 'Arquitectura de vanguardia que moderniza la movilidad urbana en ciudades inteligentes.',
      icon: Sparkles,
      category: 'INNOVACIÓN',
      badge: 'SMART CITY',
      tab: 'dashboard'
    }
  ];

  const itemsToRender = featureItems.length > 0 ? featureItems : defaultFeatures;

  // Bento Items Principales
  const defaultBento = [
    {
      id: 'bento-1',
      title: 'Autocobro Continuo',
      subtitle: '01. CERO FILAS • CERO MONEDAS',
      desc: 'El sistema debita de forma ininterrumpida el tiempo de estancia exacto en el parquímetro, protegiéndote contra multas de tránsito.',
      icon: <Zap className="w-6 h-6 text-white" />,
      tag: 'CERO FILAS',
      actionTab: 'autopay'
    },
    {
      id: 'bento-2',
      title: 'Tarjeta Digital Oficial',
      subtitle: '02. PASE METROPOLITANO',
      desc: 'Tu credencial oficial con saldo protegido, sincronización instantánea y código QR para lectura de inspectores viales.',
      icon: <CreditCard className="w-6 h-6 text-white" />,
      tag: 'PASE DIGITAL',
      actionTab: 'dashboard'
    },
    {
      id: 'bento-3',
      title: 'Parquímetro en Tiempo Real',
      subtitle: '03. CONTROL DE CAJONES',
      desc: 'Selecciona cajones metropolitanos, observa el cronómetro dinámico y monitorea el gasto segundo a segundo en vivo.',
      icon: <MapPin className="w-6 h-6 text-white" />,
      tag: 'PARQUÍMETRO',
      actionTab: 'dashboard'
    }
  ];

  const bentoList = bentoItems.length > 0 ? bentoItems : defaultBento;

  // Configuración de GSAP ScrollTrigger para la entrada escalonada y acomodo
  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // 1. Animación del Título Principal "BIENVENIDOS A PARQU"
      if (titleTextRef.current) {
        const chars = titleTextRef.current.querySelectorAll('.char');
        
        gsap.fromTo(chars, 
          {
            yPercent: 180,
            autoAlpha: 0,
            scale: 0.6,
            rotateX: -45,
          },
          {
            yPercent: 0,
            autoAlpha: 1,
            scale: 1,
            rotateX: 0,
            stagger: {
              each: 0.035,
              from: 'center'
            },
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleSectionRef.current,
              start: 'top 85%',
              end: 'center 45%',
              scrub: 1.2,
            }
          }
        );
      }

      // 2. Animación de la sección Bento (Escalamiento y revelación suave)
      if (bentoSectionRef.current) {
        gsap.fromTo(bentoSectionRef.current,
          {
            y: 100,
            autoAlpha: 0,
            scale: 0.92,
          },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bentoSectionRef.current,
              start: 'top 90%',
              end: 'top 50%',
              scrub: 1.4,
            }
          }
        );
      }

      // 3. Animación de las Funciones UNA POR UNA y luego se acomodan en el Grid
      if (gridSectionRef.current) {
        const cards = gridSectionRef.current.querySelectorAll('.feature-card-item');

        cards.forEach((card, index) => {
          gsap.fromTo(card,
            {
              y: 180 + (index % 4) * 40,
              autoAlpha: 0,
              scale: 0.8,
              rotateX: 20,
              transformOrigin: '50% 0%',
            },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              rotateX: 0,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 95%',
                end: 'top 65%',
                scrub: 1.3,
              }
            }
          );
        });
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden text-white ${className}`}>
      
      {/* 1. Header con Animación de Partículas GPU en las palabras "BIENVENIDO A PARQU" */}
      <section 
        ref={titleSectionRef}
        className="pt-16 pb-12 px-4 flex flex-col items-center justify-center text-center relative z-10 [perspective:1000px] min-h-[460px] sm:min-h-[520px] bg-transparent"
      >
        {/* Capa de Partículas Interactivas Three.js que forman el texto "BIENVENIDO A PARQU" con fondo 100% transparente */}
        <div className="absolute inset-0 z-0 pointer-events-auto flex items-center justify-center overflow-hidden bg-transparent">
          <InteractiveParticles
            text="BIENVENIDO A PARQU"
            size={1.5}
            randomness={2.0}
            depth={4.0}
            touchRadius={0.3}
            color="#ffffff"
            background="transparent"
            className="w-full h-full bg-transparent"
          />
        </div>

      </section>

      {/* 2. Sección Bento Expandible (Pilares Principales) */}
      <section 
        ref={bentoSectionRef}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10"
      >
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="font-bold text-white">Pilares de la Plataforma</span>
          </div>
          <span className="text-[10px] text-neutral-500 hidden sm:inline-block">Pasa el cursor o haz clic para expandir</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-auto md:h-72 w-full">
          {bentoList.map((bento, index) => {
            const isActive = activeBento === index;
            return (
              <div
                key={bento.id}
                onClick={() => {
                  setActiveBento(index);
                  if (onSelectFeature && bento.actionTab) {
                    onSelectFeature(bento.actionTab);
                  }
                }}
                onMouseEnter={() => setActiveBento(index)}
                className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer border flex flex-col justify-between ${
                  isActive
                    ? 'md:w-3/5 bg-neutral-900/95 border-neutral-600 shadow-[0_0_40px_rgba(255,255,255,0.12)]'
                    : 'md:w-1/5 bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Glow ambiental en tarjeta expandida */}
                {isActive && (
                  <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
                )}

                {/* Encabezado */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                    {bento.tag}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
                    {bento.icon}
                  </div>
                </div>

                {/* Contenido */}
                <div className="relative z-10 space-y-1.5 mt-4">
                  <span className="text-[10px] font-mono text-neutral-400 tracking-wider block">
                    {bento.subtitle}
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {bento.title}
                  </h3>
                  
                  {isActive && (
                    <p className="text-xs sm:text-sm text-neutral-400 font-mono leading-relaxed pt-1 animate-in fade-in duration-300">
                      {bento.desc}
                    </p>
                  )}
                </div>

                {/* Indicador de acción */}
                {isActive && (
                  <div className="pt-4 relative z-10 flex items-center gap-2 text-xs font-mono text-white font-bold">
                    <span>Ir a este módulo</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Cuadrícula Staggered Grid: Las funciones van apareciendo una por una y se acomodan */}
      <section 
        ref={gridSectionRef}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10 [perspective:1200px]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <span className="font-bold text-white">Todas las Funciones de Parqu</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Haz clic en cualquier tarjeta para abrir su función
          </span>
        </div>

        {/* Grid de tarjetas que se revelan escalonadas una por una */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {itemsToRender.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  if (onSelectFeature && item.tab) {
                    onSelectFeature(item.tab);
                  }
                }}
                className="feature-card-item group relative overflow-hidden rounded-2xl p-5 bg-neutral-950/90 border border-neutral-800/90 hover:border-white/40 hover:bg-neutral-900 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-md will-change-transform shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"
              >
                {/* Resplandor superior en hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Fila Superior: Icono y Categoría / Badge */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200 group-hover:text-white group-hover:border-neutral-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      {item.category}
                    </span>
                    {item.badge && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 mt-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila Central: Título y Descripción */}
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                    {item.subtitle}
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Fila Inferior: Botón de Apertura */}
                <div className="relative z-10 pt-3 border-t border-neutral-900 group-hover:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400 group-hover:text-white transition-colors">
                  <span className="font-semibold">Interactuar</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

export default StaggeredGrid;
