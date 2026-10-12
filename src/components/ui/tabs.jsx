import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

/**
 * Aceternity UI Tabs Component (Adapted to Kage Studio #0a0a0d + #8b5cf6)
 */
export const Tabs = ({
  tabs: propTabs = [],
  activeTab: controlledActiveTab,
  onTabChange,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}) => {
  const [internalActive, setInternalActive] = useState(
    propTabs.find((t) => (t.value || t.id) === controlledActiveTab) || propTabs[0] || {}
  );

  const activeValue = controlledActiveTab !== undefined
    ? controlledActiveTab
    : (internalActive.value || internalActive.id);

  const activeTabObj = propTabs.find(
    (t) => (t.value || t.id) === activeValue
  ) || propTabs[0] || {};

  const handleSelectTab = (tab) => {
    const val = tab.value || tab.id;
    setInternalActive(tab);
    if (onTabChange) {
      onTabChange(val);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Barra de pestañas Kage Studio (#0d0d11 con borde hairline 1px) */}
      <div
        role="tablist"
        aria-label="Pestañas de control del sistema Parqu"
        className={cn(
          "flex overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-[#0d0d11] border border-white/[0.08] [perspective:1000px] relative max-w-full scrollbar-none",
          containerClassName
        )}
      >
        {propTabs.map((tab) => {
          const tabVal = tab.value || tab.id;
          const tabTitle = tab.title || tab.label;
          const isActive = tabVal === activeValue;
          const Icon = tab.icon;

          return (
            <button
              key={tabVal}
              type="button"
              role="tab"
              id={`system-tab-${tabVal}`}
              aria-selected={isActive}
              aria-controls={`system-tabpanel-${tabVal}`}
              onClick={() => handleSelectTab(tab)}
              className={cn(
                "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-sans font-semibold transition-colors select-none cursor-pointer z-10 shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]",
                isActive
                  ? "text-white"
                  : "text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]",
                tabClassName
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAceternityTabPill"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                  className={cn(
                    "absolute inset-0 bg-[#8b5cf6] rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-white/[0.14]",
                    activeTabClassName
                  )}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {Icon && (
                  <Icon
                    className={cn(
                      "w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0",
                      isActive ? "text-white" : "text-[#a78bfa]"
                    )}
                  />
                )}
                <span className={cn("font-semibold", isActive ? "text-white" : "text-inherit")}>
                  {tabTitle}
                </span>
                {tab.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-mono transition-colors font-semibold border",
                      isActive
                        ? "bg-black/25 text-white border-white/20"
                        : "bg-white/[0.04] text-[#a78bfa] border-white/[0.08]"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido dinámico */}
      <div 
        id={`system-tabpanel-${activeTabObj.value || activeTabObj.id}`}
        role="tabpanel"
        aria-labelledby={`system-tab-${activeTabObj.value || activeTabObj.id}`}
        className={cn("w-full relative", contentClassName)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabObj.value || activeTabObj.id}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeTabObj.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tabs;
