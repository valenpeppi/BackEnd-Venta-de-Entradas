
export const getStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
    body {
        font-family: 'Outfit', sans-serif;
        background-color: #0f0f0f;
        color: #e0e0e0;
        margin: 0;
        padding: 0;
    }
    .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .header {
        background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        padding: 30px;
        text-align: center;
    }
    .header h1 {
        margin: 0;
        color: white;
        font-size: 28px;
        letter-spacing: 1px;
    }
    .content {
        padding: 40px;
        text-align: center;
    }
    .content p {
        font-size: 16px;
        line-height: 1.6;
        color: #cccccc;
        margin-bottom: 25px;
    }
    .btn {
        display: inline-block;
        padding: 14px 28px;
        background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        color: white !important;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 16px;
        transition: transform 0.2s;
    }
    .footer {
        background-color: #111;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #777;
    }
    .highlight {
        color: #2575fc;
        font-weight: 600;
    }
    .ticket-card {
        background-color: #252525;
        border-left: 4px solid #6a11cb;
        padding: 15px;
        margin: 10px 0;
        text-align: left;
        border-radius: 4px;
    }
    .ticket-card h3 {
        margin: 0 0 5px;
        color: white;
    }
    .ticket-card p {
        margin: 0;
        font-size: 14px;
        color: #aaa;
    }
`;

export const getWelcomeTemplate = (name: string, isCompany: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
    <style>${getStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a TicketApp!</h1>
        </div>
        <div class="content">
            <p>Hola <span class="highlight">${name}</span>,</p>
            <p>Estamos muy emocionados de tenerte con nosotros. ${isCompany ? 'Ahora podrás gestionar tus eventos y llegar a miles de personas.' : 'Prepárate para descubrir los mejores eventos y vivir experiencias inolvidables.'}</p>
            <p>Tu cuenta ha sido creada exitosamente.</p>
            <a href="${process.env.FRONTEND_URL}/auth/login" class="btn">Iniciar Sesión</a>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} TicketApp. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;

export const getPurchaseConfirmationTemplate = (name: string, tickets: any[]) => `
<!DOCTYPE html>
<html>
<head>
    <style>${getStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Compra Exitosa!</h1>
        </div>
        <div class="content">
            <p>Hola <span class="highlight">${name}</span>,</p>
            <p>Tu compra ha sido procesada correctamente. Aquí están tus entradas:</p>
            
            <div style="text-align: left; margin-bottom: 30px;">
                ${tickets.map(t => `
                    <div class="ticket-card">
                        <h3>${t.event.name}</h3>
                        <p>📍 ${t.event.place.name} | ${t.eventSector.sector.name}</p>
                        <p>📅 ${new Date(t.event.date).toLocaleDateString()} ${new Date(t.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</p>
                        <p>🎟️ Asiento: ${t.idSeat}</p>
                    </div>
                `).join('')}
            </div>

            <p>Presenta este correo o ingresa a la app para ver tus códigos QR.</p>
            <a href="${process.env.FRONTEND_URL}/profile/tickets" class="btn">Ver Mis Entradas</a>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} TicketApp. Disfruta el evento.
        </div>
    </div>
</body>
</html>
`;

export const getRecoveryTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${getStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Recuperar Contraseña</h1>
        </div>
        <div class="content">
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Si no fuiste tú, puedes ignorar este correo. De lo contrario, haz clic en el botón de abajo:</p>
            <a href="${resetLink}" class="btn">Restablecer Contraseña</a>
            <p style="margin-top: 20px; font-size: 12px;">Este enlace expirará en 1 hora.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} TicketApp. Seguridad ante todo.
        </div>
    </div>
</body>
</html>
`;
