import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "../../lib/utils";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const HeroParallax = ({
  products = [],
  headerTitle = "La Nueva Era del Parquímetro Digital",
  headerSubtitle = "SISTEMA METROPOLITANO PARQU",
  headerDescription = "Descubre una plataforma diseñada para eliminar las filas, los parquímetros mecánicos y las multas. Autocobro continuo segundo a segundo con tecnología SSS.Solutions.",
  onSelectProduct,
  className,
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 800]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -800]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.3, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 400]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className={cn(
        "h-[260vh] py-32 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]",
        className
      )}
    >
      <Header 
        title={headerTitle} 
        subtitle={headerSubtitle} 
        description={headerDescription} 
      />

      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="space-y-16"
      >
        {/* Fila 1 */}
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-12 mb-12">
          {firstRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title + idx}
              onClick={() => onSelectProduct && onSelectProduct(product.tab || product.id)}
            />
          ))}
        </motion.div>

        {/* Fila 2 */}
        <motion.div className="flex flex-row mb-12 space-x-12">
          {secondRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title + idx}
              onClick={() => onSelectProduct && onSelectProduct(product.tab || product.id)}
            />
          ))}
        </motion.div>

        {/* Fila 3 */}
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-12">
          {thirdRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title + idx}
              onClick={() => onSelectProduct && onSelectProduct(product.tab || product.id)}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = ({ title, subtitle, description }) => {
  return (
    <div className="max-w-7xl relative mx-auto py-16 md:py-28 px-4 sm:px-6 w-full left-0 top-0 z-20 overflow-visible">
      {/* FONDO SSS.SOLUTIONS: Logo transparente y watermark tecnológico */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl pointer-events-none select-none flex flex-col items-center justify-center opacity-20 transition-opacity duration-700">
        <div className="relative flex flex-col items-center justify-center">
          {/* Resplandor ambiental de SSS.Solutions */}
          <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Logo Oficial Transparente de SSS.Solutions */}
          <img 
            src="/sss-solutions-logo.png" 
            alt="SSS.Solutions" 
            className="h-32 sm:h-48 md:h-60 w-auto object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.45)]"
          />
          
          {/* Marca de agua tipográfica SSS.SOLUTIONS */}
          <span className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.35em] font-mono text-white/30 uppercase mt-3 whitespace-nowrap drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            SSS.SOLUTIONS
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950/90 border border-neutral-800 text-xs font-mono text-neutral-300 mb-6 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.06)]">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="tracking-[0.25em] uppercase font-bold text-[11px] text-white">{subtitle}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-tight max-w-4xl drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base md:text-lg mt-6 text-neutral-400 font-mono leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
          {description}
        </p>
      </div>
    </div>
  );
};

export const ProductCard = ({ product, translate, onClick }) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -15,
        scale: 1.02,
      }}
      onClick={onClick}
      className="group/product h-80 sm:h-96 w-[28rem] sm:w-[32rem] relative flex-shrink-0 cursor-pointer rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-2xl transition-all duration-300 hover:border-neutral-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
    >
      {/* Fondo con gradiente y textura obsidian */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/90 via-neutral-950/95 to-black" />
      <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient || 'from-indigo-900/20 via-transparent to-purple-900/20'} opacity-60 group-hover/product:opacity-100 transition-opacity duration-500`} />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* Contenido de la Tarjeta Parallax */}
      <div className="relative z-10 h-full p-8 flex flex-col justify-between">
        
        {/* Fila Superior: Categoría / Tag y Botón de Apertura */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 font-bold">
            {product.category || 'MÓDULO OFICIAL'}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white group-hover/product:bg-white group-hover/product:text-black transition-all duration-300 shadow-md">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Centro: Icono / Identidad Visual */}
        <div className="my-auto py-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-white mb-4 group-hover/product:scale-110 group-hover/product:border-neutral-600 transition-all duration-300 shadow-lg">
            {product.icon}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight group-hover/product:text-white transition-colors">
            {product.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Fila Inferior: Métricas / Estado */}
        <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300 font-bold">{product.tag || 'Activo en Parqu'}</span>
          </span>
          <span className="text-neutral-500 group-hover/product:text-white transition-colors">
            Clic para interactuar ➔
          </span>
        </div>

      </div>
    </motion.div>
  );
};

export default HeroParallax;
