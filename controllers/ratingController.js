const Rating = require('../models/Rating');
const Movie = require('../models/Movie');

class RatingController {
    /**
     * Enviar o actualizar calificación de una película
     */
    static async rate(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes iniciar sesión para calificar.'
                });
            }

            const movieId = parseInt(req.params.movieId, 10);
            const { rating } = req.body;

            if (isNaN(movieId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de película inválido.'
                });
            }

            const ratingValue = parseFloat(rating);
            if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'La calificación debe ser un número entre 1 y 5.'
                });
            }

            // Verificar que la película existe
            const movie = await Movie.findById(movieId);
            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Película no encontrada.'
                });
            }

            const result = await Rating.upsert(req.session.user.id, movieId, ratingValue);

            return res.status(200).json({
                success: true,
                message: '¡Calificación registrada con éxito!',
                data: result
            });

        } catch (error) {
            console.error('Error al calificar película:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar la calificación.'
            });
        }
    }

    /**
     * Obtener la calificación del usuario para una película
     */
    static async getUserRating(req, res) {
        try {
            if (!req.session || !req.session.user) {
                return res.status(401).json({ success: false, message: 'No autorizado.' });
            }

            const movieId = parseInt(req.params.movieId, 10);
            if (isNaN(movieId)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const userRating = await Rating.getUserRating(req.session.user.id, movieId);
            const stats = await Rating.getMovieStats(movieId);

            return res.status(200).json({
                success: true,
                data: {
                    calificacion_usuario: userRating,
                    promedio: stats.promedio,
                    total: stats.total
                }
            });
        } catch (error) {
            console.error('Error al obtener calificación:', error);
            return res.status(500).json({ success: false, message: 'Error interno.' });
        }
    }
}

module.exports = RatingController;
