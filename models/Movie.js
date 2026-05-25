const { dbRun, dbGet, dbAll } = require('../config/db');

class Movie {
    /**
     * Obtener todas las películas del catálogo
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const sql = 'SELECT * FROM peliculas ORDER BY titulo ASC';
        return await dbAll(sql);
    }

    /**
     * Buscar una película por su ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        const sql = 'SELECT * FROM peliculas WHERE id = ?';
        const movie = await dbGet(sql, [id]);
        return movie || null;
    }

    /**
     * Obtener todos los géneros únicos disponibles en el catálogo
     * @returns {Promise<Array<string>>}
     */
    static async getGenres() {
        const sql = 'SELECT DISTINCT genero FROM peliculas ORDER BY genero ASC';
        const rows = await dbAll(sql);
        return rows.map(row => row.genero);
    }

    /**
     * Agregar una nueva película
     * @param {Object} movieData 
     * @returns {Promise<Object>}
     */
    static async create({ titulo, sinopsis, genero, duracion, director, ano, imagen_url, precio_alquiler = 3.99, stock = 5 }) {
        const sql = `
            INSERT INTO peliculas (titulo, sinopsis, genero, duracion, director, ano, imagen_url, precio_alquiler, stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            titulo.trim(),
            sinopsis ? sinopsis.trim() : '',
            genero.trim(),
            duracion,
            director ? director.trim() : '',
            ano,
            imagen_url ? imagen_url.trim() : '',
            precio_alquiler,
            stock
        ];

        const result = await dbRun(sql, params);
        return { id: result.id };
    }
}

module.exports = Movie;
