const bcrypt = require('bcryptjs');
const { dbRun, dbGet } = require('../config/db');

class User {
    /**
     * Crear un nuevo usuario en la base de datos
     * @param {Object} userData - Datos del usuario a registrar
     * @returns {Promise<Object>} - El ID del usuario insertado
     */
    static async create({ username, email, password, nombre, apellido, tipo_usuario = 'cliente', referido_por = null }) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `
            INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario, referido_por)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            username.trim().toLowerCase(),
            email.trim().toLowerCase(),
            hashedPassword,
            nombre.trim(),
            apellido.trim(),
            tipo_usuario,
            referido_por ? referido_por.trim().toLowerCase() : null
        ];

        const result = await dbRun(sql, params);
        return { id: result.id };
    }

    /**
     * Obtener el número de amigos referidos por un usuario
     * @param {string} username 
     * @returns {Promise<number>}
     */
    static async getReferredCount(username) {
        const sql = 'SELECT COUNT(*) as count FROM usuarios WHERE referido_por = ?';
        const row = await dbGet(sql, [username.trim().toLowerCase()]);
        return row ? row.count : 0;
    }

    /**
     * Buscar un usuario por su correo electrónico
     * @param {string} email 
     * @returns {Promise<Object|null>}
     */
    static async findByEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        const user = await dbGet(sql, [email.trim().toLowerCase()]);
        return user || null;
    }

    /**
     * Buscar un usuario por su ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        const sql = 'SELECT id, username, email, nombre, apellido, tipo_usuario, created_at FROM usuarios WHERE id = ?';
        const user = await dbGet(sql, [id]);
        return user || null;
    }

    /**
     * Verificar si un nombre de usuario ya existe
     * @param {string} username 
     * @returns {Promise<boolean>}
     */
    static async usernameExists(username) {
        const sql = 'SELECT id FROM usuarios WHERE username = ?';
        const user = await dbGet(sql, [username.trim().toLowerCase()]);
        return !!user;
    }

    /**
     * Verificar si un correo electrónico ya existe
     * @param {string} email 
     * @returns {Promise<boolean>}
     */
    static async emailExists(email) {
        const sql = 'SELECT id FROM usuarios WHERE email = ?';
        const user = await dbGet(sql, [email.trim().toLowerCase()]);
        return !!user;
    }

    /**
     * Comparar contraseña en texto plano con la encriptada
     * @param {string} plainPassword 
     * @param {string} hashedPassword 
     * @returns {Promise<boolean>}
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;
