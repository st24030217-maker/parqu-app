import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { sileo } from 'sileo';
import { generateTicketFolio } from '../utils/formatters';
import {
  requestParkingNotificationPermission,
  sendParkingExitNotification,
  resetNotificationExitLock,
  subscribeToWebPush,
} from '../utils/parkingNotification';
import {
  publishVehicleStateToCloud,
  subscribeToVehiclePlate,
  DEVICE_INSTANCE_ID,
} from '../utils/cloudSync';
import {
  saveBackupToIndexedDB,
  loadBackupFromIndexedDB,
  saveBackupToCloud,
  restoreBackupFromCloud,
  exportBackupAsJsonFile,
} from '../utils/dataBackup';
import {
  checkXamppDatabaseStatus,
  fetchStateFromXamppDb,
  syncStateToXamppDb,
} from '../utils/xamppDbSync';
import {
  isSupabaseConfigured,
  fetchStateFromSupabase,
  syncStateToSupabase,
} from '../utils/supabaseClient';

const ParkingContext = createContext();

const STORAGE_KEYS = {
  VEHICLE: 'parkdigital_vehicle',
  OWNER: 'parkdigital_owner',
  CARD: 'parkdigital_card',
  AUTOPAY: 'parkdigital_autopay',
  HISTORY: 'parkdigital_history',
  PINNED_LOCATIONS: 'parkdigital_pinned_locations',
  ACTIVE_SESSION: 'parkdigital_active_session',
  INFRACTIONS: 'parkdigital_infractions',
  LAST_INSPECTION: 'parkdigital_last_inspection',
};

const defaultVehicle = {
  plates: 'NUEVO-01',
  brand: 'Marca Vehículo',
  model: 'Modelo',
  color: 'Blanco',
  year: '2025',
  type: 'Sedán',
};

const defaultOwner = {
  fullName: 'Nuevo Conductor',
  email: 'conductor@parqu.app',
  phone: '55 0000 0000',
  idNumber: 'REG-00000001',
};

const defaultCard = {
  cardNumber: '4890 •••• •••• 0001',
  validThru: '12/29',
  status: 'ACTIVA', // 'ACTIVA' | 'EN_PARQUIMETRO' | 'BLOQUEADA'
  balance: 0.00,
  rfidTag: 'NFC-MX-00001-PK',
  designId: 'blue', // 'blue' | 'white' | 'red'
  customLabel: 'PARQU PASS NFC',
  overlayStyle: 'glass', // 'glass' | 'light' | 'minimal'
};

const defaultAutoPay = {
  enabled: true,
  fundingSource: 'CARD', // 'CARD' (Débito/Crédito) | 'WALLET_BALANCE' (Saldo monedero)
  cardHolder: 'Nuevo Conductor',
  cardNumber: '•••• •••• •••• 0000',
  bank: 'Tarjeta de Débito / Crédito',
  maxLimitPerSession: 180.00,
  autoRenew: true,
  smsNotification: true,
  authorizedAt: '2026-01-01',
};

const defaultTransactions = [];

const defaultPinnedLocations = [];

export const ParkingProvider = ({ children }) => {
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

  const [pinnedLocations, setPinnedLocations] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PINNED_LOCATIONS) : null;
      return saved ? JSON.parse(saved) : defaultPinnedLocations;
    } catch {
      return defaultPinnedLocations;
    }
  });

  const [infractions, setInfractions] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.INFRACTIONS) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastInspection, setLastInspection] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LAST_INSPECTION) : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cloudStatus, setCloudStatus] = useState('CONNECTED'); // 'CONNECTED' | 'SYNCING' | 'RECONNECTING' | 'LOCAL_ONLY'
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState(() => new Date().toISOString());

  const [activePinnedLocation, setActivePinnedLocation] = useState(null);

  const [activeSession, setActiveSession] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) : null;
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.startTime) return null;
      const wallSeconds = Math.max(
        Number(parsed.secondsElapsed) || 0,
        Math.floor((Date.now() - new Date(parsed.startTime).getTime()) / 1000)
      );
      const ratePerSecond = (Number(parsed.ratePerHour) || 6.0) / 3600;
      const currentCost = Math.min(wallSeconds * ratePerSecond, Number(parsed.maxLimit) || 180);
      return {
        ...parsed,
        secondsElapsed: wallSeconds,
        currentCost: Number(currentCost.toFixed(2)),
      };
    } catch {
      return null;
    }
  });

  const [lastReceipt, setLastReceipt] = useState(null);

  // Referencia para evitar bucle infinito cuando un cambio proviene de la nube remota
  const isApplyingRemoteUpdateRef = useRef(false);
  const lastRemoteTimestampRef = useRef(0);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INFRACTIONS, JSON.stringify(infractions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [infractions]);

  useEffect(() => {
    try {
      if (lastInspection) {
        localStorage.setItem(STORAGE_KEYS.LAST_INSPECTION, JSON.stringify(lastInspection));
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [lastInspection]);

  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(activeSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [activeSession]);

  // Función central para publicar el estado actual a la nube y a XAMPP MySQL en tiempo real
  const syncNowToCloud = useCallback(
    async (overrides = {}) => {
      if (isApplyingRemoteUpdateRef.current) return;
      const stateToPublish = {
        vehicle: overrides.vehicle !== undefined ? overrides.vehicle : vehicle,
        owner: overrides.owner !== undefined ? overrides.owner : owner,
        card: overrides.card !== undefined ? overrides.card : card,
        autoPay: overrides.autoPay !== undefined ? overrides.autoPay : autoPay,
        pinnedLocations:
          overrides.pinnedLocations !== undefined ? overrides.pinnedLocations : pinnedLocations,
        activeSession:
          overrides.activeSession !== undefined ? overrides.activeSession : activeSession,
        infractions: overrides.infractions !== undefined ? overrides.infractions : infractions,
        lastInspection:
          overrides.lastInspection !== undefined ? overrides.lastInspection : lastInspection,
        transactions:
          overrides.transactions !== undefined ? overrides.transactions : transactions,
      };
      // Sincronizar en paralelo con XAMPP MySQL, Supabase Cloud y Cloud Sync
      syncStateToXamppDb(stateToPublish).catch(() => {});
      if (isSupabaseConfigured()) {
        syncStateToSupabase(stateToPublish).catch(() => {});
      }
      const ok = await publishVehicleStateToCloud(stateToPublish);
      if (ok) {
        setLastCloudSyncAt(new Date().toISOString());
        setCloudStatus('CONNECTED');
      }
    },
    [vehicle, owner, card, autoPay, pinnedLocations, activeSession, infractions, lastInspection, transactions]
  );

  // Sincronización inicial con Supabase Cloud o XAMPP MySQL
  useEffect(() => {
    let active = true;

    // 1. Si Supabase está configurado, sincronizar con la nube
    if (isSupabaseConfigured()) {
      fetchStateFromSupabase(vehicle?.plates || 'NUEVO-01').then((cloudState) => {
        if (!active || !cloudState) return;
        syncStateToSupabase({
          vehicle,
          owner,
          card,
          autoPay,
          activeSession,
          transactions,
          pinnedLocations,
          infractions,
          lastInspection,
        }).catch(() => {});
      });
    }

    // 2. Si XAMPP local está activo, sincronizar con MySQL
    checkXamppDatabaseStatus().then((status) => {
      if (!active || !status?.ok) return;
      fetchStateFromXamppDb(vehicle?.plates || 'NUEVO-01').then((dbState) => {
        if (!active || !dbState) return;
        syncStateToXamppDb({
          vehicle,
          owner,
          card,
          autoPay,
          activeSession,
          transactions,
          pinnedLocations,
          infractions,
          lastInspection,
        }).catch(() => {});
      });
    });

    return () => {
      active = false;
    };
  }, []);

  // Suscripción en vivo a la placa actual para recibir cambios desde otro celular (ej. Inspector NFC o segundo dispositivo)
  useEffect(() => {
    const activePlate = vehicle?.plates || 'XYZ-7842';

    const unsubscribe = subscribeToVehiclePlate(
      activePlate,
      (remoteEnvelope) => {
        if (!remoteEnvelope || remoteEnvelope.deviceId === DEVICE_INSTANCE_ID) return;
        if ((remoteEnvelope.timestamp || 0) <= lastRemoteTimestampRef.current) return;
        lastRemoteTimestampRef.current = remoteEnvelope.timestamp || Date.now();

        isApplyingRemoteUpdateRef.current = true;
        setLastCloudSyncAt(remoteEnvelope.updatedAt || new Date().toISOString());

        // Sincronizar sesión activa si cambió en otro dispositivo
        if (remoteEnvelope.activeSession !== undefined) {
          setActiveSession((prev) => {
            const incoming = remoteEnvelope.activeSession;
            if (!incoming) return null;
            const wallSeconds = incoming.startTime
              ? Math.floor((Date.now() - new Date(incoming.startTime).getTime()) / 1000)
              : incoming.secondsElapsed || 0;
            const ratePerSecond = (Number(incoming.ratePerHour) || 6.0) / 3600;
            return {
              ...incoming,
              secondsElapsed: Math.max(0, wallSeconds),
              currentCost: Number(
                Math.min(wallSeconds * ratePerSecond, Number(incoming.maxLimit) || 180).toFixed(2)
              ),
            };
          });
        }

        // Sincronizar tarjeta y saldo
        if (remoteEnvelope.card) {
          setCard((prev) => ({
            ...prev,
            ...remoteEnvelope.card,
          }));
        }

        // Sincronizar infracciones / multas emitidas por el Agente de Tránsito NFC en otro dispositivo
        if (Array.isArray(remoteEnvelope.infractions)) {
          setInfractions((prev) => {
            if (remoteEnvelope.infractions.length > prev.length) {
              const newest = remoteEnvelope.infractions[0];
              if (newest) {
                sileo.error({
                  title: `Boleta de Infracción Vial (${newest.folio})`,
                  description: `Motivo: ${newest.reason} • Monto: $${Number(newest.amount).toFixed(2)} MXN`,
                });
              }
            }
            return remoteEnvelope.infractions;
          });
        }

        // Sincronizar inspección aprobada por Tránsito
        if (remoteEnvelope.lastInspection) {
          setLastInspection((prev) => {
            if (
              (!prev || prev.id !== remoteEnvelope.lastInspection.id) &&
              remoteEnvelope.lastInspection.result === 'APROBADO'
            ) {
              sileo.success({
                title: 'Verificación NFC Oficial Aprobada',
                description: `Agente ${remoteEnvelope.lastInspection.officerId} verificó tu pago vigente sin infracción.`,
              });
            }
            return remoteEnvelope.lastInspection;
          });
        }

        setTimeout(() => {
          isApplyingRemoteUpdateRef.current = false;
        }, 120);
      },
      (status) => {
        setCloudStatus(status);
      }
    );

    // Publicar estado inicial al conectar la placa
    publishVehicleStateToCloud({
      vehicle,
      owner,
      card,
      activeSession,
      infractions,
      lastInspection,
      transactions,
    }).catch(() => {});

    return () => {
      unsubscribe();
    };
  }, [vehicle?.plates]);

  // Actualizadores de Estado con publicación automática a la nube
  const updateVehicle = (newVehicleData) => {
    setVehicle((prev) => {
      const next = { ...prev, ...newVehicleData };
      syncNowToCloud({ vehicle: next });
      return next;
    });
  };

  const updateOwner = (newOwnerData) => {
    setOwner((prev) => {
      const next = { ...prev, ...newOwnerData };
      syncNowToCloud({ owner: next });
      return next;
    });
  };

  const updateCard = (newCardData) => {
    setCard((prev) => {
      const next = { ...prev, ...newCardData };
      syncNowToCloud({ card: next });
      return next;
    });
  };

  const updateAutoPay = (newAutoPayData) => {
    setAutoPay((prev) => ({ ...prev, ...newAutoPayData }));
  };

  const addBalance = (amount) => {
    setCard((prev) => {
      const next = {
        ...prev,
        balance: prev.balance + amount,
      };
      syncNowToCloud({ card: next });
      return next;
    });
  };

  // Temporizador para el parquímetro metropolitano en tiempo real
  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const wallSeconds = prev.startTime
            ? Math.floor((Date.now() - new Date(prev.startTime).getTime()) / 1000)
            : 0;
          const secondsElapsed = Math.max(prev.secondsElapsed + 1, wallSeconds);
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

  const registerPinnedLocation = (locationData) => {
    const newRecord = {
      id: 'PIN-' + Date.now(),
      name: locationData.name || 'Ubicación Fijada por Conductor',
      address:
        locationData.address ||
        `Lat: ${locationData.lat.toFixed(5)}, Lng: ${locationData.lng.toFixed(5)}`,
      lat: locationData.lat,
      lng: locationData.lng,
      date: new Date().toISOString(),
      plates: vehicle.plates,
      notes: locationData.notes || 'Posición fijada en mapa satelital',
      status: locationData.status || 'GUARDADA',
      ratePerHour: locationData.ratePerHour || 6.00,
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

  // Iniciar estancia en parquímetro y publicar en vivo a la nube
  const startParking = (
    zoneName = 'Espacio #1042 • Centro Histórico',
    ratePerHour = 6.00,
    coords = null,
    initialHours = 1
  ) => {
    const newSession = {
      id: 'SESS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      zoneName,
      ratePerHour,
      coords: coords || null,
      startTime: new Date().toISOString(),
      secondsElapsed: 0,
      currentCost: 0.00,
      scheduledHours: Number(initialHours) || 1,
      maxLimit: autoPay.maxLimitPerSession || 180.00,
    };
    const nextCard = { ...card, status: 'EN_PARQUIMETRO' };
    setActiveSession(newSession);
    setCard(nextCard);
    syncNowToCloud({ activeSession: newSession, card: nextCard });

    if (coords && coords.lat && coords.lng) {
      const pinRecord = {
        id: 'PIN-' + Date.now(),
        name: zoneName,
        address: `Espacio activo (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        lat: coords.lat,
        lng: coords.lng,
        date: new Date().toISOString(),
        plates: vehicle.plates,
        notes: 'Estacionamiento activo con autocobro en curso',
        status: 'ACTIVA',
        ratePerHour,
      };
      setPinnedLocations((prev) => [pinRecord, ...prev.filter((p) => p.status !== 'ACTIVA')]);
      setActivePinnedLocation(pinRecord);
    }

    resetNotificationExitLock();
    requestParkingNotificationPermission()
      .then((perm) => {
        if (perm === 'granted') {
          subscribeToWebPush().catch(() => {});
        }
      })
      .catch(() => {});
  };

  // Aumentar las horas programadas del parquímetro y publicar a la nube
  const addParkingHours = (hoursToAdd = 1) => {
    const extra = Math.max(1, Number(hoursToAdd) || 1);
    setActiveSession((prev) => {
      let updatedSession;
      if (!prev) {
        updatedSession = {
          id: 'SESS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          zoneName: 'Espacio #1042 • Centro Histórico',
          ratePerHour: 6.00,
          coords: null,
          startTime: new Date().toISOString(),
          secondsElapsed: 0,
          currentCost: 0.00,
          scheduledHours: extra,
          maxLimit: autoPay.maxLimitPerSession || 180.00,
        };
        const nextCard = { ...card, status: 'EN_PARQUIMETRO' };
        setCard(nextCard);
        syncNowToCloud({ activeSession: updatedSession, card: nextCard });
        return updatedSession;
      }
      const nextHours = (Number(prev.scheduledHours) || 1) + extra;
      updatedSession = {
        ...prev,
        scheduledHours: nextHours,
      };
      syncNowToCloud({ activeSession: updatedSession });
      return updatedSession;
    });
  };

  // Detener y ejecutar autocobro inmediato y publicar a la nube
  const stopParkingAndAutoCharge = () => {
    if (!activeSession) return null;

    const durationMinutes = Math.max(1, Math.ceil(activeSession.secondsElapsed / 60));
    const finalAmount = Math.max(2.00, activeSession.currentCost);
    const folio = generateTicketFolio();

    const paymentMethodDesc =
      autoPay.fundingSource === 'CARD'
        ? `Autocobro Débito Directo (${autoPay.bank || 'Tarjeta Registrada'})`
        : 'Autocobro Saldo Tarjeta Digital';

    const nextBalance =
      autoPay.fundingSource === 'WALLET_BALANCE'
        ? Math.max(0, card.balance - finalAmount)
        : card.balance;

    const nextCard = {
      ...card,
      balance: nextBalance,
      status: 'ACTIVA',
    };

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

    const nextTransactions = [newTxn, ...transactions];
    setTransactions(nextTransactions);
    setActiveSession(null);
    setCard(nextCard);
    setLastReceipt(newTxn);

    syncNowToCloud({
      activeSession: null,
      card: nextCard,
      transactions: nextTransactions,
    });

    setPinnedLocations((prev) =>
      prev.map((pin) =>
        pin.status === 'ACTIVA' ? { ...pin, status: 'COMPLETADO', folio } : pin
      )
    );
    if (activePinnedLocation) {
      setActivePinnedLocation((prev) => (prev ? { ...prev, status: 'COMPLETADO', folio } : null));
    }

    return newTxn;
  };

  // Emitir multa/infracción vial desde el Modo Inspector Vial NFC (se sincroniza en vivo al conductor)
  const issueInfraction = ({
    targetState = null,
    reason = 'Estacionamiento en zona de parquímetro sin pago activo verificado vía NFC',
    amount = 542.85,
    officerId = 'OFICIAL-TR-084',
    zone = 'Polígono Centro Histórico',
  } = {}) => {
    const folio = 'MUL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newInfraction = {
      id: 'INF-' + Date.now(),
      folio,
      date: new Date().toISOString(),
      plate: targetState?.plates || vehicle.plates,
      reason,
      amount: Number(amount) || 542.85,
      discountAmount: Number(((Number(amount) || 542.85) * 0.5).toFixed(2)),
      officerId,
      zone,
      status: 'PENDIENTE', // 'PENDIENTE' | 'PAGADA'
    };

    const inspectionRecord = {
      id: 'INSP-' + Date.now(),
      date: new Date().toISOString(),
      officerId,
      plate: newInfraction.plate,
      result: 'INFRACCION',
      folio,
    };

    if (
      !targetState ||
      (targetState.plates || '').toUpperCase() === (vehicle.plates || '').toUpperCase()
    ) {
      const nextInfractions = [newInfraction, ...infractions];
      setInfractions(nextInfractions);
      setLastInspection(inspectionRecord);
      syncNowToCloud({
        infractions: nextInfractions,
        lastInspection: inspectionRecord,
      });
    } else {
      // Si el oficial está inspeccionando otra placa remota, publicar directamente a la placa inspeccionada
      const remoteInf = [newInfraction, ...(targetState.infractions || [])];
      publishVehicleStateToCloud({
        ...targetState,
        vehicle: targetState.vehicle || { plates: targetState.plates },
        infractions: remoteInf,
        lastInspection: inspectionRecord,
      });
    }

    return newInfraction;
  };

  // Registrar inspección vial aprobada (Pago vigente en orden)
  const recordInspectionApproval = ({
    targetState = null,
    officerId = 'OFICIAL-TR-084',
    notes = 'Pago de parquímetro vigente verificado por chip NFC',
  } = {}) => {
    const inspectionRecord = {
      id: 'INSP-' + Date.now(),
      date: new Date().toISOString(),
      officerId,
      plate: targetState?.plates || vehicle.plates,
      result: 'APROBADO',
      notes,
    };

    if (
      !targetState ||
      (targetState.plates || '').toUpperCase() === (vehicle.plates || '').toUpperCase()
    ) {
      setLastInspection(inspectionRecord);
      syncNowToCloud({ lastInspection: inspectionRecord });
    } else {
      publishVehicleStateToCloud({
        ...targetState,
        vehicle: targetState.vehicle || { plates: targetState.plates },
        lastInspection: inspectionRecord,
      });
    }

    return inspectionRecord;
  };

  // Pagar una multa/infracción con 50% de descuento por pronto pago en línea
  const payInfraction = (infractionId) => {
    const target = infractions.find((inf) => inf.id === infractionId);
    if (!target || target.status === 'PAGADA') return null;

    const finalPayAmount = target.discountAmount || Number((target.amount * 0.5).toFixed(2));
    const nextInfractions = infractions.map((inf) =>
      inf.id === infractionId
        ? { ...inf, status: 'PAGADA', paidAt: new Date().toISOString() }
        : inf
    );

    const nextCard = {
      ...card,
      balance: Math.max(0, card.balance - finalPayAmount),
    };

    const newTxn = {
      id: 'TXN-' + Date.now(),
      folio: target.folio,
      date: new Date().toISOString(),
      zone: `Pago Infracción Vial (${target.zone})`,
      durationMinutes: 0,
      amount: finalPayAmount,
      method: 'Pago de Multa con 50% Descuento Pronto Pago',
      plate: vehicle.plates,
      status: 'COMPLETADO',
    };

    const nextTransactions = [newTxn, ...transactions];
    setInfractions(nextInfractions);
    setCard(nextCard);
    setTransactions(nextTransactions);

    syncNowToCloud({
      infractions: nextInfractions,
      card: nextCard,
      transactions: nextTransactions,
    });

    return newTxn;
  };

  const [lastBackupAt, setLastBackupAt] = useState(() => {
    try {
      return localStorage.getItem('parkdigital_last_backup_at') || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  });

  // Auto-recuperación desde la bóveda IndexedDB si localStorage fue limpiado
  useEffect(() => {
    let mounted = true;
    const hasLocalOwner =
      typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.OWNER);
    const hasLocalCard =
      typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.CARD);

    if (!hasLocalOwner || !hasLocalCard) {
      loadBackupFromIndexedDB().then((vaultBackup) => {
        if (!mounted || !vaultBackup) return;
        if (vaultBackup.vehicle) setVehicle(vaultBackup.vehicle);
        if (vaultBackup.owner) setOwner(vaultBackup.owner);
        if (vaultBackup.card) setCard(vaultBackup.card);
        if (vaultBackup.autoPay) setAutoPay(vaultBackup.autoPay);
        if (Array.isArray(vaultBackup.transactions)) setTransactions(vaultBackup.transactions);
        if (Array.isArray(vaultBackup.pinnedLocations))
          setPinnedLocations(vaultBackup.pinnedLocations);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-respaldo continuo en IndexedDB cada vez que cambian los datos del usuario
  useEffect(() => {
    const nowIso = new Date().toISOString();
    const snapshot = {
      _type: 'PARQU_FULL_BACKUP_V2',
      version: '2.0',
      savedAt: nowIso,
      timestamp: Date.now(),
      vehicle,
      owner,
      card,
      autoPay,
      transactions,
      pinnedLocations,
      activeSession,
    };
    saveBackupToIndexedDB(snapshot).then((ok) => {
      if (ok) {
        setLastBackupAt(nowIso);
        try {
          localStorage.setItem('parkdigital_last_backup_at', nowIso);
        } catch {
          // ignore
        }
      }
    });
  }, [vehicle, owner, card, autoPay, transactions, pinnedLocations, activeSession]);

  // Ejecutar respaldo completo en la nube + IndexedDB bajo demanda o al guardar formularios
  const performCloudBackup = useCallback(async () => {
    const snap = await saveBackupToCloud({
      vehicle,
      owner,
      card,
      autoPay,
      transactions,
      pinnedLocations,
      activeSession,
    });
    if (snap?.savedAt) {
      setLastBackupAt(snap.savedAt);
      try {
        localStorage.setItem('parkdigital_last_backup_at', snap.savedAt);
      } catch {
        // ignore
      }
    }
    return snap;
  }, [vehicle, owner, card, autoPay, transactions, pinnedLocations, activeSession]);

  // Restaurar respaldo desde un objeto JSON (de la nube o de archivo importado)
  const applyBackupSnapshot = useCallback((backupObj) => {
    if (!backupObj || typeof backupObj !== 'object') return false;
    if (backupObj.vehicle) setVehicle((prev) => ({ ...prev, ...backupObj.vehicle }));
    if (backupObj.owner) setOwner((prev) => ({ ...prev, ...backupObj.owner }));
    if (backupObj.card) setCard((prev) => ({ ...prev, ...backupObj.card }));
    if (backupObj.autoPay) setAutoPay((prev) => ({ ...prev, ...backupObj.autoPay }));
    if (Array.isArray(backupObj.transactions)) setTransactions(backupObj.transactions);
    if (Array.isArray(backupObj.pinnedLocations)) setPinnedLocations(backupObj.pinnedLocations);
    const nowIso = new Date().toISOString();
    setLastBackupAt(nowIso);
    return true;
  }, []);

  const restoreFromCloudBackup = useCallback(
    async (identifier) => {
      const lookupKey = identifier || owner?.email || vehicle?.plates || 'XYZ-7842';
      const snap = await restoreBackupFromCloud(lookupKey);
      if (snap) {
        applyBackupSnapshot(snap);
        return snap;
      }
      return null;
    },
    [owner?.email, vehicle?.plates, applyBackupSnapshot]
  );

  const exportBackupFile = useCallback(() => {
    return exportBackupAsJsonFile({
      vehicle,
      owner,
      card,
      autoPay,
      transactions,
      pinnedLocations,
      activeSession,
    });
  }, [vehicle, owner, card, autoPay, transactions, pinnedLocations, activeSession]);

  const resetAllDataToClean = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.VEHICLE);
    localStorage.removeItem(STORAGE_KEYS.OWNER);
    localStorage.removeItem(STORAGE_KEYS.CARD);
    localStorage.removeItem(STORAGE_KEYS.AUTOPAY);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PINNED_LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.INFRACTIONS);
    localStorage.removeItem(STORAGE_KEYS.LAST_INSPECTION);
    setVehicle(defaultVehicle);
    setOwner(defaultOwner);
    setCard(defaultCard);
    setAutoPay(defaultAutoPay);
    setTransactions([]);
    setPinnedLocations([]);
    setActiveSession(null);
    setInfractions([]);
    setLastInspection(null);
    setActivePinnedLocation(null);
    setLastReceipt(null);
    syncNowToCloud({
      vehicle: defaultVehicle,
      owner: defaultOwner,
      card: defaultCard,
      autoPay: defaultAutoPay,
      transactions: [],
      pinnedLocations: [],
      activeSession: null,
      infractions: [],
      lastInspection: null,
    });
    sileo.success({
      title: 'Sistema Restablecido',
      description: 'Saldo en $0.00 y base de datos limpia para nuevos ingresos.',
    });
  }, [syncNowToCloud]);

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
        addParkingHours,
        stopParkingAndAutoCharge,
        lastReceipt,
        setLastReceipt,
        pinnedLocations,
        activePinnedLocation,
        setActivePinnedLocation,
        registerPinnedLocation,
        removePinnedLocation,
        clearPinnedLocations,
        infractions,
        lastInspection,
        issueInfraction,
        recordInspectionApproval,
        payInfraction,
        cloudStatus,
        lastCloudSyncAt,
        syncNowToCloud,
        lastBackupAt,
        performCloudBackup,
        restoreFromCloudBackup,
        exportBackupFile,
        applyBackupSnapshot,
        resetAllDataToClean,
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
