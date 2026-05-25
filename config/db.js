const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Envoltura de promesas para operaciones comunes de la base de datos
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Inicializar el esquema y sembrar usuarios iniciales
const initDb = async () => {
    try {
        await dbRun(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                tipo_usuario TEXT NOT NULL, -- 'cliente', 'gerente', 'administrador'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla "usuarios" verificada/creada.');

        // Sembrar usuarios si la base de datos está vacía
        const count = await dbGet('SELECT COUNT(*) as count FROM usuarios');
        if (count.count === 0) {
            console.log('Base de datos vacía. Sembrando usuarios por defecto...');
            
            const salt = await bcrypt.genSalt(10);
            const adminPass = await bcrypt.hash('admin123', salt);
            const gerentePass = await bcrypt.hash('gerente123', salt);
            const clientePass = await bcrypt.hash('cliente123', salt);

            await dbRun(
                `INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`,
                ['admin', 'admin@netpolix.com', adminPass, 'Carlos', 'Administrador', 'administrador']
            );
            
            await dbRun(
                `INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`,
                ['gerente', 'gerente@netpolix.com', gerentePass, 'Sofía', 'Gerente', 'gerente']
            );
            
            await dbRun(
                `INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`,
                ['cliente', 'cliente@netpolix.com', clientePass, 'Juan', 'Cliente', 'cliente']
            );

            console.log('Usuarios semilla insertados con éxito.');
        }
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
};

module.exports = {
    db,
    dbRun,
    dbGet,
    dbAll,
    initDb
};
