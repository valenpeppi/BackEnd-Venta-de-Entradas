# API Backend Venta de Entradas

Documentacion funcional de la API expuesta por el backend Express + Prisma.

## Base URL y conceptos globales

- Servidor HTTP: `http://localhost:3000` (puerto configurable via `PORT`).
- Prefijo comun de la API: `/api`.
- Archivos estaticos (imagenes de eventos): `GET /uploads/<nombre_archivo>`.

### Autenticacion

- Se utiliza JWT con esquema `Authorization: Bearer <token>`.
- Los tokens de usuarios finales se obtienen en `POST /api/auth/login`.
- Los tokens de empresas organizadoras se obtienen en `POST /api/auth/login-company`.
- Endpoints protegidos agregan `verifyToken`; algunos requieren ademas `isCompany` o `isAdmin`.
- Los tokens incluyen un `bootId`. Si el servidor se reinicia y cambia el `bootId`, los tokens previos quedan invalidados (respuesta `401` con codigo `RESTART_INVALIDATED_TOKEN`).

### Formato de respuestas y errores

- Controladores publicos suelen devolver `200` con datos crudos o `{ ok: true, data: ... }`.
- Errores controlados incluyen un mensaje en castellano y, en algunos casos, `details`.
- Errores de validacion usan `400`, falta de autenticacion `401`, falta de permisos `403`, no encontrado `404`, conflictos `409`, error interno `500`.

## Sistema

### GET `/api/system/boot`
- **Descripcion:** expone el identificador de arranque actual del backend.
- **Auth:** no requiere.
- **Respuesta 200:**
  ```json
  { "bootId": "uuid-o-similar" }
  ```

## Autenticacion y usuarios

### POST `/api/auth/register`
- **Descripcion:** alta de usuario final con verificacion reCAPTCHA.
- **Auth:** no requiere.
- **Body (JSON):**
  ```json
  {
    "dni": 12345678,
    "name": "Juan",
    "surname": "Perez",
    "mail": "juan@example.com",
    "password": "Secreta123",
    "birthDate": "2000-01-31",
    "captchaToken": "<token_recaptcha_v2>"
  }
  ```
- **Respuestas:**
  - `201` registro exitoso (`{ "message": "Usuario registrado correctamente." }`).
  - `400` campos faltantes o DNI invalido / CAPTCHA invalido.
  - `409` DNI o email repetido.

### POST `/api/auth/register-company`
- **Descripcion:** alta de empresa organizadora con reCAPTCHA.
- **Body (JSON):**
  ```json
  {
    "companyName": "Eventos SRL",
    "cuil": "30-12345678-9",
    "contactEmail": "contacto@eventos.com",
    "password": "Clave123",
    "phone": "1122334455",
    "address": "Av. Siempre Viva 123",
    "captchaToken": "<token_recaptcha_v2>"
  }
  ```
- **Respuestas:** `201` exito, `400` faltante, `409` CUIL o email repetido.

### POST `/api/auth/login`
- **Descripcion:** login de usuario final.
- **Body:** `{ "mail": "juan@example.com", "password": "Secreta123" }`.
- **Respuesta 200:**
  ```json
  {
    "token": "<jwt>",
    "user": {
      "dni": 12345678,
      "mail": "juan@example.com",
      "name": "Juan",
      "role": "user"
    }
  }
  ```
- **Errores:** `400` faltan credenciales, `401` credenciales invalidas.

### POST `/api/auth/login-company`
- **Descripcion:** login de empresas organizadoras.
- **Body:** `{ "contactEmail": "contacto@eventos.com", "password": "Clave123" }`.
- **Respuesta 200:** token y datos basicos de la empresa.

### GET `/api/auth/validate`
- **Descripcion:** valida un token vigente y devuelve el payload.
- **Auth:** requiere `Authorization` con JWT valido.
- **Respuesta 200:** `{ "valid": true, "user": { ...payload } }`.
- **Errores:** `401` token faltante o `403` token invalido/expirado.

### GET `/api/users/`
- **Descripcion:** lista completa de usuarios (pensado para uso interno/admin).
- **Auth:** no protegida en el router actual.
- **Respuesta 200:** array de registros de la tabla `user`.

### POST `/api/users/`
- **Descripcion:** crea un usuario sin reCAPTCHA (utilizado por herramientas internas o tests).
- **Body:** debe incluir `dni`, `name`, `surname`, `mail`, `birthDate`, `password`.
- **Respuestas:** `201` con `message` e `userId`, `400` campos faltantes, `409` duplicado (codigo Prisma `P2002`), `500` error interno.

## Lugares y sectores

### GET `/api/places/getPlaces`
- **Descripcion:** devuelve lugares ordenados alfabeticamente.
- **Auth:** no requiere.
- **Respuesta 200:** array de objetos `place`.

### GET `/api/places/:idPlace/sectors`
- **Descripcion:** sectores definidos para un lugar (con campos crudos de la tabla `sector`).
- **Auth:** no requiere.
- **Respuesta 200:** array de sectores.


## Eventos

### POST `/api/events/createEvent`
- **Descripcion:** crea un evento nuevo (solo empresas).
- **Auth:** requiere `verifyToken` + `isCompany`.
- **Body:** `multipart/form-data` con:
  - Campos de texto: `name`, `description`, `date` (ISO o formato parseable por JS), `idEventType`, `idPlace`.
  - `sectors`: cadena JSON con formato `[{ "idSector": 1, "price": 1500.0 }]`.
  - `image` (opcional): archivo JPG/PNG/GIF/WEBP <= 5 MB.
- **Validaciones destacadas:** longitud maxima de nombre (45) y descripcion (255), fecha valida, existencia de organizador/tipo de evento/lugar, al menos un sector con precio.
- **Respuesta 201:**
  ```json
  {
    "ok": true,
    "message": "Evento creado exitosamente",
    "data": {
      "idEvent": 10,
      "name": "Show",
      "state": "Pending",
      "image": "/uploads/event-...png",
      "imageUrl": "http://localhost:3000/uploads/event-...png",
      "...": "otros campos del evento"
    },
    "availableSeats": 120
  }
  ```
- **Errores:** `400` validacion, `403` token no autorizado o sin rol company, `500` errores al guardar o generar asientos.

### GET `/api/events/event-types`
- **Descripcion:** lista simple de tipos de evento.
- **Auth:** publica.
- **Respuesta 200:** array crudo de `eventType`.

### GET `/api/events/types`
- **Descripcion:** lista de tipos de evento con envoltura `{ ok, data }`.
- **Auth:** publica.

### GET `/api/events/pending`
- **Descripcion:** eventos pendientes de aprobacion para pantalla de admin.
- **Auth:** requiere token de usuario con rol `admin`.
- **Respuesta 200:** `{ "ok": true, "data": [ { ...evento, "imageUrl": "..."} ] }`.

### GET `/api/events/all`
- **Descripcion:** todos los eventos (cualquier estado) para admin.
- **Auth:** requiere `admin`.

### PATCH `/api/events/:id/approve`
- **Descripcion:** marca un evento como `Approved`.
- **Auth:** requiere `admin`.
- **Respuesta 200:** `{ "ok": true, "data": { "idEvent": 1, "state": "Approved", "imageUrl": "..." } }`.

### PATCH `/api/events/:id/reject`
- **Descripcion:** marca un evento como `Rejected`.
- **Auth:** requiere `admin`.

### PATCH `/api/events/:id/feature`
- **Descripcion:** alterna el flag `featured` del evento.
- **Auth:** requiere `admin`.
- **Respuesta 200:** `{ "ok": true, "data": { "idEvent": 1, "featured": true } }`.

### GET `/api/events/featured`
- **Descripcion:** eventos aprobados y destacados.
- **Auth:** publica.
- **Respuesta 200:** `{ "ok": true, "data": [ { "availableSeats": 50, "minPrice": 1500, "agotado": false, ... } ] }`.

### GET `/api/events/approved`
- **Descripcion:** eventos aprobados con stock disponible.
- **Auth:** publica.
- **Respuesta 200:** `{ "ok": true, "data": [ ... ] }` (se filtran los agotados).

### GET `/api/events/available-dates/:idPlace`
- **Descripcion:** fechas ocupadas (Approved o Pending) para un lugar.
- **Respuesta 200:** `{ "ok": true, "data": ["2025-10-20", "2025-10-21"] }`.

### GET `/api/events/events/:id`
- **Descripcion:** resumen para la ficha del evento.
- **Respuesta 200:** 
  ```json
  {
    "ok": true,
    "data": {
      "id": 5,
      "eventName": "Show",
      "description": "...",
      "type": "Recital",
      "date": "2025-11-20T23:00:00.000Z",
      "placeName": "...",
      "placeType": "enumerated",
      "availableTickets": 80,
      "agotado": false,
      "imageUrl": "http://localhost:3000/uploads/...",
      "minPrice": 2500
    }
  }
  ```

### GET `/api/events/events/:id/sectors`
- **Descripcion:** sectores del evento con precio y disponibilidad.
- **Respuesta 200:** `{ "ok": true, "data": [ { "idSector": 1, "name": "...", "price": 3500, "enumerated": true, "availableTickets": 20 } ] }`.

### GET `/api/events/events/:id/sectors/:idSector/seats`
- **Descripcion:** estados de los asientos del sector respecto del evento.
- **Respuesta 200:** `{ "ok": true, "data": [ { "id": 12, "state": "available", "label": "12" } ] }`.

### GET `/api/events/events/:id/tickets/map`
- **Descripcion:** mapa de asientos disponibles para key rapida (`"<idPlace>-<idSector>-<idSeat>"`).
- **Respuesta 200:** `{ "ok": true, "data": { "1-2-15": 15, "1-2-16": 16 } }`.

### GET `/api/events/search?query=texto`
- **Descripcion:** buscador (prefijo en nombre del evento o match exacto en tipo).
- **Respuesta 200:** `{ "ok": true, "data": [ { "id": 5, "name": "...", "price": 2500, "availableSeats": 30, "agotado": false } ] }`.
- **Errores:** `400` consulta demasiado corta.

## Asientos

### GET `/api/seats/events/:idEvent/sectors/:idSector/seats`
- **Descripcion:** fuente secundaria para obtener asientos del evento/sector (incluye label real si existe).
- **Respuesta 200:**
  ```json
  {
    "data": [
      { "id": 1, "label": "Fila A Asiento 1", "state": "available" }
    ]
  }
  ```

## Ventas

### POST `/api/sales/confirm`
- **Descripcion:** confirma una venta y pasa asientos `reserved` a `sold`. Se usa internamente por los flujos de pago (no requiere token).
- **Body (JSON):**
  ```json
  {
    "dniClient": 12345678,
    "tickets": [
      {
        "idEvent": 5,
        "idPlace": 2,
        "idSector": 1,
        "ids": [101, 102]
      }
    ]
  }
  ```
- **Reglas:** verifica existencia del usuario, limite de 6 tickets por evento (sumando compras previas), requiere que los asientos sigan en estado `reserved`.
- **Respuesta 201:** `{ "message": "Venta confirmada", "idSale": 987 }`.
- **Errores:** `400` datos faltantes o excede limite, `404` usuario inexistente, `500` error al confirmar.

### GET `/api/sales/my-tickets`
- **Descripcion:** devuelve tickets vendidos al usuario autenticado.
- **Auth:** requiere token de usuario (el DNI se toma del JWT).
- **Respuesta 200:** `{ "data": [ { "id": "5-1", "eventId": 5, "sectorType": "enumerated", "seatNumber": 101, ... } ] }`.

### GET `/api/sales/check?dniClient=12345678`
- **Descripcion:** verifica si existe una venta confirmada para ese DNI en los ultimos 5 minutos (se usa tras checkout).
- **Respuesta 200:** `{ "confirmed": true, "idSale": 987 }` o `{ "confirmed": false }`.
- **Errores:** `400` DNI invalido.

## Pagos - Stripe

Las rutas de Stripe no exigen autenticacion porque son consumidas por el frontend tras un flujo de seleccion controlado.

### POST `/api/stripe/checkout`
- **Descripcion:** crea una sesion de Checkout y reserva asientos.
- **Body (JSON):**
  ```json
  {
    "items": [
      { "name": "Entrada VIP", "amount": 350000, "quantity": 2 }
    ],
    "dniClient": 12345678,
    "customerEmail": "comprador@example.com",
    "ticketGroups": [
      {
        "idEvent": 5,
        "idPlace": 2,
        "idSector": 1,
        "ids": [101, 102]
      }
    ]
  }
  ```
  - `amount` esta expresado en centavos (ARS * 100).
  - Para sectores `nonEnumerated` se debe enviar `quantity`; los IDs se asignan automaticamente.
- **Respuesta 200:** `{ "url": "https://checkout.stripe.com/c/session..." }`.
- **Errores comunes:** `400` datos incompletos o asientos ya no disponibles, `500` error general.

### POST `/api/stripe/release`
- **Descripcion:** libera manualmente reservas (por ejemplo tras cancelar el flujo).
- **Body:** `{ "ticketGroups": [ { "idEvent": 5, "idPlace": 2, "idSector": 1, "ids": [101, 102] } ] }`.
- **Respuesta 200:** `{ "released": 2 }`.

### GET `/api/stripe/confirm-session?session_id=...`
- **Descripcion:** fuerza la confirmacion de venta si el webhook no llego.
- **Respuesta 200:** `{ "confirmed": true }` o `409` si el pago aun no esta `paid`.

### POST `/api/stripe/webhook`
- **Descripcion:** endpoint para webhooks de Stripe (montado como `/api/stripe/webhook/`).
- **Headers:** requiere `Stripe-Signature`.
- **Body:** JSON puro (Express usa `express.raw`).
- **Eventos manejados:**
  - `checkout.session.completed` / `...async_payment_succeeded`: confirma la venta.
  - `checkout.session.expired`, `...async_payment_failed`, `payment_intent.payment_failed`: libera asientos.
- **Proteccion:** rate limit 60 req/min.

## Pagos - MercadoPago 

### POST `/api/mp/checkout`
- **Descripcion:** crea una preferencia de pago y reserva asientos.
- **Precondicion:** variables `FRONTEND_URL`, `BACKEND_URL`, `MP_ACCESS_TOKEN` deben estar configuradas.
- **Body:** mismo contrato que Stripe (`items`, `dniClient`, `customerEmail`, `ticketGroups`).
- **Respuesta 200:** `{ "preferenceId": "...", "init_point": "https://www.mercadopago.com/..." }`.

### GET `/api/mp/confirm-payment?payment_id=...`
- **Descripcion:** consulta el pago en MP y, si esta aprobado, confirma la venta.
- **Respuesta 200:** `{ "confirmed": true }` o `409` si el pago aun no se aprobo.

### POST `/api/mp/webhook`
- **Descripcion:** webhook de notificacion de MP (montado como `/api/mp/webhook/`).
- **Flujo:** responde `200` inmediatamente; luego consulta la API de MP y, segun `status`, confirma o libera tickets.

## IA

### POST `/api/ai/`
- **Descripcion:** proxy que reenvia prompts a OpenRouter (Deepseek/Gemma).
- **Body:** `{ "message": "texto libre" }`.
- **Respuesta 200:** `{ "reply": "respuesta del modelo" }`.
- **Errores:** `400` sin mensaje, `504` timeout en ambos modelos.

## Notas adicionales

- Los asientos se generan automaticamente al crear eventos (`createSeatEventGridForEvent`).
- Las rutas protegidas deben invocarse con el JWT mas reciente si el backend fue reiniciado (ver `/api/system/boot`).
- `uploads/` se genera automaticamente si no existe al subir imagenes de eventos.
