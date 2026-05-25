const Rental = require('../models/Rental');

class RentalController {
    /**
     * Procesar la creación de alquileres (checkout del carrito)
     */
    static async create(req, res) {
        try {
            // Verificar si el usuario ha iniciado sesión
            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes iniciar sesión para realizar un alquiler.'
                });
            }

            const { movieIds } = req.body;

            if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay películas en la solicitud de alquiler.'
                });
            }

            const userId = req.session.user.id;

            // Intentar crear los alquileres
            await Rental.createRentals(userId, movieIds);

            return res.status(201).json({
                success: true,
                message: '¡Alquiler realizado con éxito!',
                redirect: '/rentals'
            });

        } catch (error) {
            console.error('Error al realizar alquiler:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar el alquiler.'
            });
        }
    }

    /**
     * Procesar la devolución de un alquiler
     */
    static async returnRental(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado.'
                });
            }

            const rentalId = parseInt(req.params.id, 10);
            const userId = req.session.user.id;

            if (isNaN(rentalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de alquiler inválido.'
                });
            }

            await Rental.returnMovie(rentalId, userId);

            return res.status(200).json({
                success: true,
                message: 'La película ha sido devuelta con éxito.'
            });

        } catch (error) {
            console.error('Error al devolver película:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar la devolución.'
            });
        }
    }
}

module.exports = RentalController;
