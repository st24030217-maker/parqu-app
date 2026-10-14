"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { ArrowUpRight, Sparkles, Check } from "lucide-react";

export const InterfaceCraftsCards = ({
  items = [],
  className,
  onItemClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full relative",
        className
      )}
    >
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isSelected = selectedIndex === index;
        const Icon = item.icon;

        return (
          <motion.div
            key={item.id || index}
            role="button"
            tabIndex={0}
            aria-label={`${item.title}${item.subtitle ? ` - ${item.subtitle}` : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
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
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className={cn(
              "relative group/card cursor-pointer rounded-2xl p-4 flex flex-col justify-between overflow-hidden border backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              item.borderClassName || "border-neutral-800/80 hover:border-neutral-600",
              item.bgClassName || "bg-neutral-950/80 hover:bg-neutral-900/90",
              isSelected && "ring-2 ring-white border-transparent"
            )}
          >
            {/* Resplandor de Gradiente Ambiental al pasar el mouse */}
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br",
                item.glowGradient || "from-white/10 via-transparent to-transparent"
              )}
            />

            {/* Fila Superior: Icono con badge y Tag de Acceso Rápido */}
            <div className="flex items-center justify-between relative z-10 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover/card:scale-110",
                  item.iconBg || "bg-slate-100 border border-slate-200 text-black"
                )}
              >
                {Icon && <Icon className="w-5 h-5 text-black" />}
              </div>

              <div className="flex items-center gap-1">
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full border",
                      item.badgeClassName || "bg-slate-100 text-slate-800 border-slate-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 opacity-60 group-hover/card:opacity-100 group-hover/card:bg-black group-hover/card:text-white transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Contenido Central: Título y Subtítulo */}
            <div className="relative z-10 space-y-1">
              <h4 className="text-sm font-black text-black tracking-tight font-sans group-hover/card:text-slate-800 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] font-sans text-slate-500 line-clamp-1 leading-snug">
                {item.subtitle || item.description}
              </p>
            </div>

            {/* Fila Inferior: Métrica / Estatus Rápido */}
            {item.footerText && (
              <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="truncate">{item.footerText}</span>
                {item.activeStatus && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
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
