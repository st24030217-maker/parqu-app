import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Car, 
  ShieldCheck, 
  CheckCircle2,
  RefreshCw,
  Compass,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  List,
  Clock,
  Check,
  Copy
} from 'lucide-react';
import { sileo } from 'sileo';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate } from '../utils/formatters';

// Coordenadas metropolitanas base por defecto (CDMX Paseo de la Reforma / Centro)
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };

export const DiDiParkingMap = ({
  selectedZone,
  onSelectZone,
  onStartSession,
  activeSession,
  className = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const pinnedMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const zoneMarkersRef = useRef({});

  const {
    vehicle,
    pinnedLocations,
    activePinnedLocation,
    registerPinnedLocation,
    removePinnedLocation,
  } = useParking();

  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('locating'); // 'locating' | 'locked' | 'fallback'
  const [zonesWithCoords, setZonesWithCoords] = useState([]);
  const [isCentering, setIsCentering] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState('zones'); // 'zones' | 'history'

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
    return null;
  });

  const [copiedCoords, setCopiedCoords] = useState(false);

  // Mantener referencia al callback para evitar re-suscripciones innecesarias
  const onSelectZoneRef = useRef(onSelectZone);
  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  const selectedZoneIdRef = useRef(selectedZone?.id);
  useEffect(() => {
    selectedZoneIdRef.current = selectedZone?.id;
  }, [selectedZone?.id]);

  // Genera cajones en calles reales adyacentes a la ubicación detectada (tipo DiDi)
  const generateZonesAroundLocation = useCallback((center) => {
    return [
      {
        id: 'Z1',
        name: 'Zona Centro Histórico (Cajón #A-14)',
        shortName: 'Centro Histórico #A-14',
        cajon: '#A-14',
        ratePerHour: 18.00,
        ratePerMin: 0.30,
        lat: center.lat + 0.0016,
        lng: center.lng + 0.0014,
        distanceMeters: 140,
        walkMinutes: 2,
        spotsAvailable: 4,
        tag: 'MÁS CERCANO',
      },
      {
        id: 'Z2',
        name: 'Zona Financiera & Bancaria (Cajón #B-08)',
        shortName: 'Financiera & Bancaria #B-08',
        cajon: '#B-08',
        ratePerHour: 24.00,
        ratePerMin: 0.40,
        lat: center.lat + 0.0028,
        lng: center.lng - 0.0019,
        distanceMeters: 290,
        walkMinutes: 4,
        spotsAvailable: 2,
        tag: 'ALTA DEMANDA',
      },
      {
        id: 'Z3',
        name: 'Distrito Gastronómico & Gourmet (Cajón #C-21)',
        shortName: 'Gastronómico #C-21',
        cajon: '#C-21',
        ratePerHour: 20.00,
        ratePerMin: 0.33,
        lat: center.lat - 0.0019,
        lng: center.lng + 0.0026,
        distanceMeters: 220,
        walkMinutes: 3,
        spotsAvailable: 6,
        tag: 'ZONA VIAL SEGURA',
      },
      {
        id: 'Z4',
        name: 'Zona Hospitalaria & Médica (Cajón #H-02)',
        shortName: 'Hospitalaria #H-02',
        cajon: '#H-02',
        ratePerHour: 14.00,
        ratePerMin: 0.23,
        lat: center.lat - 0.0025,
        lng: center.lng - 0.0018,
        distanceMeters: 360,
        walkMinutes: 5,
        spotsAvailable: 5,
        tag: 'TARIFA ECONÓMICA',
      },
    ];
  }, []);

  // Handler para cuando el usuario hace clic en el mapa para fijar su punto
  const handleMapClickRef = useRef();
  handleMapClickRef.current = (lat, lng) => {
    const newSpot = {
      lat,
      lng,
      name: `Cajón Fijado en Coordenadas (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
      timestamp: new Date().toISOString(),
      isSaved: false,
    };
    setPinnedSpot(newSpot);

    if (onSelectZoneRef.current) {
      onSelectZoneRef.current({
        id: 'CUSTOM_PIN',
        name: newSpot.name,
        cajon: '#PIN',
        ratePerHour: 18.00,
        lat,
        lng,
        distanceMeters: 0,
        walkMinutes: 0,
        spotsAvailable: 1,
        tag: 'UBICACIÓN FIJADA',
      });
    }

    sileo.info({
      title: 'Punto Marcado en el Mapa',
      description: 'Arrastra el marcador o pulsa "Guardar en Registro" para salvar la ubicación.',
    });
  };

  // 1. Inicialización ÚNICA de Leaflet con estilo ESRI Dark (sin API Key)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 16,
      maxZoom: 17,
      minZoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Capa base oscura nocturna (ESRI World Dark Gray - 100% libre y sin API key)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 17,
        attribution: 'Esri &copy; DeLorme, NAVTEQ',
      }
    ).addTo(map);

    // Capa de referencias urbanas y nombres de calles (ESRI World Dark Gray Reference)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 17,
        attribution: '',
      }
    ).addTo(map);

    // Controles de Zoom en esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Listener para fijar ubicación al hacer clic en el mapa
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

  // 2. Detección GPS del Usuario al montar (estilo DiDi: solicita permisos y carga ubicación)
  useEffect(() => {
    const handleLocationFound = (coords, isRealGps) => {
      setUserLocation(coords);
      setGpsStatus(isRealGps ? 'locked' : 'fallback');

      const generated = generateZonesAroundLocation(coords);
      setZonesWithCoords(generated);

      if (onSelectZoneRef.current) {
        const currentId = selectedZoneIdRef.current;
        const matched = generated.find((z) => z.id === currentId) || generated[0];
        onSelectZoneRef.current(matched);
      }

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
  }, [generateZonesAroundLocation]);

  // 3. Marcador del Usuario (Pulsing Beacon azul / cian tipo DiDi)
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
            <div class="text-[10px] text-neutral-500 font-normal">Vehículo Registrado: ${vehicle?.plates || 'XYZ-7842'}</div>
          </div>`
        );
    }
  }, [userLocation, vehicle]);

  // 4. Marcador de la Ubicación FIJADA por el Usuario (Arrastrable e interactivo)
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

    const pinnedPinIcon = L.divIcon({
      className: 'custom-pinned-location-pin',
      html: `
        <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing transform transition-transform hover:scale-105 select-none">
          <!-- Banner Superior Dorado con Placas -->
          <div class="px-3 py-1.5 rounded-2xl bg-amber-400 text-black border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.9)] font-mono text-[10px] font-black flex items-center gap-1.5 whitespace-nowrap animate-bounce">
            <span class="w-2 h-2 rounded-full bg-black animate-ping"></span>
            <span>MI AUTO FIJADO AQUÍ</span>
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
    } else {
      const marker = L.marker([pinnedSpot.lat, pinnedSpot.lng], {
        icon: pinnedPinIcon,
        draggable: true,
        zIndexOffset: 2500,
      }).addTo(map);

      // Evento de arrastre completado
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
          title: 'Posición de Auto Ajustada',
          description: `Nueva coordenada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      });

      pinnedMarkerRef.current = marker;
    }
  }, [pinnedSpot, vehicle]);

  // 5. Marcadores de Cajones de Parquímetro Municipales
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || zonesWithCoords.length === 0) return;

    Object.values(zoneMarkersRef.current).forEach((marker) => marker.remove());
    zoneMarkersRef.current = {};

    zonesWithCoords.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const isActive = activeSession && selectedZone?.id === zone.id;

      const pinIcon = L.divIcon({
        className: 'custom-didi-pin',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer transition-all duration-300 transform ${
            isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105'
          }">
            <div class="px-2.5 py-1 rounded-xl font-mono text-[10px] font-black border shadow-2xl flex items-center gap-1 whitespace-nowrap ${
              isActive
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                : isSelected
                ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                : 'bg-neutral-900/90 text-white border-neutral-700 hover:border-neutral-500'
            }">
              <span>${zone.cajon}</span>
              <span class="opacity-60">•</span>
              <span class="${isSelected ? 'text-neutral-900 font-black' : 'text-emerald-400 font-bold'}">$${zone.ratePerHour}</span>
            </div>

            <div class="w-3 h-3 rotate-45 -mt-1.5 border-r border-b ${
              isActive
                ? 'bg-amber-400 border-amber-300'
                : isSelected
                ? 'bg-white border-white'
                : 'bg-neutral-900 border-neutral-700'
            }"></div>

            <div class="w-4 h-1 rounded-full bg-black/60 blur-[1px] mt-0.5"></div>
          </div>
        `,
        iconSize: [80, 50],
        iconAnchor: [40, 48],
      });

      const marker = L.marker([zone.lat, zone.lng], {
        icon: pinIcon,
        zIndexOffset: isSelected ? 500 : 100,
      })
        .addTo(map)
        .on('click', () => {
          if (onSelectZone) onSelectZone(zone);
        });

      zoneMarkersRef.current[zone.id] = marker;
    });
  }, [zonesWithCoords, selectedZone, activeSession, onSelectZone]);

  // 6. Línea de Ruta tipo DiDi (conecta tu ubicación con el punto seleccionado o fijado)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const targetDestination = pinnedSpot || (selectedZone?.lat ? selectedZone : null);

    if (userLocation && targetDestination && targetDestination.lat && targetDestination.lng) {
      const latlngs = [
        [userLocation.lat, userLocation.lng],
        [targetDestination.lat, targetDestination.lng],
      ];

      routeLineRef.current = L.polyline(latlngs, {
        color: pinnedSpot ? '#f59e0b' : '#60a5fa',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }
  }, [userLocation, selectedZone, pinnedSpot]);

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
    const newSpot = {
      lat: coords.lat,
      lng: coords.lng,
      name: `Ubicación GPS de ${vehicle?.plates || 'Mi Vehículo'}`,
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
      description: 'Tu punto exacto ha sido marcado en el mapa. Puedes guardarlo en tu registro.',
    });
  };

  // Guardar la ubicación fijada en la bitácora / registro persistente
  const handleSavePinnedRecord = () => {
    if (!pinnedSpot) return;

    registerPinnedLocation({
      name: pinnedSpot.name || `Cajón Fijado en Coordenadas`,
      address: pinnedSpot.address,
      lat: pinnedSpot.lat,
      lng: pinnedSpot.lng,
      status: activeSession ? 'ACTIVA' : 'GUARDADA',
      ratePerHour: 18.00,
      notes: `Fijado el ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
    });

    setPinnedSpot((prev) => (prev ? { ...prev, isSaved: true } : null));

    sileo.success({
      title: '¡Ubicación Registrada en Bitácora!',
      description: `Registro guardado exitosamente para el vehículo ${vehicle?.plates || 'XYZ-7842'}.`,
    });

    setActiveTabMode('history');
  };

  // Iniciar estacionamiento directamente en el punto fijado
  const handleStartAtPinnedSpot = () => {
    if (!pinnedSpot) return;
    handleSavePinnedRecord();

    if (onStartSession) {
      onStartSession({
        id: 'PIN_SESSION',
        name: pinnedSpot.name || 'Cajón Fijado en Mapa',
        cajon: '#PIN',
        ratePerHour: 18.00,
        lat: pinnedSpot.lat,
        lng: pinnedSpot.lng,
      });
    }
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

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 16, { duration: 1.0 });
    }

    setActiveTabMode('zones');

    sileo.info({
      title: 'Ubicación Localizada',
      description: `Punto fijado en ${item.name}.`,
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

  const currentZone = selectedZone || zonesWithCoords[0] || {};

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col ${className}`}>
      
      {/* 1. BARRA SUPERIOR FLOTANTE DEL MAPA (Estatus GPS y Telemetría tipo DiDi) */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Badge GPS y Cajones */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 shadow-xl text-xs font-mono pointer-events-auto">
          <span className={`w-2 h-2 rounded-full ${
            gpsStatus === 'locked' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
          }`} />
          <span className="text-white font-bold text-[11px] uppercase tracking-wider">
            {gpsStatus === 'locked' ? 'GPS SATELITAL EN VIVO' : 'MAPA METROPOLITANO'}
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300 text-[10px]">
            {zonesWithCoords.length} Cajones
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-amber-300 font-bold text-[10px]">
            {pinnedLocations.length} Fijadas
          </span>
        </div>

        {/* Indicador de ayuda al usuario */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-[10px] font-mono text-neutral-300 backdrop-blur-md pointer-events-auto shadow-md">
          <span className="text-amber-400">💡</span>
          <span>Haz clic en cualquier calle o pulsa <strong>"Fijar mi Ubicación"</strong></span>
        </div>
      </div>

      {/* 2. BOTONES FLOTANTES LATERALES (Centrar y Fijar Ubicación Rápida) */}
      <div className="absolute top-16 right-3 z-[400] pointer-events-auto flex flex-col gap-2">
        {/* Botón: Fijar Ubicación GPS Actual */}
        <button
          type="button"
          onClick={handlePinCurrentLocation}
          title="Fijar mi ubicación GPS actual aquí"
          className="px-3 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black border-2 border-white backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all font-mono font-black text-xs"
        >
          <MapPin className="w-4 h-4 fill-current text-black" />
          <span className="hidden sm:inline">Fijar mi Ubicación</span>
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

      {/* 3. CARD FLOTANTE DE UBICACIÓN FIJADA ACTIVA (Aparece cuando el usuario fijó un punto) */}
      {pinnedSpot && (
        <div className="absolute bottom-44 sm:bottom-40 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[400] pointer-events-auto p-4 rounded-2xl bg-black/95 border border-neutral-800 backdrop-blur-xl shadow-[0_0_35px_rgba(0,0,0,0.95)] animate-in fade-in slide-in-from-bottom-3 space-y-3 font-mono">
          <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-md">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-300 uppercase tracking-widest font-black block">
                  PUNTO DE ESTACIONAMIENTO FIJADO
                </span>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {pinnedSpot.name}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPinnedSpot(null)}
              className="text-neutral-400 hover:text-white p-1 rounded text-xs transition"
              title="Quitar pin"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span className="text-neutral-400">Coordenadas:</span>
            <button
              type="button"
              onClick={() => handleCopyCoords(pinnedSpot.lat, pinnedSpot.lng)}
              className="flex items-center gap-1 text-amber-300 hover:text-white font-mono transition"
              title="Copiar coordenadas"
            >
              <span>{pinnedSpot.lat.toFixed(5)}, {pinnedSpot.lng.toFixed(5)}</span>
              {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSavePinnedRecord}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                pinnedSpot.isSaved 
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/50' 
                  : 'bg-white hover:bg-neutral-200 text-black shadow-md'
              }`}
            >
              {pinnedSpot.isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{pinnedSpot.isSaved ? 'Registrado' : 'Guardar en Registro'}</span>
            </button>

            {!activeSession && onStartSession && (
              <button
                type="button"
                onClick={handleStartAtPinnedSpot}
                className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Ocupar Aquí</span>
              </button>
            )}

            <a
              href={`https://www.google.com/maps?q=${pinnedSpot.lat},${pinnedSpot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition"
              title="Abrir en Google Maps para navegar a mi auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* 4. CONTENEDOR DEL MAPA LEAFLET */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[360px] sm:h-[420px] md:h-[460px] z-0 bg-neutral-950" 
      />

      {/* 5. BOTTOM SHEET DIDI: PESTAÑAS ENTRE CAJONES Y REGISTRO DE UBICACIONES */}
      <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-neutral-950 via-neutral-950 to-neutral-900/95 border-t border-neutral-800/90 space-y-4">
        
        {/* Toggle de Pestañas: [Cajones Metropolitanos] | [Registro de Ubicaciones Fijadas] */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTabMode('zones')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeTabMode === 'zones'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Cajones Sugeridos ({zonesWithCoords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('history')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeTabMode === 'history'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Registro de Ubicaciones ({pinnedLocations.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
            Vehículo: <strong className="text-white">{vehicle?.plates || 'XYZ-7842'}</strong>
          </span>
        </div>

        {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
        {activeTabMode === 'zones' ? (
          /* MODO CAJONES SUGERIDOS */
          <div className="space-y-3">
            {/* Selector horizontal rápido de zonas tipo DiDi */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {zonesWithCoords.map((zone) => {
                const isSelected = currentZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      if (onSelectZone) onSelectZone(zone);
                      const map = mapInstanceRef.current;
                      if (map && zone.lat && zone.lng) {
                        map.flyTo([zone.lat, zone.lng], 16, { duration: 0.8 });
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-blue-400'}`} />
                    <span>{zone.cajon}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-black text-white' : 'bg-neutral-800 text-emerald-400'
                    }`}>
                      ${zone.ratePerHour}/h
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tarjeta de Información Detallada del Cajón Activo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950/70 border border-blue-500/40 text-[10px] font-mono font-bold text-blue-300">
                    {currentZone.tag || 'CAJÓN DISPONIBLE'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {currentZone.spotsAvailable || 3} libres
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white tracking-tight font-mono">
                  {currentZone.name || 'Zona Metropolitana'}
                </h3>

                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Navigation className="w-3.5 h-3.5 text-blue-400 rotate-45" />
                    a {currentZone.distanceMeters || 150} metros ({currentZone.walkMinutes || 2} min a pie)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CurrencyDollarIcon size={12} className="text-emerald-400" />
                    ${currentZone.ratePerHour || 18}.00 / hora
                  </span>
                </div>
              </div>

              {/* Botón de Acción Principal Tipo DiDi */}
              {!activeSession && onStartSession && (
                <button
                  type="button"
                  onClick={() => onStartSession(currentZone)}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.35)] transition transform active:scale-95 shrink-0"
                >
                  <Car className="w-4 h-4 text-black" />
                  <span>Ocupar Cajón ({currentZone.cajon || '#A-14'})</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* MODO REGISTRO DE UBICACIONES FIJADAS (BITÁCORA) */
          <div className="space-y-3 font-mono">
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
  );
};

export default DiDiParkingMap;
