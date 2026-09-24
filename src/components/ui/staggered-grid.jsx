import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  ArrowDown
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function StaggeredGrid({
  bentoItems = [],
  featureItems = [],
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeBento, setActiveBento] = useState(0);
  const gridFullRef = useRef(null);
  const textRef = useRef(null);

  // Divide texto en caracteres individuales para la animación GSAP
  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span
        key={i}
        className="char inline-block"
        style={{ willChange: 'transform, opacity' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // 1. Animación del Texto Principal "BIENVENIDOS A PARQU"
      if (textRef.current) {
        const chars = textRef.current.querySelectorAll('.char');
        gsap.timeline({
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 85%',
            end: 'center 40%',
            scrub: 1.2,
          }
        }).from(chars, {
          ease: 'power3.out',
          yPercent: 200,
          autoAlpha: 0,
          stagger: {
            each: 0.04,
            from: 'center'
          }
        });
      }

      // 2. Animación en Cascada (Stagger) de la Cuadrícula
      if (gridFullRef.current) {
        const gridItems = gridFullRef.current.querySelectorAll('.stagger-grid-item');
        const numCols = window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 4 : 6;
        const middleCol = Math.floor(numCols / 2);

        // Agrupar elementos por columnas para el efecto de onda
        const columns = Array.from({ length: numCols }, () => []);
        gridItems.forEach((item, index) => {
          const colIndex = index % numCols;
          columns[colIndex].push(item);
        });

        columns.forEach((colElements, colIdx) => {
          const distanceFactor = Math.abs(colIdx - middleCol) * 0.15;

          gsap.timeline({
            scrollTrigger: {
              trigger: gridFullRef.current,
              start: 'top 80%',
              end: 'bottom 70%',
              scrub: 1.2,
            }
          }).from(colElements, {
            y: 120,
            autoAlpha: 0,
            scale: 0.9,
            delay: distanceFactor,
            ease: 'sine.out',
            stagger: 0.1,
          });
        });
      }
    });

    return () => ctx.revert();
  }, [isLoaded]);

  // Lista de características de Parqu para las tarjetas de la cuadrícula
  const defaultFeatures = [
    {
      id: 'card',
      title: 'Tarjeta Digital',
      desc: 'Pase inteligente de parquímetro con saldo en tiempo real.',
      icon: CreditCard,
      category: 'ACCESO',
      tab: 'dashboard'
    },
    {
      id: 'autopay',
      title: 'Autocobro Continuo',
      desc: 'Cobro segundo a segundo exacto sin necesidad de monedas.',
      icon: Zap,
      category: 'TECNOLOGÍA',
      tab: 'autopay'
    },
    {
      id: 'plates',
      title: 'Gestión Vehicular',
      desc: 'Vinculación de placas, marca y titular en el sistema.',
      icon: Car,
      category: 'VEHÍCULO',
      tab: 'vehicle'
    },
    {
      id: 'simulator',
      title: 'Cajones Inteligentes',
      desc: 'Detección y simulador de parquímetro metropolitano.',
      icon: MapPin,
      category: 'MOVILIDAD',
      tab: 'dashboard'
    },
    {
      id: 'history',
      title: 'Historial & Recibos',
      desc: 'Registro con folios fiscales y comprobantes descargables.',
      icon: History,
      category: 'FINANZAS',
      tab: 'history'
    },
    {
      id: 'security',
      title: 'Seguridad 256-Bit',
      desc: 'Encriptación bancaria y certificación SSS.Solutions.',
      icon: Lock,
      category: 'PROTECCIÓN',
      tab: 'autopay'
    },
    {
      id: 'qr',
      title: 'Validación QR',
      desc: 'Escaneo rápido para oficiales de tránsito municipales.',
      icon: QrCode,
      category: 'INSPECCIÓN',
      tab: 'dashboard'
    },
    {
      id: 'nofines',
      title: 'Cero Multas',
      desc: 'Garantía activa contra multas por expiración de tiempo.',
      icon: ShieldCheck,
      category: 'GARANTÍA',
      tab: 'autopay'
    },
    {
      id: 'realtime',
      title: 'Métricas en Vivo',
      desc: 'Consumo por minuto y alertas inteligentes al instante.',
      icon: Gauge,
      category: 'TELEMETRÍA',
      tab: 'dashboard'
    },
    {
      id: 'mobile',
      title: 'Mobile First',
      desc: 'Experiencia táctil fluida y compatible con cualquier móvil.',
      icon: Smartphone,
      category: 'INTERFAZ',
      tab: 'dashboard'
    },
    {
      id: 'receipt',
      title: 'Cobro Transparente',
      desc: 'Sin comisiones ocultas. Paga únicamente lo que usas.',
      icon: Receipt,
      category: 'TARIFA',
      tab: 'history'
    },
    {
      id: 'innovation',
      title: 'Powered by SSS',
      desc: 'Infraestructura de nueva generación para smart cities.',
      icon: Sparkles,
      category: 'INNOVACIÓN',
      tab: 'dashboard'
    }
  ];

  const itemsToRender = featureItems.length > 0 ? featureItems : defaultFeatures;

  // Bento Items destacados para la sección interactiva expandible
  const defaultBento = [
    {
      id: 'bento-1',
      title: 'Autocobro sin Monedas',
      subtitle: 'CERO FILAS • CERO MULTAS',
      desc: 'El sistema debita automáticamente el tiempo de estancia con precisión de segundo, eliminando parquímetros físicos y multas.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      tag: '01. AUTONOMÍA',
      actionTab: 'autopay'
    },
    {
      id: 'bento-2',
      title: 'Tarjeta Digital Oficial',
      subtitle: 'PASE METROPOLITANO',
      desc: 'Tu credencial digital interactiva con QR de inspección, saldo en vivo y recargas rápidas con garantía de saldo protegido.',
      icon: <CreditCard className="w-5 h-5 text-white" />,
      tag: '02. IDENTIDAD',
      actionTab: 'dashboard'
    },
    {
      id: 'bento-3',
      title: 'Cajones en Tiempo Real',
      subtitle: 'SIMULADOR INTELIGENTE',
      desc: 'Selecciona tu cajón en zonas metropolitanas, monitorea el tiempo en parquímetro y recibe notificaciones dinámicas.',
      icon: <MapPin className="w-5 h-5 text-emerald-400" />,
      tag: '03. MONITOREO',
      actionTab: 'dashboard'
    }
  ];

  const bentoList = bentoItems.length > 0 ? bentoItems : defaultBento;

  return (
    <div className={`relative w-full overflow-hidden text-white ${className}`}>
      
      {/* 1. Header con Animación Stagger "BIENVENIDOS A PARQU" */}
      <section className="pt-16 pb-12 px-4 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="tracking-[0.2em] uppercase">Ecosistema Inteligente de Estacionamiento</span>
        </div>

        <div
          ref={textRef}
          className="text font-black uppercase tracking-tight flex flex-wrap justify-center text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.95] text-white max-w-6xl"
        >
          {splitText(centerText)}
        </div>

        <p className="text-sm sm:text-base text-neutral-400 font-mono mt-6 max-w-2xl leading-relaxed">
          Descubre todas las funciones que ofrece <span className="text-white font-bold">Parqu</span>. Desplázate hacia abajo para explorar las herramientas o haz clic en cualquier función para interactuar.
        </p>

        <div className="flex items-center gap-2 mt-6 text-xs font-mono text-neutral-500 animate-bounce">
          <span>Desliza para descubrir funciones</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </div>
      </section>

      {/* 2. Sección Bento Expandible Interactiva (3 Tarjetas destacadas) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span>Pilares Principales del Sistema</span>
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
                    ? 'md:w-3/5 bg-neutral-900/90 border-neutral-600 shadow-[0_0_35px_rgba(255,255,255,0.1)]'
                    : 'md:w-1/5 bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Glow ambiental en card activa */}
                {isActive && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />
                )}

                {/* Encabezado de la Tarjeta Bento */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                    {bento.tag}
                  </span>
                  <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    {bento.icon}
                  </div>
                </div>

                {/* Contenido Dinámico */}
                <div className="relative z-10 space-y-2 mt-4">
                  <span className="text-[10px] font-mono text-neutral-400 tracking-wider block">
                    {bento.subtitle}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {bento.title}
                  </h3>
                  
                  {isActive && (
                    <p className="text-xs sm:text-sm text-neutral-400 font-mono leading-relaxed pt-1 animate-in fade-in duration-300">
                      {bento.desc}
                    </p>
                  )}
                </div>

                {/* Botón de acción rápido al hacer hover */}
                {isActive && (
                  <div className="pt-4 relative z-10 flex items-center gap-2 text-xs font-mono text-white font-bold">
                    <span>Probar en el sistema</span>
                    <span className="text-neutral-400">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Cuadrícula Staggered Grid de Todas las Funciones */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-white" />
            <span>Catálogo Completo de Funciones Parqu</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Haz clic en cualquier tarjeta para saltar a su módulo
          </span>
        </div>

        <div
          ref={gridFullRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
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
                className="stagger-grid-item group relative overflow-hidden rounded-2xl p-5 bg-neutral-950/80 border border-neutral-800/90 hover:border-neutral-600 hover:bg-neutral-900/90 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-sm hover:shadow-[0_0_25px_rgba(255,255,255,0.06)]"
              >
                {/* Resplandor hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Fila Superior: Icono y Categoría */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:border-neutral-700 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    {item.category}
                  </span>
                </div>

                {/* Fila Central: Título y Descripción */}
                <div className="relative z-10 space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-neutral-100 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Fila Inferior: Indicador Interactivo */}
                <div className="relative z-10 pt-2 border-t border-neutral-900 group-hover:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500 group-hover:text-white transition-colors">
                  <span>Abrir función</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
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
