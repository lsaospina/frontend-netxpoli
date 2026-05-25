const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDb } = require('./config/db');
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos y semillas
initDb();

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para procesar datos de formularios y JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    secret: 'cineflix_ultra_secret_key_987654321', // Llave secreta para firmar las cookies de sesión
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // false porque estamos trabajando en local (HTTP)
        maxAge: 1000 * 60 * 60 * 24 // Expira en 24 horas
    }
}));

// Middleware para inyectar datos de usuario en las plantillas EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


// Registrar las rutas
app.use('/', viewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rentals', rentalRoutes);

// Servidor escuchando
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Servidor de CineFlix corriendo en puerto ${PORT}`);
    console.log(` Visita: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
