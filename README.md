<h1>🧩 TicketApp – Backend</h1>

<p align="center">
  <a href="https://github.com/valenpeppi/tp" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/🏠%20Repo%20Raíz-Info%20General-4C51BF?style=for-the-badge&logo=github&logoColor=white" alt="Repo Raíz General"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/valenpeppi/BackEnd-Venta-de-Entradas" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/⚙️%20Repo%20Backend-TicketApp-0b7285?style=for-the-badge&logo=github&logoColor=white" alt="Repo Backend"/>
  </a>
  <a href="https://github.com/agussantinelli/FrontEnd-Venta-de-Entradas" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/💻%20Repo%20Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="Repo Frontend"/>
  </a>
  <a href="https://drive.google.com/file/d/1JQ4jZBuJwJ3PSq4Bxjy0-jp5qHoPxyZK/view" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/🗺️%20Modelo%20ER-DER-ff9800?style=for-the-badge&logo=googledrive&logoColor=white" alt="DER TicketApp"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/agussantinelli" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/👤%20Agustín%20Santinelli-agussantinelli-000000?style=for-the-badge&logo=github&logoColor=white" alt="Agus"/>
  </a>
  <a href="https://github.com/martin-ratti" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/👤%20Martín%20Ratti-martin--ratti-000000?style=for-the-badge&logo=github&logoColor=white" alt="Martín"/>
  </a>
  <a href="https://github.com/gianzaba" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/👤%20Gianlucas%20Zabaleta-gianzaba-000000?style=for-the-badge&logo=github&logoColor=white" alt="Gianlucas"/>
  </a>
  <a href="https://github.com/valenpeppi" target="_blank" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/👤%20Valentín%20Peppino-valenpeppi-000000?style=for-the-badge&logo=github&logoColor=white" alt="Valentín"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node Badge"/>
  <img src="https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TS Badge"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma Badge"/>
  <img src="https://img.shields.io/badge/MySQL-DB-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL Badge"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Badge"/>
  <img src="https://img.shields.io/badge/bcrypt-Passwords-35495E?style=for-the-badge" alt="bcrypt Badge"/>
  <img src="https://img.shields.io/badge/Zod-Validation-306998?style=for-the-badge" alt="Zod Badge"/>
  <img src="https://img.shields.io/badge/Multer-Uploads-4a148c?style=for-the-badge" alt="Multer Badge"/>
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe Badge"/>
  <img src="https://img.shields.io/badge/Jest-Tests-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest Badge"/>
  <img src="https://img.shields.io/badge/Supertest-HTTP%20Tests-000000?style=for-the-badge" alt="Supertest Badge"/>
</p>

<hr/>

<h2>🎯 Objetivo y alcance</h2>

<p>
  Este repositorio implementa el <strong>Backend de TicketApp</strong>, una API REST en <strong>Node.js + Express + TypeScript</strong> 
  con <strong>Prisma ORM</strong> sobre <strong>MySQL</strong>, para gestionar:
</p>

<ul>
  <li>Usuarios finales y empresas organizadoras.</li>
  <li>Lugares, sectores y asientos.</li>
  <li>Eventos con flujo de aprobación (Pending → Approved / Rejected).</li>
  <li>Reservas y ventas de tickets (hasta 6 tickets por evento por usuario).</li>
  <li>Procesamiento de pagos con <strong>Stripe</strong>.</li>
  <li>Confirmación de ventas vía webhooks y polling.</li>
  <li>Asistente de IA mediante integración con OpenRouter.</li>
</ul>

<p>
  La API está pensada para ser consumida por el <strong>FrontEnd React</strong> del proyecto 
  <code>FrontEnd-Venta-de-Entradas</code>.
</p>

<hr/>

<h2>🌐 Base URL, autenticación y formato de errores</h2>

<h3>Base URL</h3>

<ul>
  <li>Servidor HTTP (desarrollo): <code>http://localhost:3000</code> (configurable con <code>PORT</code>).</li>
  <li>Prefijo común de la API: <code>/api</code>.</li>
  <li>Archivos estáticos (imágenes de eventos): <code>GET /uploads/&lt;nombre_archivo&gt;</code>.</li>
</ul>

<h3>Autenticación</h3>

<ul>
  <li>Esquema: <strong>JWT Bearer</strong>.</li>
  <li>Header: <code>Authorization: Bearer &lt;token&gt;</code>.</li>
  <li>Login de usuario final: <code>POST /api/auth/login</code>.</li>
  <li>Login de empresa organizadora: <code>POST /api/auth/login-company</code>.</li>
  <li>Registro con reCAPTCHA:
    <ul>
      <li><code>POST /api/auth/register</code> (user).</li>
      <li><code>POST /api/auth/register-company</code> (company).</li>
    </ul>
  </li>
  <li>Middlewares de acceso:
    <ul>
      <li><code>verifyToken</code> – token válido.</li>
      <li><code>isCompany</code> – rol empresa.</li>
      <li><code>isAdmin</code> – rol administrador.</li>
    </ul>
  </li>
</ul>

<h3>Mecanismo BOOT_ID</h3>

<ul>
  <li>Al iniciar el servidor se genera un <strong>BOOT_ID</strong> (UUID).</li>
  <li>El <code>bootId</code> se incluye en todos los JWT emitidos.</li>
  <li>Si el servidor se reinicia, cambia el <code>bootId</code> actual y todos los tokens previos quedan invalidados.</li>
  <li>Respuesta en ese caso:
    <ul>
      <li><code>401</code> con código interno <code>RESTART_INVALIDATED_TOKEN</code>.</li>
    </ul>
  </li>
  <li>Endpoint de chequeo: <code>GET /api/system/boot</code> → <code>{ "bootId": "..." }</code>.</li>
</ul>

<h3>Formato de respuestas y errores</h3>

<ul>
  <li>Éxito:
    <ul>
      <li>Respuestas simples: datos crudos (arrays/objetos).</li>
      <li>Respuestas estructuradas: <code>{ "ok": true, "data": ... }</code>.</li>
    </ul>
  </li>
  <li>Errores:
    <ul>
      <li><code>400</code> – validación / datos faltantes.</li>
      <li><code>401</code> – falta de autenticación.</li>
      <li><code>403</code> – permisos insuficientes.</li>
      <li><code>404</code> – recurso no encontrado.</li>
      <li><code>409</code> – conflictos (ej. duplicados, límites excedidos).</li>
      <li><code>500</code> – error interno.</li>
    </ul>
  </li>
</ul>

<hr/>

<h2>🧱 Stack tecnológico</h2>

<table>
  <thead>
    <tr>
      <th>Componente</th>
      <th>Tecnología</th>
      <th>Versión</th>
      <th>Uso</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Runtime</td>
      <td>Node.js</td>
      <td>18+</td>
      <td>Entorno de ejecución</td>
    </tr>
    <tr>
      <td>Framework</td>
      <td>Express.js</td>
      <td>5.1.0</td>
      <td>Servidor HTTP y routing</td>
    </tr>
    <tr>
      <td>Lenguaje</td>
      <td>TypeScript</td>
      <td>5.9.2</td>
      <td>Tipado estático</td>
    </tr>
    <tr>
      <td>ORM</td>
      <td>Prisma</td>
      <td>6.17.1</td>
      <td>Acceso a MySQL y migraciones</td>
    </tr>
    <tr>
      <td>Base de datos</td>
      <td>MySQL</td>
      <td>-</td>
      <td>Modelo relacional de eventos, lugares y ventas</td>
    </tr>
    <tr>
      <td>Auth</td>
      <td>jsonwebtoken</td>
      <td>9.0.2</td>
      <td>JWT</td>
    </tr>
    <tr>
      <td>Password hashing</td>
      <td>bcryptjs</td>
      <td>3.0.2</td>
      <td>Hasheo de contraseñas</td>
    </tr>
    <tr>
      <td>Pagos</td>
      <td>Stripe</td>
      <td>18.5.0</td>
      <td>Procesamiento internacional</td>
    </tr>
    <tr>
      <td>Uploads</td>
      <td>Multer</td>
      <td>2.0.2</td>
      <td>Imágenes de eventos</td>
    </tr>
    <tr>
      <td>Validación</td>
      <td>Zod</td>
      <td>4.1.12</td>
      <td>Validación de inputs</td>
    </tr>
    <tr>
      <td>Testing</td>
      <td>Jest + Supertest</td>
      <td>30.2.0 / 7.1.4</td>
      <td>Unit e integration tests</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>🏗️ Arquitectura general</h2>

<p>
  El backend sigue una arquitectura en capas sobre Express:
</p>

<ul>
  <li><strong>index.ts</strong> – punto de entrada de la aplicación:
    <ul>
      <li>Carga variables de entorno (<code>dotenv</code>).</li>
      <li>Configura CORS en base a <code>FRONTEND_URL</code>.</li>
      <li>Configura logging (<code>morgan</code>).</li>
      <li>Registra primero las rutas de webhooks Stripe usando <code>express.raw</code> para preservar el body.</li>
      <li>Aplica <code>express.json()</code> y <code>express.urlencoded()</code> luego de los webhooks.</li>
      <li>Expone rutas de dominio (<code>/api/auth</code>, <code>/api/events</code>, <code>/api/sales</code>, etc.).</li>
      <li>Sirve archivos estáticos desde <code>/uploads</code>.</li>
      <li>Tiene un manejador de errores global para capturar excepciones no controladas.</li>
    </ul>
  </li>
  <li><strong>Capas por módulo</strong> (en <code>src/</code>):
    <ul>
      <li><code>*.router.ts</code> – define rutas y middlewares.</li>
      <li><code>*.controller.ts</code> – lógica de negocio y acceso a datos vía Prisma.</li>
      <li><code>*.controller.test.ts</code> – tests unitarios de controladores.</li>
    </ul>
  </li>
</ul>

<hr/>

<h2>🗄️ Modelo de datos (resumen)</h2>

<p>Entidades principales del esquema Prisma:</p>

<table>
  <thead>
    <tr>
      <th>Entidad</th>
      <th>Descripción</th>
      <th>Relaciones clave</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>User</td>
      <td>Usuarios finales, pueden tener rol <code>admin</code>.</td>
      <td>Relación con <code>Sale</code>.</td>
    </tr>
    <tr>
      <td>Organiser</td>
      <td>Empresas organizadoras.</td>
      <td>Crea <code>Event</code>s.</td>
    </tr>
    <tr>
      <td>EventType</td>
      <td>Categoría o tipo de evento (ej: Concierto, Teatro).</td>
      <td>Relación 1:N con <code>Event</code>.</td>
    </tr>
    <tr>
      <td>Event</td>
      <td>Evento particular en un lugar y fecha.</td>
      <td>Belongs to <code>Place</code>, <code>EventType</code>, <code>Organiser</code>.</td>
    </tr>
    <tr>
      <td>Place</td>
      <td>Lugar físico (teatro, estadio, etc.).</td>
      <td>Contiene <code>Sector</code>s, tipo <code>enumerated</code> / <code>nonEnumerated</code> / <code>hybrid</code>.</td>
    </tr>
    <tr>
      <td>Sector</td>
      <td>Sector dentro de un lugar.</td>
      <td>Contiene <code>Seat</code>s.</td>
    </tr>
    <tr>
      <td>Seat</td>
      <td>Butaca individual.</td>
      <td>Belongs to <code>Sector</code>.</td>
    </tr>
    <tr>
      <td>EventSector</td>
      <td>Tabla puente Event–Sector con precio por sector.</td>
      <td>Define pricing por evento/sector.</td>
    </tr>
    <tr>
      <td>SeatEvent</td>
      <td>Estado de cada asiento para un evento.</td>
      <td>Estado: <code>available</code> / <code>reserved</code> / <code>sold</code>.</td>
    </tr>
    <tr>
      <td>Ticket</td>
      <td>Unidad de ticket vendible.</td>
      <td>Relación con <code>Event</code>, <code>Seat</code>, <code>SaleItem</code>.</td>
    </tr>
    <tr>
      <td>Sale</td>
      <td>Venta realizada.</td>
      <td>Contiene <code>SaleItem</code>s.</td>
    </tr>
    <tr>
      <td>SaleItem</td>
      <td>Línea individual de la venta.</td>
      <td>Apunta a <code>Ticket</code> y <code>SeatEvent</code>.</td>
    </tr>
    <tr>
      <td>Message</td>
      <td>Mensajes de contacto y soporte.</td>
      <td>Guarda <code>senderEmail</code> (sin relación FK estricta).</td>
    </tr>
  </tbody>
</table>

<p>
  Al crear un evento se genera automáticamente la grilla <code>SeatEvent</code> y los <code>Ticket</code>s correspondientes
  (vía script de seeding y helpers de creación).
</p>

<hr/>

<h2>📦 Estructura del proyecto</h2>

<pre><code>BackEnd-Venta-de-Entradas/
├── docs/                        # Documentación adicional
├── node_modules/                # Dependencias
├── prisma/
│   ├── migrations/              # Historial de migraciones
│   ├── schema.prisma            # Esquema de la base de datos
│   └── seed.ts                  # Script de población de datos (seeds)
├── src/
│   ├── ai/                      # Integración con IA
│   ├── auth/                    # Autenticación y gestión de usuarios
│   ├── config/                  # Configuraciones globales y variables
│   ├── db/                      # Cliente de base de datos (Prisma)
│   ├── events/                  # Gestión de eventos
│   ├── integration/             # Tests de integración
│   ├── messages/                # Gestión de respuestas y mensajes
│   ├── middlewares/             # Middlewares (auth, errores, validaciones)
│   ├── payments/                # Integraciones de pago (Stripe)
│   ├── places/                  # Gestión de lugares y sectores
│   ├── sales/                   # Lógica de ventas
│   ├── seats/                   # Gestión de butacas
│   ├── security/                # Lógica de seguridad
│   ├── services/                # Servicios externos y utilidades
│   └── system/                  # Endpoints de sistema (health, bootId)
├── uploads/                     # Almacenamiento de imágenes subidas
├── .env                         # Variables de entorno
├── .env.test                    # Variables para testing
├── .gitignore                   # Archivos ignorados por Git
├── debug_sectors.ts             # Script de utilidad para debug
├── index.ts                     # Punto de entrada de la aplicación
├── jest.config.ts               # Configuración de tests (Jest)
├── package-lock.json            # Árbol de dependencias exacto
├── package.json                 # Dependencias y scripts
├── README.md                    # Documentación
├── simulate_purchase.ts         # Script de simulación de compras
└── tsconfig.json                # Configuración de TypeScript
</code></pre>

<hr/>

<h2>⚙️ Endpoints principales (resumen)</h2>

<h3>🩺 Sistema</h3>

<ul>
  <li><code>GET /api/system/boot</code> – devuelve el <code>bootId</code> actual del servidor.</li>
</ul>

<h3>👤 Auth y usuarios</h3>

<ul>
  <li><code>POST /api/auth/register</code> – registro de usuario con reCAPTCHA.</li>
  <li><code>POST /api/auth/register-company</code> – registro de empresa organizadora.</li>
  <li><code>POST /api/auth/login</code> – login usuario final, devuelve <code>token</code> y payload básico.</li>
  <li><code>POST /api/auth/login-company</code> – login de empresa organizadora.</li>
  <li><code>GET /api/auth/validate</code> – valida token y retorna el payload.</li>
  <li><code>GET /api/users/</code> – listado de usuarios (uso interno/tests).</li>
  <li><code>POST /api/users/</code> – alta de usuario sin reCAPTCHA (tests).</li>
</ul>

<h3>📍 Lugares y sectores</h3>

<ul>
  <li><code>GET /api/places/getPlaces</code> – lista de lugares ordenados alfabéticamente.</li>
  <li><code>GET /api/places/:idPlace/sectors</code> – sectores definidos para un lugar.</li>
</ul>

<h3>🎫 Eventos</h3>

<ul>
  <li><code>POST /api/events/createEvent</code>
    <ul>
      <li>Auth: <code>verifyToken</code> + <code>isCompany</code>.</li>
      <li>Body: <code>multipart/form-data</code> con datos del evento, <code>sectors</code> (JSON) e imagen opcional.</li>
      <li>Valida longitudes, existencia de lugar/tipo/organizador y precios por sector.</li>
    </ul>
  </li>
  <li><code>GET /api/events/event-types</code> – lista simple de tipos de evento.</li>
  <li><code>GET /api/events/types</code> – igual que anterior pero envuelto en <code>{ ok, data }</code>.</li>
  <li><code>GET /api/events/pending</code> – eventos pendientes de aprobación (solo admin).</li>
  <li><code>GET /api/events/all</code> – todos los eventos (admin).</li>
  <li><code>PATCH /api/events/:id/approve</code> – pasa a <code>Approved</code> (admin).</li>
  <li><code>PATCH /api/events/:id/reject</code> – pasa a <code>Rejected</code> (admin).</li>
  <li><code>PATCH /api/events/:id/feature</code> – toggle de <code>featured</code> (admin).</li>
  <li><code>GET /api/events/featured</code> – eventos aprobados, destacados, con stock.</li>
  <li><code>GET /api/events/approved</code> – eventos aprobados con disponibilidad.</li>
  <li><code>GET /api/events/available-dates/:idPlace</code> – fechas ocupadas para un lugar.</li>
  <li><code>GET /api/events/events/:id</code> – ficha del evento (minPrice, availableTickets, agotado, imageUrl, etc.).</li>
  <li><code>GET /api/events/events/:id/sectors</code> – sectores del evento con precio y disponibilidad.</li>
  <li><code>GET /api/events/events/:id/sectors/:idSector/seats</code> – estado de asientos del sector.</li>
  <li><code>GET /api/events/events/:id/tickets/map</code> – mapa rápido de disponibilidad (<code>"idPlace-idSector-idSeat": numero</code>).</li>
  <li><code>GET /api/events/search?query=texto</code> – buscador (prefijo en nombre / tipo exacto).</li>
</ul>

<h3>💺 Asientos</h3>

<ul>
  <li><code>GET /api/seats/events/:idEvent/sectors/:idSector/seats</code> – devuelve label y estado por asiento para ese evento/sector.</li>
</ul>

<h3>💰 Ventas</h3>

<ul>
  <li><code>POST /api/sales/confirm</code>
    <ul>
      <li>Confirma una venta y pasa asientos de <code>reserved</code> a <code>sold</code>.</li>
      <li>Body incluye <code>dniClient</code> y lista de tickets/seatEvents.</li>
      <li>Verifica usuario existente, límite de 6 tickets por evento y estado de los asientos.</li>
    </ul>
  </li>
  <li><code>GET /api/sales/my-tickets</code> – tickets del usuario autenticado (para sección “Mis Entradas”).</li>
  <li><code>GET /api/sales/check?dniClient=...</code> – verifica si existe una venta confirmada reciente (usado en <code>/pay/processing</code>).</li>
</ul>

<h3>💳 Pagos – Stripe</h3>

<ul>
  <li><code>POST /api/stripe/checkout</code>
    <ul>
      <li>Crea una sesión de Checkout, reserva asientos y devuelve la URL de Stripe.</li>
      <li>Recibe <code>items</code>, <code>dniClient</code>, <code>customerEmail</code> y grupos de tickets.</li>
    </ul>
  </li>
  <li><code>POST /api/stripe/release</code> – libera reservas manualmente (cancelación, errores).</li>
  <li><code>GET /api/stripe/confirm-session?session_id=...</code> – fuerza confirmación cuando el webhook no llegó.</li>
  <li><code>POST /api/stripe/webhook</code>
    <ul>
      <li>Procesa <code>checkout.session.completed</code>, expirados y fallos.</li>
      <li>Confirma o libera asientos según estado del pago.</li>
    </ul>
  </li>
</ul>

<h3>🤖 IA</h3>

<ul>
  <li><code>POST /api/ai/</code> – proxy que reenvía prompts a OpenRouter (Deepseek/Gemma) y devuelve <code>{ reply }</code>.</li>
</ul>

<hr/>

<h2>🧪 Testing</h2>

<ul>
  <li><strong>Unit tests</strong>
    <ul>
      <li>Prueban controladores de eventos, lugares, etc.</li>
      <li>Prisma client se mockea a nivel de módulo.</li>
      <li>Se corren con:
        <pre><code>npm run test:unit</code></pre>
      </li>
    </ul>
  </li>
  <li><strong>Integration tests</strong>
    <ul>
      <li>Ejecutan requests reales sobre la app con Supertest.</li>
      <li>Verifican respuestas HTTP, flujos básicos y errores.</li>
      <li>Se corren con:
        <pre><code>npm run test:integration</code></pre>
      </li>
    </ul>
  </li>
</ul>

<hr/>

<h2>💳 Stripe – Tarjetas de prueba</h2>

<p>
  Para probar el flujo de pago con Stripe en entorno de desarrollo se utilizan tarjetas de prueba
  (no generan cargos reales). La documentación completa de tarjetas de prueba está en:
</p>

<ul>
  <li>
    <a href="https://docs.stripe.com/testing#international-cards" target="_blank">
      https://docs.stripe.com/testing#international-cards
    </a>
  </li>
</ul>

<p>
  En el proyecto utilizamos principalmente la tarjeta de prueba de <strong>Argentina</strong>:
</p>

<pre><code>Número: 4000 0003 2000 0021
Vencimiento: cualquier fecha futura
CVC: cualquier valor de 3 dígitos
</code></pre>

<p>
  Importante: estas tarjetas <strong>solo funcionan en modo test</strong> y deben usarse únicamente
  en el entorno de desarrollo del proyecto.
</p>

<hr/>

<h2>🧰 Configuración y variables de entorno</h2>

<p>Variables principales requeridas:</p>

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Propósito</th>
      <th>Ejemplo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>DATABASE_URL</code></td>
      <td>Cadena de conexión MySQL</td>
      <td><code>mysql://user:pass@localhost:3306/ticketapp</code></td>
    </tr>
    <tr>
      <td><code>PORT</code></td>
      <td>Puerto del servidor</td>
      <td><code>3000</code></td>
    </tr>
    <tr>
      <td><code>FRONTEND_URL</code></td>
      <td>Origen permitido para CORS</td>
      <td><code>http://localhost:5173</code></td>
    </tr>
    <tr>
      <td><code>JWT_SECRET</code></td>
      <td>Clave para firmar JWT</td>
      <td><code>super-secret-key</code></td>
    </tr>
    <tr>
      <td><code>STRIPE_SECRET_KEY</code></td>
      <td>API key de Stripe</td>
      <td><code>sk_test_...</code></td>
    </tr>
    <tr>
      <td><code>STRIPE_WEBHOOK_SECRET</code></td>
      <td>Secreto del webhook de Stripe</td>
      <td><code>whsec_...</code></td>
    </tr>
    <tr>
      <td><code>OPENROUTER_API_KEY</code></td>
      <td>Clave para el asistente de IA</td>
      <td><code>sk-or-...</code></td>
    </tr>
    <tr>
      <td><code>NODE_ENV</code></td>
      <td>Modo de ejecución</td>
      <td><code>development</code> / <code>production</code> / <code>test</code></td>
    </tr>
  </tbody>
</table>

<hr/>


<h2>🚀 Puesta en marcha</h2>

<h3>1️⃣ Requisitos</h3>

<ul>
  <li>Node.js 18+</li>
  <li>MySQL 8+</li>
  <li>Git</li>
</ul>

<h3>2️⃣ Clonar repositorio</h3>

<pre><code>git clone https://github.com/valenpeppi/BackEnd-Venta-de-Entradas.git
cd BackEnd-Venta-de-Entradas
</code></pre>

<h3>3️⃣ Configurar <code>.env</code></h3>

<pre><code>DATABASE_URL="mysql://root:password@localhost:3306/ticketapp"
PORT=3000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=super-secret-key

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

MERCADOPAGO_ACCESS_TOKEN=

OPENROUTER_API_KEY=
</code></pre>

<h3>4️⃣ Migraciones y seed</h3>

<pre><code>npm install
npx prisma migrate deploy
npx prisma db seed
</code></pre>

<h3>5️⃣ Ejecutar servidor</h3>

<pre><code># Desarrollo (hot reload)
npm run dev

# Producción
npm run build
npm start
</code></pre>

<p>
  La API quedará disponible en <strong>http://localhost:3000/api</strong>.
</p>

<hr/>

<h2>🎥 Video demostrativo</h2>

<p>
  <a href="https://www.youtube.com/watch?si=NOzRUeTZ0B0ZajA8&v=8xIs6wFfBYE&feature=youtu.be" target="_blank">
    ▶️ Ver demo completa de TicketApp (Front + Back) en YouTube
  </a>
</p>

<hr/>

<h2>👥 Equipo</h2>

<ul>
  <li><strong>Agustín Santinelli</strong> –
    <a href="https://github.com/agussantinelli" target="_blank">@agussantinelli</a>
  </li>
  <li><strong>Martín Ratti</strong> –
    <a href="https://github.com/martin-ratti" target="_blank">@martin-ratti</a>
  </li>
  <li><strong>Gianlucas Zabaleta</strong> –
    <a href="https://github.com/gianzaba" target="_blank">@gianzaba</a>
  </li>
  <li><strong>Valentín Peppino</strong> –
    <a href="https://github.com/valenpeppi" target="_blank">@valenpeppi</a>
  </li>
</ul>

<p>
  Proyecto académico desarrollado para <strong>UTN FRRO – cátedra Desarrollo de Software (DSW) 2025</strong>.
</p>

<hr/>

<h2>🤝 Contribuir</h2>

<ol>
  <li>Hacer <strong>fork</strong> del repositorio.</li>
  <li>Crear una rama <code>feature/...</code> o <code>fix/...</code>.</li>
  <li>Aplicar cambios siguiendo la estructura de módulos (auth, events, sales, etc.).</li>
  <li>Agregar tests unitarios / de integración cuando corresponda.</li>
  <li>Abrir un <strong>Pull Request</strong> describiendo el alcance de los cambios.</li>
</ol>

<hr/>

<h2>⚖️ Licencia</h2>

<p>
  La licencia del proyecto se detalla en el archivo <code>LICENSE</code> de este repositorio (si corresponde).
</p>

<p>
  <em>TicketApp – Backend de la plataforma de venta de entradas.</em>
</p>
