const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movieController');

// Middleware para verificar que el usuario sea administrador en el API
const requireApiAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Debes iniciar sesión.'
        });
    }
    if (req.session.user.tipo_usuario !== 'administrador') {
        return res.status(403).json({
            success: false,
            message: 'No autorizado. Se requiere perfil de Administrador.'
        });
    }
    next();
};

// Ruta para agregar una nueva película
router.post('/', requireApiAdmin, MovieController.create);

module.exports = router;
