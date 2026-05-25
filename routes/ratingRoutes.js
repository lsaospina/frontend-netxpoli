const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');

// Middleware para verificar autenticación en API
const requireApiLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Debes iniciar sesión.'
        });
    }
    next();
};

// Enviar/actualizar calificación
router.post('/:movieId', requireApiLogin, RatingController.rate);

// Obtener calificación del usuario para una película
router.get('/:movieId', requireApiLogin, RatingController.getUserRating);

module.exports = router;
