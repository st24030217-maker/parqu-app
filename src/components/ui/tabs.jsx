import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
          "flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-md [perspective:1000px] relative max-w-full overflow-x-auto shadow-xl",
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
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-colors select-none cursor-pointer z-10",
                isActive
                  ? "text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50",
                tabClassName
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAceternityTabPill"
                  transition={{ type: "spring", bounce: 0.22, duration: 0.45 }}
                  className={cn(
                    "absolute inset-0 bg-white rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.4)]",
                    activeTabClassName
                  )}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                <span>{tabTitle}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-mono transition-colors font-bold",
                      isActive
                        ? "bg-black text-white"
                        : "bg-neutral-800 text-neutral-300 border border-neutral-700/50"
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
