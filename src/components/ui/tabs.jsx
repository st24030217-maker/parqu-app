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
        role="tablist"
        aria-label="Pestañas de control del sistema Parqu"
        className={cn(
          "flex overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white/30 border border-slate-200/40 backdrop-blur-2xl [perspective:1000px] relative max-w-full shadow-none scrollbar-none",
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
                "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-sans font-bold transition-colors select-none cursor-pointer z-10 shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                isActive
                  ? "text-black font-extrabold"
                  : "text-slate-700 hover:text-black hover:bg-white/60",
                tabClassName
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAceternityTabPill"
                  transition={{ type: "spring", bounce: 0.22, duration: 0.45 }}
                  className={cn(
                    "absolute inset-0 bg-white/70 backdrop-blur-xl rounded-xl shadow-sm border border-slate-200/60",
                    activeTabClassName
                  )}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {Icon && <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 text-black" />}
                <span className="text-black font-bold">{tabTitle}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-mono transition-colors font-bold",
                      isActive
                        ? "bg-white/50 text-black border border-slate-200/50"
                        : "bg-slate-200/50 text-slate-800 border border-slate-300/40"
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
      <div 
        id={`system-tabpanel-${activeTabObj.value || activeTabObj.id}`}
        role="tabpanel"
        aria-labelledby={`system-tab-${activeTabObj.value || activeTabObj.id}`}
        className={cn("w-full relative", contentClassName)}
      >
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
