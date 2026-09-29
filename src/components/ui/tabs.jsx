import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

/**
 * Aceternity UI Tabs Component
 * Smooth spring-animated tabs with floating pill indicator, 3D perspective, and fluid transitions.
 * Fully compatible with official @aceternity/tabs and controlled/uncontrolled state.
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

  // Controlled or uncontrolled active selection
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
      {/* Barra de pestañas Aceternity con perspectiva 3D y layoutId spring */}
      <div
        className={cn(
          "flex overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#01033E]/60 border border-white/10 backdrop-blur-xl [perspective:1000px] relative max-w-full shadow-xl scrollbar-none",
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
              onClick={() => handleSelectTab(tab)}
              className={cn(
                "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono font-bold transition-colors select-none cursor-pointer z-10 shrink-0 whitespace-nowrap",
                isActive
                  ? "text-white"
                  : "text-[#D4D6E6]/70 hover:text-white hover:bg-white/5",
                tabClassName
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAceternityTabPill"
                  transition={{ type: "spring", bounce: 0.22, duration: 0.45 }}
                  className={cn(
                    "absolute inset-0 bg-[#0033FF] rounded-xl shadow-[0_0_20px_rgba(0,51,255,0.5)] border border-[#807DFE]/50",
                    activeTabClassName
                  )}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {Icon && <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />}
                <span>{tabTitle}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-mono transition-colors font-bold",
                      isActive
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-white/5 text-[#D4D6E6] border border-white/10"
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

      {/* Contenido dinámico con animación fluida Aceternity */}
      <div className={cn("w-full relative", contentClassName)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabObj.value || activeTabObj.id}
            initial={{ opacity: 0, y: 14, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.995 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
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
