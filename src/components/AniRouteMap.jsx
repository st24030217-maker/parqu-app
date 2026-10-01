import React, { useMemo, useState } from 'react';
import { AniMaps } from 'animaps-react';
import 'animaps-react/style.css';
import { 
  Navigation, 
  Car, 
  MapPin, 
  Sparkles, 
  Layers, 
  Clock, 
  ChevronRight, 
  Video, 
  CheckCircle2,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// Coordenadas base en caso de fallback
const DEFAULT_ORIGIN = { lat: 19.4326, lng: -99.1332, name: 'Mi Ubicación GPS (Paseo de la Reforma)' };

export const AniRouteMap = ({
  userLocation,
  selectedZone,
  pinnedSpot,
  vehicle,
  onBackToLeaflet,
  className = '',
}) => {
  // Preset de ruta activa
  const [routePreset, setRoutePreset] = useState('direct'); // 'direct' | 'urban-tour' | 'scenic'

  // Genera los stops para AniMaps según la selección del usuario y el vehículo
  const initialStops = useMemo(() => {
    const originCoords = userLocation || DEFAULT_ORIGIN;
    const dest = pinnedSpot || selectedZone || {
      lat: originCoords.lat + 0.0035,
      lng: originCoords.lng + 0.0030,
      name: 'Espacio Registrado Centro',
      spotNumber: '1042',
    };

    if (routePreset === 'urban-tour') {
      return [
        {
          city: 'Partida GPS',
          country: 'Paseo de la Reforma',
          lat: originCoords.lat,
          lng: originCoords.lng,
        },
        {
          city: 'Monumento a la Rev.',
          country: 'Vía Primaria',
          lat: originCoords.lat + 0.0018,
          lng: originCoords.lng - 0.0022,
        },
        {
          city: 'Av. Juárez / Bellas Artes',
          country: 'Eje Central',
          lat: originCoords.lat + 0.0028,
          lng: originCoords.lng + 0.0015,
        },
        {
          city: dest.shortName || dest.name || 'Espacio Registrado',
          country: dest.spotCode || 'Destino Parqu',
          lat: dest.lat || (originCoords.lat + 0.0035),
          lng: dest.lng || (originCoords.lng + 0.0030),
        },
      ];
    }

    if (routePreset === 'scenic') {
      return [
        {
          city: 'Zona Rosa',
          country: 'Corredor Comercial',
          lat: originCoords.lat - 0.0030,
          lng: originCoords.lng - 0.0025,
        },
        {
          city: 'Insurgentes Centro',
          country: 'Enlace Metropolitano',
          lat: originCoords.lat,
          lng: originCoords.lng,
        },
        {
          city: dest.shortName || dest.name || 'Espacio Registrado',
          country: dest.spotCode || 'Destino Parqu',
          lat: dest.lat || (originCoords.lat + 0.0035),
          lng: dest.lng || (originCoords.lng + 0.0030),
        },
      ];
    }

    // Ruta directa por defecto (origen -> punto intermedio vial -> destino)
    const midLat = (originCoords.lat + (dest.lat || originCoords.lat)) / 2 + 0.0008;
    const midLng = (originCoords.lng + (dest.lng || originCoords.lng)) / 2 - 0.0006;

    return [
      {
        city: 'Mi Ubicación',
        country: `${vehicle?.plates || 'Auto Registrado'}`,
        lat: originCoords.lat,
        lng: originCoords.lng,
      },
      {
        city: 'Trayecto Vial Metropolitano',
        country: 'Corredor Inteligente',
        lat: midLat,
        lng: midLng,
      },
      {
        city: dest.shortName || dest.name || 'Espacio Parqu',
        country: dest.spotCode || 'Destino',
        lat: dest.lat || (originCoords.lat + 0.0035),
        lng: dest.lng || (originCoords.lng + 0.0030),
      },
    ];
  }, [userLocation, selectedZone, pinnedSpot, vehicle, routePreset]);

  const targetSpotName = pinnedSpot?.name || selectedZone?.name || 'Espacio Registrado';
  const targetSpotCode = pinnedSpot ? (pinnedSpot.spotNumber ? `#${pinnedSpot.spotNumber}` : '#PIN') : (selectedZone?.spotNumber ? `#${selectedZone.spotNumber}` : '#1042');

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#01033E]/70 backdrop-blur-xl shadow-2xl flex flex-col font-sans text-[#D4D6E6] ${className}`}>
      
      {/* 1. Header con Controles y Branding de AniMaps */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#01033E]/90 via-[#01033E]/60 to-black border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0033FF]/20 text-[#D4D6E6] border border-[#807DFE]/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#807DFE]" />
              ANIMAPS-REACT MOTOR 3D
            </span>
            <span className="text-[#D4D6E6]/60">•</span>
            <span className="text-[11px] text-[#D4D6E6] font-sans">
              Vehículo: <strong className="text-white">{vehicle?.brand || 'Auto'} (<span className="font-mono">{vehicle?.plates || 'XYZ-7842'}</span>)</strong>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight font-sans">
            <Compass className="w-5 h-5 text-[#807DFE]" />
            Recorrido Animado hacia {targetSpotName}
          </h3>
          <p className="text-xs text-[#D4D6E6] font-sans">
            Destino: <span className="text-white font-bold">{targetSpotName}</span>
          </p>
        </div>

        {/* Botones de acción y selector de recorrido */}
        <div className="flex flex-wrap items-center gap-2 font-sans">
          {/* Selector de tipo de recorrido */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setRoutePreset('direct')}
              className={`px-3 py-1.5 rounded-xl transition text-[11px] font-sans font-bold ${
                routePreset === 'direct'
                  ? 'bg-[#0033FF] text-white border border-[#0033FF] shadow-md'
                  : 'text-[#D4D6E6]/70 hover:text-white'
              }`}
            >
              Directa
            </button>
            <button
              type="button"
              onClick={() => setRoutePreset('urban-tour')}
              className={`px-3 py-1.5 rounded-xl transition text-[11px] font-sans font-bold ${
                routePreset === 'urban-tour'
                  ? 'bg-[#0033FF] text-white border border-[#0033FF] shadow-md'
                  : 'text-[#D4D6E6]/70 hover:text-white'
              }`}
            >
              Urbana (4 Puntos)
            </button>
            <button
              type="button"
              onClick={() => setRoutePreset('scenic')}
              className={`px-3 py-1.5 rounded-xl transition text-[11px] font-sans font-bold ${
                routePreset === 'scenic'
                  ? 'bg-[#0033FF] text-white border border-[#0033FF] shadow-md'
                  : 'text-[#D4D6E6]/70 hover:text-white'
              }`}
            >
              Corredor
            </button>
          </div>

          {/* Botón para volver al mapa estándar de Leaflet */}
          {onBackToLeaflet && (
            <button
              type="button"
              onClick={onBackToLeaflet}
              className="px-4 py-2 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,51,255,0.4)] transition active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Mapa</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner de Tips / Funcionalidades nativas de AniMaps */}
      <div className="px-4 py-2.5 bg-[#01033E]/50 border-b border-white/10 flex items-center justify-between text-[11px] text-[#D4D6E6] gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>
            Pulsa el botón de <strong>Reproducir (Play)</strong> para volar por la ruta. Puedes cambiar el transporte a 🚗 Coche o 🚲 Bici y exportar en video.
          </span>
        </div>
        <span className="text-[10px] text-[#D4D6E6]/70 hidden sm:inline shrink-0">
          animaps-react v0.1.1
        </span>
      </div>

      {/* 3. Contenedor de AniMaps con Error Boundary para asegurar estabilidad */}
      <div className="relative w-full h-[520px] sm:h-[580px] bg-[#01033E]/40 overflow-hidden">
        <ErrorBoundary
          fallbackText="Error al renderizar AniMaps 3D"
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#01033E]">
              <Compass className="w-8 h-8 text-white animate-spin" />
              <p className="text-sm font-bold text-white">No se pudo inicializar el motor 3D de AniMaps</p>
              <p className="text-xs text-[#D4D6E6] max-w-sm">
                Tu navegador puede requerir aceleración por hardware WebGL activa.
              </p>
              {onBackToLeaflet && (
                <button
                  type="button"
                  onClick={onBackToLeaflet}
                  className="px-4 py-2 rounded-xl bg-[#0033FF] text-white text-xs font-bold"
                >
                  Regresar a Mapa Estándar
                </button>
              )}
            </div>
          }
        >
          {/* Componente AniMaps con key basada en el preset para refrescar la ruta limpia */}
          <AniMaps
            key={`animaps-${routePreset}-${targetSpotCode}`}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            initialStops={initialStops}
            routeColor="#0033FF"
          />
        </ErrorBoundary>
      </div>

      {/* 4. Footer con resumen de la ruta y acción rápida */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <Car className="w-4 h-4 text-indigo-400" />
          <span>
            Ruta calculada desde <strong>{initialStops[0]?.city}</strong> hasta <strong>{initialStops[initialStops.length - 1]?.city}</strong> ({initialStops.length} paradas).
          </span>
        </div>

        {onBackToLeaflet && (
          <button
            type="button"
            onClick={onBackToLeaflet}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 underline transition"
          >
            <span>Fijar otro punto en el Mapa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};

export default AniRouteMap;
