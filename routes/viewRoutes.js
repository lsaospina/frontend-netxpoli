const express = require('express');
const router = express.Router();

// Middleware para verificar si el usuario ha iniciado sesión
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Middleware para redirigir si ya tiene sesión iniciada (evitar volver a login/registro)
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};

// Ruta raíz
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    return res.redirect('/login');
});

// Vista de Login
router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('login', { title: 'Iniciar Sesión - NetPolix' });
});

// Vista de Registro
router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register', { title: 'Registrarse - NetPolix' });
});

// Vista de Dashboard (protegida)
router.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { 
        title: 'Panel de Control - NetPolix',
        user: req.session.user 
    });
});

module.exports = router;
