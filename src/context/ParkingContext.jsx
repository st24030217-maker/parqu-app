import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateTicketFolio } from '../utils/formatters';

const ParkingContext = createContext();

const STORAGE_KEYS = {
  VEHICLE: 'parkdigital_vehicle',
  OWNER: 'parkdigital_owner',
  CARD: 'parkdigital_card',
  AUTOPAY: 'parkdigital_autopay',
  HISTORY: 'parkdigital_history',
  PINNED_LOCATIONS: 'parkdigital_pinned_locations',
};

const defaultVehicle = {
  plates: 'XYZ-7842',
  brand: 'Volkswagen',
  model: 'Jetta Sportline',
  color: 'Plata Metálico',
  year: '2023',
  type: 'Sedán',
};

const defaultOwner = {
  fullName: 'Sebastián Salinas',
  email: 'sebastian.salinas@email.com',
  phone: '55 4912 3456',
  idNumber: 'INE-78912304',
};

const defaultCard = {
  cardNumber: '4890 •••• •••• 9142',
  validThru: '12/28',
  status: 'ACTIVA', // 'ACTIVA' | 'EN_PARQUIMETRO' | 'BLOQUEADA'
  balance: 320.00,
  rfidTag: 'NFC-MX-09142-PK',
};

const defaultAutoPay = {
  enabled: true,
  fundingSource: 'CARD', // 'CARD' (Débito/Crédito) | 'WALLET_BALANCE' (Saldo monedero)
  cardHolder: 'Sebastián Salinas',
  cardNumber: '•••• •••• •••• 8821',
  bank: 'Santander Platinum Débito',
  maxLimitPerSession: 180.00,
  autoRenew: true,
  smsNotification: true,
  authorizedAt: '2026-01-15',
};

const defaultTransactions = [
  {
    id: 'TXN-901',
    folio: 'PQM-88A2',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    zone: 'Zona Financiera (Cajón #B-04)',
    durationMinutes: 75,
    amount: 25.00,
    method: 'Autocobro Débito Directo (Santander •••• 8821)',
    plate: 'XYZ-7842',
    status: 'COMPLETADO',
  },
  {
    id: 'TXN-902',
    folio: 'PQM-34F1',
    date: new Date(Date.now() - 86400000).toISOString(),
    zone: 'Centro Cultural (Cajón #C-12)',
    durationMinutes: 120,
    amount: 36.00,
    method: 'Autocobro Débito Directo (Santander •••• 8821)',
    plate: 'XYZ-7842',
    status: 'COMPLETADO',
  }
];

const defaultPinnedLocations = [
  {
    id: 'PIN-101',
    name: 'Cajón #A-14 • Centro Histórico',
    address: 'Av. Juárez y Eje Central, Cuauhtémoc',
    lat: 19.4342,
    lng: -99.1318,
    date: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    plates: 'XYZ-7842',
    notes: 'Junto al parquímetro municipal #04',
    status: 'COMPLETADO',
    ratePerHour: 18.00,
  }
];

export const ParkingProvider = ({ children }) => {
  // Inicialización con persistencia ultra-segura en localStorage
  const [vehicle, setVehicle] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.VEHICLE) : null;
      return saved ? JSON.parse(saved) : defaultVehicle;
    } catch {
      return defaultVehicle;
    }
  });

  const [owner, setOwner] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.OWNER) : null;
      return saved ? JSON.parse(saved) : defaultOwner;
    } catch {
      return defaultOwner;
    }
  });

  const [card, setCard] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CARD) : null;
      return saved ? JSON.parse(saved) : defaultCard;
    } catch {
      return defaultCard;
    }
  });

  const [autoPay, setAutoPay] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTOPAY) : null;
      return saved ? JSON.parse(saved) : defaultAutoPay;
    } catch {
      return defaultAutoPay;
    }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.HISTORY) : null;
      return saved ? JSON.parse(saved) : defaultTransactions;
    } catch {
      return defaultTransactions;
    }
  });

  // Bitácora de ubicaciones fijadas por el usuario en el mapa
  const [pinnedLocations, setPinnedLocations] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PINNED_LOCATIONS) : null;
      return saved ? JSON.parse(saved) : defaultPinnedLocations;
    } catch {
      return defaultPinnedLocations;
    }
  });

  // Punto activo fijado en el mapa
  const [activePinnedLocation, setActivePinnedLocation] = useState(null);

  // Estado de sesión activa de estacionamiento (parquímetro metropolitano)
  const [activeSession, setActiveSession] = useState(null);

  // Último recibo generado por el sistema de autocobro
  const [lastReceipt, setLastReceipt] = useState(null);

  // Guardar en localStorage de forma segura ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(vehicle));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [vehicle]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(owner));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [owner]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARD, JSON.stringify(card));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [card]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTOPAY, JSON.stringify(autoPay));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [autoPay]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(transactions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PINNED_LOCATIONS, JSON.stringify(pinnedLocations));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [pinnedLocations]);

  // Actualizadores de Estado
  const updateVehicle = (newVehicleData) => {
    setVehicle((prev) => ({ ...prev, ...newVehicleData }));
  };

  const updateOwner = (newOwnerData) => {
    setOwner((prev) => ({ ...prev, ...newOwnerData }));
  };

  const updateCard = (newCardData) => {
    setCard((prev) => ({ ...prev, ...newCardData }));
  };

  const updateAutoPay = (newAutoPayData) => {
    setAutoPay((prev) => ({ ...prev, ...newAutoPayData }));
  };

  const addBalance = (amount) => {
    setCard((prev) => ({
      ...prev,
      balance: prev.balance + amount,
    }));
  };

  // Temporizador para el parquímetro metropolitano en tiempo real
  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const secondsElapsed = prev.secondsElapsed + 1;
          const ratePerSecond = prev.ratePerHour / 3600;
          const rawCost = secondsElapsed * ratePerSecond;
          const currentCost = Math.min(rawCost, prev.maxLimit);

          return {
            ...prev,
            secondsElapsed,
            currentCost: Number(currentCost.toFixed(2)),
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  // Registrar una nueva ubicación fijada en el mapa
  const registerPinnedLocation = (locationData) => {
    const newRecord = {
      id: 'PIN-' + Date.now(),
      name: locationData.name || 'Ubicación Fijada por Conductor',
      address: locationData.address || `Lat: ${locationData.lat.toFixed(5)}, Lng: ${locationData.lng.toFixed(5)}`,
      lat: locationData.lat,
      lng: locationData.lng,
      date: new Date().toISOString(),
      plates: vehicle.plates,
      notes: locationData.notes || 'Posición fijada en mapa satelital',
      status: locationData.status || 'GUARDADA',
      ratePerHour: locationData.ratePerHour || 18.00,
    };

    setPinnedLocations((prev) => [newRecord, ...prev]);
    setActivePinnedLocation(newRecord);
    return newRecord;
  };

  const removePinnedLocation = (id) => {
    setPinnedLocations((prev) => prev.filter((item) => item.id !== id));
    if (activePinnedLocation?.id === id) {
      setActivePinnedLocation(null);
    }
  };

  const clearPinnedLocations = () => {
    setPinnedLocations([]);
    setActivePinnedLocation(null);
  };

  // Iniciar estancia en cajón de parquímetro con coordenadas de ubicación fijada
  const startParking = (zoneName = 'Zona Centro Histórico (Cajón #A-14)', ratePerHour = 18.00, coords = null) => {
    const newSession = {
      id: 'SESS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      zoneName,
      ratePerHour,
      coords: coords || null,
      startTime: new Date().toISOString(),
      secondsElapsed: 0,
      currentCost: 0.00,
      maxLimit: autoPay.maxLimitPerSession || 180.00,
    };
    setActiveSession(newSession);
    setCard((prev) => ({ ...prev, status: 'EN_PARQUIMETRO' }));

    // Si viene con coordenadas, registrar automáticamente en la bitácora de ubicaciones
    if (coords && coords.lat && coords.lng) {
      const pinRecord = {
        id: 'PIN-' + Date.now(),
        name: zoneName,
        address: `Cajón activo (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        lat: coords.lat,
        lng: coords.lng,
        date: new Date().toISOString(),
        plates: vehicle.plates,
        notes: 'Estacionamiento activo con autocobro en curso',
        status: 'ACTIVA',
        ratePerHour,
      };
      setPinnedLocations((prev) => [pinRecord, ...prev.filter(p => p.status !== 'ACTIVA')]);
      setActivePinnedLocation(pinRecord);
    }
  };

  // Detener y ejecutar autocobro inmediato
  const stopParkingAndAutoCharge = () => {
    if (!activeSession) return null;

    const durationMinutes = Math.max(1, Math.ceil(activeSession.secondsElapsed / 60));
    const finalAmount = Math.max(2.00, activeSession.currentCost);
    const folio = generateTicketFolio();

    const paymentMethodDesc = autoPay.fundingSource === 'CARD'
      ? `Autocobro Débito Directo (${autoPay.bank || 'Tarjeta Registrada'})`
      : 'Autocobro Saldo Tarjeta Digital';

    if (autoPay.fundingSource === 'WALLET_BALANCE') {
      setCard((prev) => ({
        ...prev,
        balance: Math.max(0, prev.balance - finalAmount),
      }));
    }

    const newTxn = {
      id: 'TXN-' + Date.now(),
      folio,
      date: new Date().toISOString(),
      zone: activeSession.zoneName,
      durationMinutes,
      amount: finalAmount,
      method: paymentMethodDesc,
      plate: vehicle.plates,
      status: 'COMPLETADO',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setActiveSession(null);
    setCard((prev) => ({ ...prev, status: 'ACTIVA' }));
    setLastReceipt(newTxn);

    // Marcar ubicación activa fijada como completada en la bitácora
    setPinnedLocations((prev) =>
      prev.map((pin) => (pin.status === 'ACTIVA' ? { ...pin, status: 'COMPLETADO', folio } : pin))
    );
    if (activePinnedLocation) {
      setActivePinnedLocation((prev) => (prev ? { ...prev, status: 'COMPLETADO', folio } : null));
    }

    return newTxn;
  };

  return (
    <ParkingContext.Provider
      value={{
        vehicle,
        updateVehicle,
        owner,
        updateOwner,
        card,
        updateCard,
        autoPay,
        updateAutoPay,
        transactions,
        addBalance,
        activeSession,
        startParking,
        stopParkingAndAutoCharge,
        lastReceipt,
        setLastReceipt,
        pinnedLocations,
        activePinnedLocation,
        setActivePinnedLocation,
        registerPinnedLocation,
        removePinnedLocation,
        clearPinnedLocations,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
