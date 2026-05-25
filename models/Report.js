const { dbAll, dbGet } = require('../config/db');

class Report {
    /**
     * Obtener las películas más alquiladas del catálogo
     * con su conteo total, ingresos generados y última fecha de alquiler
     */
    static async getMostRented(limit = 10) {
        const sql = `
            SELECT
                p.id,
                p.titulo,
                p.genero,
                p.imagen_url,
                p.precio_alquiler,
                p.stock,
                COUNT(a.id) AS total_alquileres,
                SUM(p.precio_alquiler) AS ingresos_generados,
                MAX(a.fecha_alquiler) AS ultimo_alquiler
            FROM peliculas p
            LEFT JOIN alquileres a ON a.pelicula_id = p.id
            GROUP BY p.id
            ORDER BY total_alquileres DESC, ingresos_generados DESC
            LIMIT ?
        `;
        return await dbAll(sql, [limit]);
    }

    /**
     * Obtener resumen general de estadísticas del sistema
     */
    static async getSummary() {
        const totalAlquileres = await dbGet(`SELECT COUNT(*) as total FROM alquileres`);
        const alquileresActivos = await dbGet(`SELECT COUNT(*) as total FROM alquileres WHERE estado = 'activo'`);
        const totalIngresos = await dbGet(`
            SELECT COALESCE(SUM(p.precio_alquiler), 0) as total
            FROM alquileres a
            JOIN peliculas p ON a.pelicula_id = p.id
        `);
        const totalClientes = await dbGet(`SELECT COUNT(*) as total FROM usuarios WHERE tipo_usuario = 'cliente'`);
        const peliculaTop = await dbGet(`
            SELECT p.titulo, COUNT(a.id) as total
            FROM alquileres a
            JOIN peliculas p ON a.pelicula_id = p.id
            GROUP BY p.id
            ORDER BY total DESC
            LIMIT 1
        `);

        return {
            totalAlquileres: totalAlquileres.total,
            alquileresActivos: alquileresActivos.total,
            totalIngresos: totalIngresos.total,
            totalClientes: totalClientes.total,
            peliculaTop: peliculaTop ? peliculaTop.titulo : 'N/A'
        };
    }

    /**
     * Obtener alquileres agrupados por género (para gráfica de distribución)
     */
    static async getRentalsByGenre() {
        const sql = `
            SELECT
                p.genero,
                COUNT(a.id) as total_alquileres
            FROM alquileres a
            JOIN peliculas p ON a.pelicula_id = p.id
            GROUP BY p.genero
            ORDER BY total_alquileres DESC
        `;
        return await dbAll(sql);
    }
}

module.exports = Report;
