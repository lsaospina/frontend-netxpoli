const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

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
    res.render('login', { title: 'Iniciar Sesión - CineFlix' });
});

// Vista de Registro
router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register', { title: 'Registrarse - CineFlix' });
});

// Vista de Dashboard (protegida)
router.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { 
        title: 'Panel de Control - CineFlix',
        user: req.session.user 
    });
});

// Vista de Catálogo (protegida)
router.get('/catalog', requireLogin, async (req, res) => {
    try {
        const movies = await Movie.getAll();
        const genres = await Movie.getGenres();
        res.render('catalog', {
            title: 'Catálogo de Películas - CineFlix',
            user: req.session.user,
            movies: movies,
            genres: genres
        });
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
