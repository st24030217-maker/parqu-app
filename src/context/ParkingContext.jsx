import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateTicketFolio } from '../utils/formatters';

const ParkingContext = createContext();

const STORAGE_KEYS = {
  VEHICLE: 'parkdigital_vehicle',
  OWNER: 'parkdigital_owner',
  CARD: 'parkdigital_card',
  AUTOPAY: 'parkdigital_autopay',
  HISTORY: 'parkdigital_history',
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

export const ParkingProvider = ({ children }) => {
  // Inicialización con persistencia en localStorage
  const [vehicle, setVehicle] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VEHICLE);
    return saved ? JSON.parse(saved) : defaultVehicle;
  });

  const [owner, setOwner] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OWNER);
    return saved ? JSON.parse(saved) : defaultOwner;
  });

  const [card, setCard] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARD);
    return saved ? JSON.parse(saved) : defaultCard;
  });

  const [autoPay, setAutoPay] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTOPAY);
    return saved ? JSON.parse(saved) : defaultAutoPay;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved
      ? JSON.parse(saved)
      : [
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
  });

  // Estado del parquímetro activo
  const [activeSession, setActiveSession] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Sincronización en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(vehicle));
  }, [vehicle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(owner));
  }, [owner]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARD, JSON.stringify(card));
  }, [card]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTOPAY, JSON.stringify(autoPay));
  }, [autoPay]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(transactions));
  }, [transactions]);

  // Manejo del temporizador cuando el parquímetro está activo
  useEffect(() => {
    let interval = null;
    if (activeSession && activeSession.status === 'RUNNING') {
      interval = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const nextSeconds = prev.secondsElapsed + 1;
          // Cálculo proporcional por minuto con tarifa base
          // Ejemplo: $18.00 / hora = $0.30 por minuto
          const ratePerMinute = prev.ratePerHour / 60;
          const minutesElapsed = Math.ceil(nextSeconds / 60);
          const computedCost = Math.max(prev.ratePerHour * 0.25, +(minutesElapsed * ratePerMinute).toFixed(2));
          
          return {
            ...prev,
            secondsElapsed: nextSeconds,
            currentCost: Math.min(computedCost, prev.maxLimit),
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  // Acciones
  const updateVehicle = (newVehicleData) => {
    setVehicle((prev) => ({ ...prev, ...newVehicleData }));
  };

  const updateOwner = (newOwnerData) => {
    setOwner((prev) => ({ ...prev, ...newOwnerData }));
  };

  const updateAutoPay = (newAutoPayData) => {
    setAutoPay((prev) => ({ ...prev, ...newAutoPayData }));
  };

  const addBalance = (amount) => {
    setCard((prev) => ({ ...prev, balance: prev.balance + amount }));
  };

  // Iniciar sesión de parquímetro
  const startParking = (zoneName = 'Zona Centro Histórico (Cajón #A-18)', ratePerHour = 18.00) => {
    const session = {
      id: 'SESS-' + Date.now(),
      startTime: new Date().toISOString(),
      zoneName,
      ratePerHour,
      secondsElapsed: 0,
      currentCost: +(ratePerHour * 0.25).toFixed(2), // Mínimo 15 minutos
      maxLimit: autoPay.maxLimitPerSession || 200,
      status: 'RUNNING',
    };
    setActiveSession(session);
    setCard((prev) => ({ ...prev, status: 'EN_PARQUIMETRO' }));
  };

  // Finalizar sesión y ejecutar autocobro
  const stopParkingAndAutoCharge = () => {
    if (!activeSession) return null;

    const durationMinutes = Math.max(1, Math.ceil(activeSession.secondsElapsed / 60));
    const finalAmount = activeSession.currentCost;

    // Procesar método de cobro
    let chargeMethodDescription = '';
    if (autoPay.fundingSource === 'WALLET_BALANCE') {
      chargeMethodDescription = 'Saldo de Tarjeta Digital';
      setCard((prev) => ({
        ...prev,
        balance: Math.max(0, +(prev.balance - finalAmount).toFixed(2)),
        status: 'ACTIVA',
      }));
    } else {
      chargeMethodDescription = `Autocobro Domiciliado (${autoPay.bank || 'Tarjeta Registrada'})`;
      setCard((prev) => ({ ...prev, status: 'ACTIVA' }));
    }

    const folio = generateTicketFolio();
    const newTxn = {
      id: 'TXN-' + Date.now(),
      folio,
      date: new Date().toISOString(),
      zone: activeSession.zoneName,
      durationMinutes,
      amount: finalAmount,
      method: chargeMethodDescription,
      plate: vehicle.plates,
      status: 'COMPLETADO',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setLastReceipt(newTxn);
    setActiveSession(null);

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
        addBalance,
        autoPay,
        updateAutoPay,
        activeSession,
        startParking,
        stopParkingAndAutoCharge,
        transactions,
        lastReceipt,
        setLastReceipt,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => useContext(ParkingContext);
