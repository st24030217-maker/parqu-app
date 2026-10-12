"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { ArrowUpRight } from "lucide-react";

export const InterfaceCraftsCards = ({
  items = [],
  className,
  onItemClick,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full relative",
        className
      )}
    >
      {items.map((item, index) => {
        const isSelected = selectedIndex === index;
        const Icon = item.icon;

        return (
          <motion.div
            key={item.id || index}
            role="button"
            tabIndex={0}
            aria-label={`${item.title}${item.subtitle ? ` - ${item.subtitle}` : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              if (onItemClick) onItemClick(item);
              if (item.onClick) item.onClick();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedIndex(index);
                if (onItemClick) onItemClick(item);
                if (item.onClick) item.onClick();
              }
            }}
            layout
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            className={cn(
              "relative group/card cursor-pointer rounded-xl p-4 flex flex-col justify-between overflow-hidden border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]",
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0a0a0d] border-white/[0.08] hover:border-white/[0.16]",
              isSelected && "ring-1 ring-[#8b5cf6] border-[#8b5cf6]/50"
            )}
          >
            {/* Resplandor de Gradiente Ambiental al pasar el mouse */}
            <div
              className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-[#8b5cf6]/10 via-transparent to-transparent"
            />

            {/* Fila Superior: Icono con badge y Tag de Acceso Rápido */}
            <div className="flex items-center justify-between relative z-10 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center transition-colors group-hover/card:border-[#8b5cf6]/40">
                {Icon && <Icon className="w-4 h-4 text-[#a78bfa]" />}
              </div>

              <div className="flex items-center gap-1">
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full border",
                      item.badgeClassName || "bg-white/[0.04] text-[#e4e4e7] border-white/[0.08]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] group-hover/card:bg-[#8b5cf6] group-hover/card:border-[#8b5cf6] group-hover/card:text-white transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Contenido Central: Título y Subtítulo */}
            <div className="relative z-10 space-y-1">
              <h4 className="text-sm font-bold text-white tracking-tight font-sans">
                {item.title}
              </h4>
              <p className="text-[11px] font-sans text-[#a1a1aa] line-clamp-1 leading-snug">
                {item.subtitle || item.description}
              </p>
            </div>

            {/* Fila Inferior: Métrica / Estatus Rápido */}
            {item.footerText && (
              <div className="relative z-10 mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#71717a]">
                <span className="truncate">{item.footerText}</span>
                {item.activeStatus && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse flex-shrink-0" />
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default InterfaceCraftsCards;
