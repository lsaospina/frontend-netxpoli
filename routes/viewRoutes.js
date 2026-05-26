const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Rental = require('../models/Rental');
const Report = require('../models/Report');
const Rating = require('../models/Rating');
const User = require('../models/User');


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
    const ref = req.query.ref || '';
    res.render('register', { 
        title: 'Registrarse - NetPolix',
        ref: ref 
    });
});

// Vista de Dashboard (protegida)
router.get('/dashboard', requireLogin, async (req, res) => {
    try {
        let referredCount = 0;
        if (req.session.user && req.session.user.tipo_usuario === 'cliente') {
            referredCount = await User.getReferredCount(req.session.user.username);
        }
        res.render('dashboard', { 
            title: 'Panel de Control - NetPolix',
            user: req.session.user,
            referredCount: referredCount
        });
    } catch (error) {
        console.error('Error al cargar panel de control:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Vista de Catálogo (protegida)
router.get('/catalog', requireLogin, async (req, res) => {
    try {
        const movies = await Movie.getAll();
        const genres = await Movie.getGenres();
        
        // Obtener calificaciones del usuario actual
        let userRatings = {};
        if (req.session.user) {
            userRatings = await Rating.getUserRatingsMap(req.session.user.id);
        }
        
        res.render('catalog', {
            title: 'Catálogo de Películas - NetPolix',
            user: req.session.user,
            movies: movies,
            genres: genres,
            userRatings: userRatings
        });
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Vista de Mis Alquileres (protegida)
router.get('/rentals', requireLogin, async (req, res) => {
    try {
        const rentals = await Rental.getActiveByUser(req.session.user.id);
        res.render('rentals', {
            title: 'Mis Alquileres - NetPolix',
            user: req.session.user,
            rentals: rentals
        });
    } catch (error) {
        console.error('Error al cargar alquileres:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Vista de Reportes (solo gerente y administrador)
const requireManager = (req, res, next) => {
    if (!req.session || !req.session.user) return res.redirect('/login');
    if (!['gerente', 'administrador'].includes(req.session.user.tipo_usuario)) {
        return res.redirect('/dashboard');
    }
    next();
};

router.get('/reports', requireManager, async (req, res) => {
    try {
        const [topMovies, bestRatedMovies, summary, byGenre] = await Promise.all([
            Report.getMostRented(10),
            Report.getBestRated(10),
            Report.getSummary(),
            Report.getRentalsByGenre()
        ]);
        res.render('reports', {
            title: 'Reportes - NetPolix',
            user: req.session.user,
            topMovies,
            bestRatedMovies,
            summary,
            byGenre
        });
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
