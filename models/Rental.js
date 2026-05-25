const { dbRun, dbGet, dbAll } = require('../config/db');

class Rental {
    /**
     * Crear alquileres para un usuario
     * @param {number} userId - ID del usuario
     * @param {Array<number>} movieIds - IDs de las películas
     */
    static async createRentals(userId, movieIds) {
        // Hacemos una transacción secuencial básica
        // Primero verificamos stock y existencia de todas las películas
        for (const movieId of movieIds) {
            const movie = await dbGet('SELECT stock, titulo FROM peliculas WHERE id = ?', [movieId]);
            if (!movie) {
                throw new Error(`La película con ID ${movieId} no existe.`);
            }
            if (movie.stock <= 0) {
                throw new Error(`La película "${movie.titulo}" no cuenta con copias disponibles para alquiler.`);
            }
        }

        // Si todas tienen stock, realizamos el alquiler
        for (const movieId of movieIds) {
            // Decrementar stock
            await dbRun('UPDATE peliculas SET stock = stock - 1 WHERE id = ?', [movieId]);
            
            // Calcular fecha de devolución (7 días a partir de hoy)
            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + 7);
            const returnDateStr = returnDate.toISOString().slice(0, 19).replace('T', ' ');

            // Insertar alquiler
            await dbRun(
                'INSERT INTO alquileres (usuario_id, pelicula_id, fecha_devolucion) VALUES (?, ?, ?)',
                [userId, movieId, returnDateStr]
            );
        }
        return true;
    }

    /**
     * Obtener alquileres de un usuario con detalles de la película
     * @param {number} userId 
     */
    static async getActiveByUser(userId) {
        const sql = `
            SELECT a.id as rental_id, a.fecha_alquiler, a.fecha_devolucion, a.estado,
                   p.id as movie_id, p.titulo, p.genero, p.imagen_url, p.director, p.duracion, p.precio_alquiler
            FROM alquileres a
            JOIN peliculas p ON a.pelicula_id = p.id
            WHERE a.usuario_id = ?
            ORDER BY a.fecha_alquiler DESC
        `;
        return await dbAll(sql, [userId]);
    }

    /**
     * Devolver una película alquilada
     * @param {number} rentalId 
     * @param {number} userId 
     */
    static async returnMovie(rentalId, userId) {
        // Verificar que el alquiler existe y es del usuario
        const rental = await dbGet('SELECT pelicula_id, estado FROM alquileres WHERE id = ? AND usuario_id = ?', [rentalId, userId]);
        if (!rental) {
            throw new Error('Alquiler no encontrado.');
        }
        if (rental.estado === 'devuelto') {
            throw new Error('Esta película ya ha sido devuelta.');
        }

        // Marcar como devuelto
        await dbRun("UPDATE alquileres SET estado = 'devuelto' WHERE id = ?", [rentalId]);
        
        // Incrementar stock de la película
        await dbRun('UPDATE peliculas SET stock = stock + 1 WHERE id = ?', [rental.pelicula_id]);
        return true;
    }
}

module.exports = Rental;
