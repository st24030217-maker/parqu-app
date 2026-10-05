import React, { useState, useEffect, memo } from 'react';
import { Menu, X, Wifi, Sparkles } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Header = memo(({
  onNavigateToPanel,
  onNavigateToOrbital,
  onSelectTab,
  onOpenRecharge,
  onOpenNFC,
  activeTab,
}) => {
  const { activeSession, vehicle, card } = useParking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const navItems = [
    {
      id: 'metrics',
      label: 'Métricas',
      onClick: () => {
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
      onClick: () => {
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
      onClick: () => {
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
      onClick: () => {
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
      onClick: () => {
        setMobileMenuOpen(false);
        if (onSelectTab) {
          onSelectTab('vehicle');
        }
      },
    },
    {
      id: 'nfc',
      label: 'Pase NFC',
      onClick: () => {
        setMobileMenuOpen(false);
        if (onOpenNFC) {
          onOpenNFC();
        }
      },
    },
  ];

  const handlePrimaryAction = () => {
    setMobileMenuOpen(false);
    if (onOpenRecharge) {
      onOpenRecharge();
    } else if (onSelectTab) {
      onSelectTab('dashboard');
    }
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-[760px] mx-auto pointer-events-auto">
        {/* Píldora flotante principal estilo NotchPop (#090a0d, radio 22px, borde 1px translúcido) */}
        <nav
          aria-label="Navegación principal del sistema Parqu"
          className={`w-full rounded-[22px] bg-[#090a0d]/95 backdrop-blur-xl border border-white/[0.11] px-3.5 sm:px-5 h-12 sm:h-[52px] flex items-center justify-between gap-2 transition-shadow duration-300 ${
            isScrolled
              ? 'shadow-[0_14px_38px_rgba(0,0,0,0.45)]'
              : 'shadow-[0_10px_28px_rgba(0,0,0,0.28)]'
          }`}
        >
          {/* Izquierda: Logotipo y Nombre Parqu */}
          <button
            type="button"
            aria-label="Parqu - Volver arriba"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 text-left focus-visible:outline-none"
          >
            <img
              src="./parqu-logo-white.png"
              alt="Parqu"
              className="h-5 sm:h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-sans font-bold text-[13px] sm:text-sm text-white tracking-tight">
              Parqu
            </span>
            {activeSession && (
              <span
                title={`Estacionado: ${vehicle?.plates || ''}`}
                className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
              />
            )}
          </button>

          {/* Centro: Enlaces compactos en gris frío (#8d929d), 12px sans, gap de 8px */}
          <div className="hidden md:flex items-center gap-2 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`px-2.5 py-1 rounded-lg font-sans text-[12px] font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  item.active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-[#8d929d] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Derecha: Botón blanco pequeño redondeado + botón de menú colapsable en móvil */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="px-3 sm:px-3.5 py-1.5 rounded-[12px] bg-white hover:bg-neutral-200 active:scale-95 text-[#090a0d] font-sans font-bold text-[11px] sm:text-[12px] tracking-tight transition-all cursor-pointer shadow-sm whitespace-nowrap"
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
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-8 h-8 rounded-[11px] bg-white/[0.07] hover:bg-white/[0.14] text-[#8d929d] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Menú desplegable compacto en pantallas pequeñas (< md) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-[20px] bg-[#090a0d]/95 backdrop-blur-xl border border-white/[0.11] p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] grid grid-cols-2 gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`px-3 py-2 rounded-xl text-left font-sans text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  item.active
                    ? 'bg-white/[0.1] text-white font-semibold'
                    : 'text-[#8d929d] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'nfc' && <Wifi className="w-3 h-3 rotate-90 text-[#807DFE]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
});

