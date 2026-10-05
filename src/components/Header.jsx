import React, { useState, useEffect, useRef, memo } from 'react';
import { Menu, X, Wifi, BellRing } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { useParking } from '../context/ParkingContext';

export const Header = memo(({
  onNavigateToPanel,
  onNavigateToOrbital,
  onSelectTab,
  onOpenRecharge,
  onOpenNFC,
  onOpenNotification,
  activeTab,
}) => {
  const { activeSession, vehicle, card } = useParking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navPillRef = useRef(null);
  const navLinksContainerRef = useRef(null);
  const bellIconRef = useRef(null);
  const bellPulseRingRef = useRef(null);
  const primaryBtnRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 24);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Entrada elástica estilo Dynamic Island para la Píldora de Navegación + cascada stagger en enlaces
  useEffect(() => {
    if (navPillRef.current) {
      animate(navPillRef.current, {
        opacity: [0, 1],
        translateY: [-22, 0],
        scaleX: [0.82, 1],
        scaleY: [0.88, 1],
        duration: 850,
        ease: 'outElastic(1, .68)',
      });
    }

    if (navLinksContainerRef.current) {
      const items = navLinksContainerRef.current.querySelectorAll('.anime-nav-link');
      if (items.length > 0) {
        animate(items, {
          opacity: [0, 1],
          translateY: [-10, 0],
          scale: [0.92, 1],
          delay: stagger(45, { start: 180 }),
          duration: 550,
          ease: 'outExpo',
        });
      }
    }
  }, []);

  // 2. Animación continua de ondas de telemetría en la campana y sacudida cuando cambia sesión activa
  useEffect(() => {
    let ringAnim;
    if (bellPulseRingRef.current) {
      ringAnim = animate(bellPulseRingRef.current, {
        scale: [1, 1.95],
        opacity: [0.65, 0],
        duration: activeSession ? 1200 : 2200,
        loop: true,
        ease: 'outSine',
      });
    }

    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -18, 18, -12, 12, -6, 6, 0],
        scale: [1, 1.18, 1],
        duration: 750,
        ease: 'outElastic(1, .5)',
      });
    }

    return () => {
      if (ringAnim && typeof ringAnim.pause === 'function') {
        ringAnim.pause();
      }
    };
  }, [activeSession]);

  // 3. Pulso elástico en el botón de acción principal cuando cambia el saldo o el estado de sesión
  useEffect(() => {
    if (!primaryBtnRef.current) return;
    animate(primaryBtnRef.current, {
      scale: [0.93, 1.04, 1],
      duration: 520,
      ease: 'outElastic(1, .6)',
    });
  }, [card?.balance, activeSession]);

  // 4. Cascada Anime.js al abrir el menú móvil
  useEffect(() => {
    if (mobileMenuOpen && mobileDropdownRef.current) {
      animate(mobileDropdownRef.current, {
        opacity: [0, 1],
        translateY: [-12, 0],
        scaleY: [0.9, 1],
        duration: 420,
        ease: 'outExpo',
      });

      const mobileItems = mobileDropdownRef.current.querySelectorAll('.anime-mobile-link');
      if (mobileItems.length > 0) {
        animate(mobileItems, {
          opacity: [0, 1],
          translateX: [-10, 0],
          delay: stagger(35, { start: 60 }),
          duration: 380,
          ease: 'outExpo',
        });
      }
    }
  }, [mobileMenuOpen]);

  const triggerButtonMicroBounce = (targetEl) => {
    if (!targetEl) return;
    animate(targetEl, {
      scale: [0.9, 1.06, 1],
      duration: 480,
      ease: 'outElastic(1, .55)',
    });
  };

  const navItems = [
    {
      id: 'metrics',
      label: 'Métricas',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onNavigateToPanel) {
          onNavigateToPanel();
        } else {
          const el = document.getElementById('panel-control-metropolitano');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
    {
      id: 'orbital',
      label: 'Ruleta 3D',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onNavigateToOrbital) {
          onNavigateToOrbital();
        } else {
          const el = document.getElementById('selector-orbital-metropolitano');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
    {
      id: 'dashboard',
      label: 'Parquímetro',
      active: activeTab === 'dashboard',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onSelectTab) {
          onSelectTab('dashboard');
        }
      },
    },
    {
      id: 'autopay',
      label: 'Autocobro',
      active: activeTab === 'autopay',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onSelectTab) {
          onSelectTab('autopay');
        }
      },
    },
    {
      id: 'vehicle',
      label: 'Vehículo',
      active: activeTab === 'vehicle',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onSelectTab) {
          onSelectTab('vehicle');
        }
      },
    },
    {
      id: 'nfc',
      label: 'Pase NFC',
      onClick: (e) => {
        triggerButtonMicroBounce(e.currentTarget);
        setMobileMenuOpen(false);
        if (onOpenNFC) {
          onOpenNFC();
        }
      },
    },
  ];

  const handlePrimaryAction = (e) => {
    triggerButtonMicroBounce(e.currentTarget);
    setMobileMenuOpen(false);
    if (onOpenRecharge) {
      onOpenRecharge();
    } else if (onSelectTab) {
      onSelectTab('dashboard');
    }
  };

  const handleBellClick = (e) => {
    triggerButtonMicroBounce(e.currentTarget);
    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -22, 22, -14, 14, 0],
        duration: 620,
        ease: 'outElastic(1, .5)',
      });
    }
    setMobileMenuOpen(false);
    if (onOpenNotification) onOpenNotification();
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-[760px] mx-auto pointer-events-auto">
        {/* Píldora flotante animada con Anime.js */}
        <nav
          ref={navPillRef}
          aria-label="Navegación principal del sistema Parqu"
          className={`w-full rounded-[22px] backdrop-blur-xl border px-3.5 sm:px-5 h-12 sm:h-[52px] flex items-center justify-between gap-2 transition-colors duration-300 ${
            isScrolled
              ? 'bg-white/95 border-slate-200/90 shadow-[0_12px_34px_rgba(15,23,42,0.10)]'
              : 'bg-white/15 border-white/25 shadow-[0_10px_28px_rgba(0,20,80,0.15)]'
          }`}
        >
          {/* Izquierda: Logotipo Oficial PARQU con transición fluida blanco/negro */}
          <button
            type="button"
            aria-label="Parqu - Volver arriba"
            onClick={(e) => {
              triggerButtonMicroBounce(e.currentTarget);
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 text-left focus-visible:outline-none"
          >
            <div className="relative h-5 sm:h-6 w-auto flex items-center">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className={`h-5 sm:h-6 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,214,230,0.35)] transition-all duration-300 ${
                  isScrolled ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                }`}
              />
              <img
                src="./parqu-logo-black.png"
                alt="Parqu"
                className={`absolute inset-0 h-5 sm:h-6 w-auto object-contain transition-all duration-300 ${
                  isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              />
            </div>

            <span
              className={`font-sans font-black text-[13px] sm:text-sm tracking-tight transition-colors duration-300 ${
                isScrolled ? 'text-black group-hover:text-slate-700' : 'text-white'
              }`}
            >
              Parqu
            </span>

            {activeSession && (
              <span
                title={`Estacionado: ${vehicle?.plates || ''}`}
                className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
              />
            )}
          </button>

          {/* Centro: Enlaces compactos animados en cascada con Anime.js */}
          <div ref={navLinksContainerRef} className="hidden md:flex items-center gap-2 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`anime-nav-link px-2.5 py-1 rounded-lg font-sans text-[12px] font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  isScrolled
                    ? item.active
                      ? 'text-black bg-slate-100 font-semibold'
                      : 'text-slate-500 hover:text-black hover:bg-slate-100/80'
                    : item.active
                      ? 'text-white bg-white/20 font-semibold'
                      : 'text-[#D4D6E6] hover:text-white hover:bg-white/15'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Derecha: Campana con anillo Anime.js + acción principal + menú móvil */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              aria-label="Abrir consola de telemetría en vivo"
              title="Abrir consola de telemetría en vivo"
              onClick={handleBellClick}
              className={`relative w-8 h-8 rounded-[11px] flex items-center justify-center transition cursor-pointer overflow-visible ${
                isScrolled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <span
                ref={bellPulseRingRef}
                className={`absolute inset-0 rounded-[11px] pointer-events-none border ${
                  activeSession
                    ? 'border-amber-400 bg-amber-400/15'
                    : isScrolled
                      ? 'border-[#0033FF]/40 bg-[#0033FF]/5'
                      : 'border-white/40 bg-white/10'
                }`}
              />
              <span ref={bellIconRef} className="relative z-10 flex items-center justify-center">
                <BellRing className="w-3.5 h-3.5" />
              </span>
              <span
                className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full z-20 ${
                  activeSession ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </button>

            <button
              ref={primaryBtnRef}
              type="button"
              onClick={handlePrimaryAction}
              className={`px-3 sm:px-3.5 py-1.5 rounded-[12px] font-sans font-bold text-[11px] sm:text-[12px] tracking-tight transition-colors duration-300 cursor-pointer shadow-sm whitespace-nowrap ${
                isScrolled
                  ? 'bg-black hover:bg-neutral-800 text-white'
                  : 'bg-[#0033FF] hover:bg-[#2250ff] text-white'
              }`}
            >
              {activeSession
                ? `En Vivo • ${vehicle?.plates || ''}`
                : `Recargar • $${Number(card?.balance ?? 0).toFixed(0)}`}
            </button>

            {/* Botón para colapsar enlaces secundarios en pantallas pequeñas */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
              onClick={(e) => {
                triggerButtonMicroBounce(e.currentTarget);
                setMobileMenuOpen((prev) => !prev);
              }}
              className={`md:hidden w-8 h-8 rounded-[11px] flex items-center justify-center transition cursor-pointer ${
                isScrolled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Menú desplegable compacto en pantallas pequeñas (< md) animado con Anime.js */}
        {mobileMenuOpen && (
          <div
            ref={mobileDropdownRef}
            className={`md:hidden mt-2 rounded-[20px] backdrop-blur-xl border p-2.5 grid grid-cols-2 gap-1.5 origin-top ${
              isScrolled
                ? 'bg-white/95 border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.12)]'
                : 'bg-white/20 border-white/30 shadow-[0_16px_40px_rgba(0,20,80,0.22)]'
            }`}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`anime-mobile-link px-3 py-2 rounded-xl text-left font-sans text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  isScrolled
                    ? item.active
                      ? 'bg-slate-100 text-black font-semibold'
                      : 'text-slate-600 hover:text-black hover:bg-slate-50'
                    : item.active
                      ? 'bg-white/25 text-white font-semibold'
                      : 'text-white/90 hover:text-white hover:bg-white/15'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'nfc' && (
                  <Wifi
                    className={`w-3 h-3 rotate-90 ${
                      isScrolled ? 'text-[#0033FF]' : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
});
