"use client"

import React from "react"
import { Zap, QrCode, CreditCard, MapPin, ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import { BentoCard } from "./bento-card"

/**
 * PARQU BENTO BLOCKS
 * Bloques de formato Bento con fondos AnimatedGradient en SVG
 * Diseñados para darle máxima jerarquía, dinamismo visual y formato al sistema metropolitano.
 */
export const ParquBentoBlocks = ({
  onNavigateTab,
  onOpenRecharge,
  onOpenQR,
  balance,
  plates,
  className = "",
}) => {
  return (
    <section className={`w-full space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0033FF] animate-pulse" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#01033E] font-sans">
            Módulos Inteligentes en Tiempo Real
          </h2>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 font-semibold">
          PARQU • BENTO V3
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 w-full">
        {/* 1. Tarjeta Grande (col-span-8): Autocobro Inteligente */}
        <div className="sm:col-span-8 min-h-[160px] sm:min-h-[200px]">
          <BentoCard
            badge="PAGO CONTINUO"
            icon={Zap}
            title="Autocobro Inteligente y Extensión Continua"
            subtitle="Tarifa Oficial Regulada: $6.00 MXN/hr ($0.10/minuto)"
            description="El sistema renueva tu estancia automáticamente segundo a segundo sin monedas ni necesidad de volver al coche. Garantía Cero Multas con débito en tiempo real."
            buttonText="Configurar Reglas del Autocobro →"
            onButtonClick={() => onNavigateTab?.("autopay")}
            gradientColors={["#0033FF", "#0055FF", "#807DFE"]}
            baseBgColor="bg-[#01033E]"
            speed={9}
            blur="medium"
          />
        </div>

        {/* 2. Tarjeta Mediana (col-span-4): Credencial QR y Pase NFC */}
        <div className="sm:col-span-4 min-h-[160px] sm:min-h-[200px]">
          <BentoCard
            badge="INSPECCIÓN VIAL"
            icon={QrCode}
            title="Pase NFC Contactless"
            subtitle={`Placas: ${plates || "XYZ-7842"}`}
            description="Credencial digital oficial encriptada AES-256 para verificación instantánea por agentes de tránsito."
            buttonText="Ver Pase QR"
            onButtonClick={onOpenQR}
            gradientColors={["#0033FF", "#0284C7", "#38BDF8"]}
            baseBgColor="bg-[#03153D]"
            speed={11}
            blur="medium"
          />
        </div>

        {/* 3. Tarjeta Mediana (col-span-4): Monedero y Recarga Express */}
        <div className="sm:col-span-4 min-h-[160px] sm:min-h-[200px]">
          <BentoCard
            badge="SALDO DIGITAL"
            icon={CreditCard}
            title="Monedero Digital Parqu"
            subtitle={`Disponible: $${Number(balance ?? 320).toFixed(2)} MXN`}
            description="Acreditación instantánea en milisegundos sin comisiones bancarias con garantía de saldo protegido."
            buttonText="+ Recargar Saldo"
            onButtonClick={onOpenRecharge}
            gradientColors={["#0033FF", "#4338CA", "#6366F1"]}
            baseBgColor="bg-[#050C33]"
            speed={12}
            blur="medium"
          />
        </div>

        {/* 4. Tarjeta Grande (col-span-8): Mapa Satelital GPS & Rutas */}
        <div className="sm:col-span-8 min-h-[160px] sm:min-h-[200px]">
          <BentoCard
            badge="LOCALIZACIÓN GPS"
            icon={MapPin}
            title="Mapa Satelital y Regreso Guiado al Auto"
            subtitle="Cajones Libres y Sensores en Vivo"
            description="Guarda la ubicación exacta de tu cajón de estacionamiento y recibe la ruta peatonal más rápida para regresar a tu vehículo en cualquier momento."
            buttonText="Explorar Mapa Satelital →"
            onButtonClick={() => onNavigateTab?.("parking-map")}
            gradientColors={["#0033FF", "#059669", "#10B981"]}
            baseBgColor="bg-[#01142F]"
            speed={10}
            blur="medium"
          />
        </div>
      </div>
    </section>
  )
}

export default ParquBentoBlocks
