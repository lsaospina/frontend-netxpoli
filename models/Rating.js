const { dbRun, dbGet, dbAll } = require('../config/db');

class Rating {
    /**
     * Crear o actualizar la calificación de un usuario para una película
     * @param {number} userId
     * @param {number} movieId
     * @param {number} rating - Calificación entre 1 y 5
     */
    static async upsert(userId, movieId, rating) {
        // Validar rango
        if (rating < 1 || rating > 5) {
            throw new Error('La calificación debe estar entre 1 y 5.');
        }

        // Verificar si ya existe
        const existing = await dbGet(
            'SELECT id FROM calificaciones WHERE usuario_id = ? AND pelicula_id = ?',
            [userId, movieId]
        );

        if (existing) {
            await dbRun(
                'UPDATE calificaciones SET calificacion = ? WHERE usuario_id = ? AND pelicula_id = ?',
                [rating, userId, movieId]
            );
        } else {
            await dbRun(
                'INSERT INTO calificaciones (usuario_id, pelicula_id, calificacion) VALUES (?, ?, ?)',
                [userId, movieId, rating]
            );
        }

        // Recalcular promedio de la película
        const avg = await dbGet(
            'SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM calificaciones WHERE pelicula_id = ?',
            [movieId]
        );

        const newAvg = avg && avg.promedio ? Math.round(avg.promedio * 10) / 10 : 0;
        await dbRun('UPDATE peliculas SET calificacion = ? WHERE id = ?', [newAvg, movieId]);

        return {
            promedio: newAvg,
            total: avg ? avg.total : 0,
            calificacion_usuario: rating
        };
    }

    /**
     * Obtener la calificación de un usuario para una película específica
     */
    static async getUserRating(userId, movieId) {
        const row = await dbGet(
            'SELECT calificacion FROM calificaciones WHERE usuario_id = ? AND pelicula_id = ?',
            [userId, movieId]
        );
        return row ? row.calificacion : null;
    }

    /**
     * Obtener todas las calificaciones del usuario (para múltiples películas)
     */
    static async getUserRatingsMap(userId) {
        const rows = await dbAll(
            'SELECT pelicula_id, calificacion FROM calificaciones WHERE usuario_id = ?',
            [userId]
        );
        const map = {};
        rows.forEach(r => { map[r.pelicula_id] = r.calificacion; });
        return map;
    }

    /**
     * Obtener estadísticas de calificación para una película
     */
    static async getMovieStats(movieId) {
        const stats = await dbGet(
            'SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM calificaciones WHERE pelicula_id = ?',
            [movieId]
        );
        return {
            promedio: stats && stats.promedio ? Math.round(stats.promedio * 10) / 10 : 0,
            total: stats ? stats.total : 0
        };
    }
}

module.exports = Rating;
