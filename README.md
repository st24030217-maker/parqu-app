# 🅿️ Parquímetro Digital & Tarjeta Virtual Inteligente con Autocobro

Aplicación web moderna para la gestión inteligente de estacionamientos y parquímetros digitales, eliminando la necesidad de boletos físicos y monedas mediante una **Tarjeta Digital Virtual (ParkPass)** y un sistema de **Autocobro Domiciliado**.

---

## ✨ Características Principales

1. **🪪 Tarjeta Digital Holográfica**:
   - Muestra en relieve las placas del coche, modelo, titular y número de identificación.
   - Sensor NFC/RFID virtual y chip EMV digital.
   - Código QR oficial para escaneo e inspección por agentes de vialidad.
   - Estatus en tiempo real (*Activa* o *En Estacionamiento*).

2. **⚡ Formato de Configuración para Autocobro**:
   - Domiciliación a tarjeta bancaria (débito/crédito) o débito del monedero digital.
   - Tope máximo de seguridad por sesión de estacionamiento.
   - Notificaciones automáticas por SMS/Push.
   - Autorización legal expresa vinculada a la placa del vehículo.

3. **⏱️ Parquímetro Metropolitano en Tiempo Real**:
   - Zonas de estacionamiento (Centro Histórico, Zona Financiera, Distrito Gastronómico, Zona Médica) con tarifas diferenciadas.
   - Cronómetro segundo a segundo con cálculo de costo en vivo.
   - Autocobro automatizado al liberar el cajón.

4. **🧾 Comprobantes Oficiales e Historial**:
   - Folio único por sesión, desglose de tiempo y costo.
   - Ticket digital con sello QR listo para imprimir o guardar.

---

## 🛠️ Tecnologías Utilizadas

- **React 18**
- **Vite**
- **Tailwind CSS**
- **Lucide React** (Iconografía)
- **Local Storage** (Persistencia local)

---

## 🚀 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/st24030217-maker/parqu-app.git

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador: `http://localhost:3000`
