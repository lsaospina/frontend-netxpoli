const express = require('express');
const router = express.Router();
const RentalController = require('../controllers/rentalController');

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

// Rutas de API para alquileres
router.post('/', requireApiLogin, RentalController.create);
router.post('/:id/return', requireApiLogin, RentalController.returnRental);

module.exports = router;
