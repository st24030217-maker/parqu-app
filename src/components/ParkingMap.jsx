import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Car, 
  CheckCircle2,
  Sparkles, 
  Bookmark, 
  ExternalLink, 
  Trash2, 
  Check, 
  Copy,
  Hash,
  Square,
  History
} from 'lucide-react';
import { sileo } from 'sileo';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatDate, formatPlate } from '../utils/formatters';
import { AniRouteMap } from './AniRouteMap';

// Coordenadas metropolitanas base por defecto (CDMX Paseo de la Reforma / Centro)
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };

export const ParkingMap = ({
  selectedZone,
  onSelectZone,
  onStartSession,
  onStopSession,
  activeSession,
  className = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const pinnedMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const {
    vehicle,
    pinnedLocations,
    activePinnedLocation,
    registerPinnedLocation,
    removePinnedLocation,
  } = useParking();

  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('locating'); // 'locating' | 'locked' | 'fallback'
  const [isCentering, setIsCentering] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState('register'); // 'register' | 'history'
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'animaps'

  // Número de parquímetro / espacio ingresado por el usuario
  const [spotNumber, setSpotNumber] = useState('1042');

  // Ubicación que el usuario está fijando actualmente en el mapa
  const [pinnedSpot, setPinnedSpot] = useState(() => {
    if (activePinnedLocation) {
      return {
        lat: activePinnedLocation.lat,
        lng: activePinnedLocation.lng,
        name: activePinnedLocation.name,
        address: activePinnedLocation.address,
        isSaved: true,
      };
    }
    return {
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      name: 'Espacio #1042',
      address: `Lat: ${DEFAULT_CENTER.lat.toFixed(5)}, Lng: ${DEFAULT_CENTER.lng.toFixed(5)}`,
      isSaved: false,
    };
  });

  const [copiedCoords, setCopiedCoords] = useState(false);

  // Callback ref para clics en el mapa
  const handleMapClickRef = useRef();
  handleMapClickRef.current = (lat, lng) => {
    const num = spotNumber.trim() || '1042';
    const newSpot = {
      lat,
      lng,
      name: `Espacio #${num}`,
      address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
      timestamp: new Date().toISOString(),
      isSaved: false,
    };
    setPinnedSpot(newSpot);

    if (onSelectZone) {
      onSelectZone({
        id: `SPOT_${num}`,
        name: newSpot.name,
        spotNumber: num,
        spotCode: `#${num}`,
        cajon: `#${num}`,
        ratePerHour: 18.00,
        lat,
        lng,
        spotsAvailable: 1,
        tag: 'UBICACIÓN FIJADA',
      });
    }

    sileo.info({
      title: 'Punto Marcado en el Mapa',
      description: `Ubicación fijada. Confirma el número #${num} y pulsa "Registrar Estacionamiento".`,
    });
  };

  // 1. Inicialización de Leaflet con capa nocturna ESRI
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialPos = pinnedSpot || DEFAULT_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: [initialPos.lat, initialPos.lng],
      zoom: 16,
      maxZoom: 18,
      minZoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    // Capa base oscura nocturna (ESRI World Dark Gray - 100% libre)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Esri &copy; DeLorme, NAVTEQ',
      }
    ).addTo(map);

    // Capa de nombres de calles y referencias urbanas
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: '',
      }
    ).addTo(map);

    // Controles de Zoom en esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Listener para fijar punto al hacer clic en el mapa
    map.on('click', (e) => {
      if (handleMapClickRef.current) {
        handleMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Detección GPS del Usuario
  useEffect(() => {
    const handleLocationFound = (coords, isRealGps) => {
      setUserLocation(coords);
      setGpsStatus(isRealGps ? 'locked' : 'fallback');

      setPinnedSpot((prev) => {
        if (!prev || prev.lat === DEFAULT_CENTER.lat) {
          const num = spotNumber.trim() || '1042';
          return {
            lat: coords.lat,
            lng: coords.lng,
            name: `Espacio #${num}`,
            address: `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`,
            isSaved: false,
          };
        }
        return prev;
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16, {
          duration: 1.2,
        });
        mapInstanceRef.current.invalidateSize();
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationFound(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            true
          );
        },
        (err) => {
          console.warn('GPS no disponible o denegado, usando mapa metropolitano:', err.message);
          handleLocationFound(DEFAULT_CENTER, false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      handleLocationFound(DEFAULT_CENTER, false);
    }
  }, []);

  // 3. Marcador del Usuario (Pulsing Beacon azul)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const userBeaconIcon = L.divIcon({
        className: 'custom-user-beacon',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
            <span class="absolute w-10 h-10 rounded-full bg-blue-500/30 animate-ping"></span>
            <span class="absolute w-7 h-7 rounded-full bg-blue-600/40"></span>
            <div class="relative w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,1)] flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userBeaconIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(
          `<div class="text-xs font-mono text-center p-1 font-bold text-black">
            📍 Tu Ubicación Actual (GPS)
            <div class="text-[10px] text-neutral-500 font-normal">Vehículo: ${vehicle?.plates || 'XYZ-7842'}</div>
          </div>`
        );
    }
  }, [userLocation, vehicle]);

  // 4. Marcador de la Ubicación FIJADA con el NÚMERO ingresado (Arrastrable)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pinnedSpot) {
      if (pinnedMarkerRef.current) {
        pinnedMarkerRef.current.remove();
        pinnedMarkerRef.current = null;
      }
      return;
    }

    const currentNum = spotNumber.trim() || '1042';

    const pinnedPinIcon = L.divIcon({
      className: 'custom-pinned-location-pin',
      html: `
        <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform transition-transform hover:scale-105 select-none">
          <!-- Badge Superior con Número de Espacio y Placas -->
          <div class="px-3 py-1.5 rounded-2xl bg-amber-400 text-black border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.9)] font-mono text-[11px] font-black flex items-center gap-1.5 whitespace-nowrap animate-bounce">
            <span class="w-2 h-2 rounded-full bg-black animate-ping"></span>
            <span>ESPACIO #${currentNum}</span>
            <span class="bg-black text-amber-300 px-1.5 py-0.5 rounded text-[9px]">${vehicle?.plates || 'XYZ-7842'}</span>
          </div>

          <!-- Flecha de anclaje -->
          <div class="w-3.5 h-3.5 rotate-45 -mt-2 bg-amber-400 border-r-2 border-b-2 border-white"></div>

          <!-- Radar de suelo pulsante -->
          <div class="w-12 h-12 rounded-full bg-amber-400/30 animate-ping absolute -bottom-3 pointer-events-none"></div>
          <div class="w-4 h-1.5 rounded-full bg-black/80 blur-[1px] mt-0.5"></div>
        </div>
      `,
      iconSize: [160, 60],
      iconAnchor: [80, 52],
    });

    if (pinnedMarkerRef.current) {
      pinnedMarkerRef.current.setLatLng([pinnedSpot.lat, pinnedSpot.lng]);
      pinnedMarkerRef.current.setIcon(pinnedPinIcon);
    } else {
      const marker = L.marker([pinnedSpot.lat, pinnedSpot.lng], {
        icon: pinnedPinIcon,
        draggable: true,
        zIndexOffset: 2500,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setPinnedSpot((prev) => ({
          ...prev,
          lat,
          lng,
          address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
          isSaved: false,
        }));
        sileo.info({
          title: 'Punto de Estacionamiento Reubicado',
          description: `Nueva coordenada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      });

      pinnedMarkerRef.current = marker;
    }
  }, [pinnedSpot, spotNumber, vehicle]);

  // 5. Línea de Ruta (conecta ubicación GPS con el punto fijado)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (userLocation && pinnedSpot && pinnedSpot.lat && pinnedSpot.lng) {
      const latlngs = [
        [userLocation.lat, userLocation.lng],
        [pinnedSpot.lat, pinnedSpot.lng],
      ];

      routeLineRef.current = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }
  }, [userLocation, pinnedSpot]);

  // Centrar el mapa en la ubicación del usuario
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setIsCentering(true);

    const target = userLocation || DEFAULT_CENTER;
    map.flyTo([target.lat, target.lng], 16, {
      duration: 1.0,
      easeLinearity: 0.25,
    });

    setTimeout(() => setIsCentering(false), 1000);
  };

  // Botón: Fijar mi ubicación GPS actual de inmediato
  const handlePinCurrentLocation = () => {
    const coords = userLocation || DEFAULT_CENTER;
    const num = spotNumber.trim() || '1042';
    const newSpot = {
      lat: coords.lat,
      lng: coords.lng,
      name: `Espacio #${num}`,
      address: `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`,
      timestamp: new Date().toISOString(),
      isSaved: false,
    };
    setPinnedSpot(newSpot);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 0.8 });
    }

    sileo.success({
      title: 'Ubicación GPS Fijada',
      description: `Punto anclado para Espacio #${num}. Pulsa "Registrar Estacionamiento" para comenzar.`,
    });
  };

  // Flujo principal: "solo fijan y le dan un numero y listo se registra"
  const handleRegisterParking = () => {
    const coords = pinnedSpot || userLocation || DEFAULT_CENTER;
    const num = spotNumber.trim() || '1042';
    const spotName = `Espacio #${num}`;

    // 1. Guardar en bitácora de ubicaciones
    registerPinnedLocation({
      name: spotName,
      address: coords.address || `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`,
      lat: coords.lat,
      lng: coords.lng,
      status: 'ACTIVA',
      ratePerHour: 18.00,
      notes: `Registrado en espacio #${num} a las ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
    });

    setPinnedSpot({
      ...coords,
      name: spotName,
      isSaved: true,
    });

    // 2. Iniciar sesión de parquímetro directamente
    if (onStartSession) {
      onStartSession({
        id: `SPOT_${num}`,
        name: spotName,
        spotNumber: num,
        spotCode: `#${num}`,
        cajon: `#${num}`,
        ratePerHour: 18.00,
        lat: coords.lat,
        lng: coords.lng,
      });
    }

    sileo.success({
      title: '¡Estacionamiento Registrado!',
      description: `${spotName} registrado exitosamente para el vehículo ${vehicle?.plates || 'XYZ-7842'}. Parquímetro activo.`,
    });
  };

  // Volar en el mapa a una ubicación registrada del historial
  const handleFlyToHistoryRecord = (item) => {
    setPinnedSpot({
      lat: item.lat,
      lng: item.lng,
      name: item.name,
      address: item.address,
      isSaved: true,
    });

    const match = item.name.match(/#(\w+)/);
    if (match) {
      setSpotNumber(match[1]);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 16, { duration: 1.0 });
    }

    setActiveTabMode('register');

    sileo.info({
      title: 'Ubicación Localizada',
      description: `Punto cargado en mapa: ${item.name}.`,
    });
  };

  const handleCopyCoords = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
    sileo.success({
      title: 'Coordenadas Copiadas',
      description: `${lat.toFixed(5)}, ${lng.toFixed(5)} copiadas al portapapeles.`,
    });
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col ${className}`}>
      
      {/* MODO 3D ANIMADO CON ANIMAPS-REACT */}
      {viewMode === 'animaps' && (
        <AniRouteMap
          userLocation={userLocation}
          selectedZone={{
            name: `Espacio #${spotNumber || '1042'}`,
            spotNumber: spotNumber || '1042',
            spotCode: `#${spotNumber || '1042'}`,
            cajon: `#${spotNumber || '1042'}`,
            lat: pinnedSpot?.lat,
            lng: pinnedSpot?.lng,
          }}
          pinnedSpot={pinnedSpot}
          vehicle={vehicle}
          onBackToLeaflet={() => {
            setViewMode('map');
            setTimeout(() => {
              mapInstanceRef.current?.invalidateSize();
            }, 150);
          }}
        />
      )}

      {/* MODO MAPA INTERACTIVO (LEAFLET) */}
      <div className={`relative w-full flex flex-col ${viewMode === 'animaps' ? 'hidden' : ''}`}>

        {/* 1. BARRA SUPERIOR FLOTANTE DEL MAPA */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-[400] flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
          
          {/* Badge GPS y Estado */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 shadow-xl text-xs font-mono pointer-events-auto">
            <span className={`w-2 h-2 rounded-full ${
              gpsStatus === 'locked' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
            }`} />
            <span className="text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
              {gpsStatus === 'locked' ? 'GPS SATELITAL EN VIVO' : 'MAPA SATELITAL'}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-amber-300 font-bold text-[10px]">
              {pinnedLocations.length} Registros
            </span>
          </div>

          {/* Selector de Modo: Mapa / AniMaps (3D) */}
          <div className="flex items-center gap-1 bg-[#01033E]/95 backdrop-blur-md p-0.5 sm:p-1 rounded-full border border-white/10 shadow-xl pointer-events-auto text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-bold transition flex items-center gap-1 text-[11px] sm:text-xs ${
                viewMode === 'map'
                  ? 'bg-[#0033FF] text-white shadow'
                  : 'text-[#D4D6E6]/70 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('animaps')}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-bold transition flex items-center gap-1 text-[11px] sm:text-xs ${
                viewMode === 'animaps'
                  ? 'bg-[#0033FF] text-white border border-[#807DFE]/50 shadow-[0_0_15px_rgba(0,51,255,0.4)]'
                  : 'text-[#D4D6E6] hover:text-white'
              }`}
              title="Abrir simulador cinemático de ruta con animaps-react"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#807DFE] animate-pulse" />
              <span>Ruta AniMaps 3D</span>
            </button>
          </div>
        </div>

        {/* 2. BOTONES FLOTANTES LATERALES */}
        <div className="absolute top-20 sm:top-16 right-2 sm:right-3 z-[400] pointer-events-auto flex flex-col gap-2">
          {/* Botón: Fijar Ubicación GPS Actual */}
          <button
            type="button"
            onClick={handlePinCurrentLocation}
            title="Fijar mi ubicación GPS actual aquí"
            className="px-3 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black border-2 border-white backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all font-mono font-black text-xs"
          >
            <MapPin className="w-4 h-4 fill-current text-black" />
            <span className="hidden sm:inline">Fijar Mi Ubicación</span>
          </button>

          {/* Botón: Centrar Mapa en GPS */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Centrar en mi ubicación GPS"
            className="w-11 h-11 ml-auto rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Crosshair className={`w-5 h-5 text-blue-400 ${isCentering ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 3. CONTENEDOR DEL MAPA LEAFLET */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-[320px] sm:h-[380px] md:h-[420px] z-0 bg-neutral-950" 
        />

        {/* 4. PANEL INFERIOR: REGISTRO DIRECTO POR NÚMERO Y UBICACIÓN */}
        <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-neutral-950 via-neutral-950 to-neutral-900/95 border-t border-neutral-800/90 space-y-4">
          
          {/* Tabs: [Fijar y Registrar] | [Historial de Ubicaciones] */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTabMode('register')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-2 transition ${
                  activeTabMode === 'register'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Registrar en Mapa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabMode('history')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-2 transition ${
                  activeTabMode === 'history'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial (<span className="font-mono">{pinnedLocations.length}</span>)</span>
              </button>
            </div>

            <span className="text-[11px] font-sans text-neutral-400 hidden sm:inline">
              Vehículo: <strong className="text-white font-mono">{formatPlate(vehicle?.plates || 'XYZ-7842')}</strong>
            </span>
          </div>

          {/* CONTENIDO SEGÚN LA PESTAÑA */}
          {activeTabMode === 'register' ? (
            <div className="space-y-4 font-sans">
              {/* Notificación de cómo funciona */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-neutral-300">
                    Fija el punto en el mapa (o toca tu GPS), escribe el número y pulsa <strong>Registrar</strong>.
                  </span>
                </div>
                {pinnedSpot && (
                  <button
                    type="button"
                    onClick={() => handleCopyCoords(pinnedSpot.lat, pinnedSpot.lng)}
                    className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-amber-300 hover:text-white transition"
                    title="Copiar coordenadas"
                  >
                    <span>{pinnedSpot.lat.toFixed(4)}, {pinnedSpot.lng.toFixed(4)}</span>
                    {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Formulario Principal de Registro Directo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Input del Número de Parquímetro / Espacio */}
                <div className="md:col-span-6">
                  <label htmlFor="parking-spot-number" className="text-[10px] uppercase font-bold text-neutral-400 mb-1 flex items-center gap-1 font-sans">
                    <Hash className="w-3 h-3 text-amber-400" />
                    <span>Número de Parquímetro o Espacio</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 font-mono font-black text-amber-400 flex items-center justify-center text-sm shadow-inner">
                      #
                    </div>
                    <input
                      id="parking-spot-number"
                      type="text"
                      aria-label="Número de parquímetro o espacio"
                      value={spotNumber}
                      onChange={(e) => setSpotNumber(e.target.value)}
                      placeholder="1042"
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 focus:border-[#807DFE] focus:bg-white/10 focus:outline-none text-white font-mono text-base font-bold placeholder:text-neutral-500 transition focus-visible:ring-2 focus-visible:ring-[#807DFE]"
                    />
                  </div>
                </div>

                {/* Botón de Registro Directo */}
                <div className="md:col-span-6 flex flex-col sm:flex-row gap-2 pt-4 md:pt-0">
                  {!activeSession ? (
                    <button
                      type="button"
                      aria-label="Registrar estacionamiento en el parquímetro"
                      onClick={handleRegisterParking}
                      className="w-full h-11 px-6 rounded-xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,51,255,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Registrar Estacionamiento</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span className="font-mono">Activo en #{spotNumber}</span>
                      </div>
                      {onStopSession && (
                        <button
                          type="button"
                          aria-label="Liberar estacionamiento"
                          onClick={onStopSession}
                          className="h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Liberar</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Acceso a AniMaps 3D */}
                  <button
                    type="button"
                    aria-label="Ver recorrido animado de ruta en 3D con animaps-react"
                    onClick={() => setViewMode('animaps')}
                    title="Ver recorrido animado con animaps-react"
                    className="h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-[#807DFE]/40 font-sans text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Sparkles className="w-4 h-4 text-[#807DFE] animate-pulse" />
                    <span className="hidden sm:inline">Ruta 3D</span>
                  </button>
                </div>

              </div>

              {/* Barra de información complementaria */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-900 font-sans">
                <div className="flex items-center gap-3">
                  <span className="text-neutral-300">
                    Punto Fijado: <strong className="text-white font-mono">Espacio #{spotNumber || '1042'}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CurrencyDollarIcon size={12} className="text-emerald-400" />
                    $18.00 / hora
                  </span>
                </div>

                {pinnedSpot && (
                  <a
                    href={`https://www.google.com/maps?q=${pinnedSpot.lat},${pinnedSpot.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white flex items-center gap-1 transition font-sans"
                  >
                    <span>Abrir en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* MODO HISTORIAL DE UBICACIONES */
            <div className="space-y-3 font-sans">
              {pinnedLocations.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/40 space-y-2">
                  <Bookmark className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400">
                    No has registrado ninguna ubicación fijada todavía.
                  </p>
                  <button
                    type="button"
                    onClick={handlePinCurrentLocation}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1.5 shadow"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Fijar mi ubicación GPS actual ahora</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {pinnedLocations.map((item) => {
                    const isItemActive = item.status === 'ACTIVA';
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isItemActive 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60 animate-pulse'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {isItemActive ? '● ESTACIONADO AQUÍ' : 'HISTÓRICO'}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {formatDate(item.date)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.name}</span>
                          </h4>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                            <span>{item.address}</span>
                            <span>•</span>
                            <span className="text-neutral-300">Placas: <strong className="text-white">{item.plates}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleFlyToHistoryRecord(item)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition flex items-center gap-1"
                            title="Centrar en el mapa"
                          >
                            <Navigation className="w-3 h-3 text-black" />
                            <span>Ver en Mapa</span>
                          </button>

                          <a
                            href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                            title="Abrir en Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              removePinnedLocation(item.id);
                              sileo.info({
                                title: 'Registro Eliminado',
                                description: 'Ubicación removida de tu bitácora.',
                              });
                            }}
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ParkingMap;
