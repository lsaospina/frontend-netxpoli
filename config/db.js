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

        // Crear la tabla de películas
        await dbRun(`
            CREATE TABLE IF NOT EXISTS peliculas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                sinopsis TEXT,
                genero TEXT NOT NULL,
                duracion INTEGER,
                director TEXT,
                ano INTEGER,
                imagen_url TEXT,
                precio_alquiler REAL NOT NULL DEFAULT 3.99,
                stock INTEGER NOT NULL DEFAULT 5,
                calificacion REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla "peliculas" verificada/creada.');

        // Migración de esquema: Agregar calificacion si la tabla ya existía
        try {
            await dbRun('ALTER TABLE peliculas ADD COLUMN calificacion REAL DEFAULT 0.0');
            console.log('Columna "calificacion" agregada de forma segura a "peliculas".');
        } catch (err) {
            // El error 'duplicate column name' es normal si la columna ya existía
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                console.log('Mensaje durante verificación de columna "calificacion":', err.message);
            }
        }

        // Crear la tabla de alquileres
        await dbRun(`
            CREATE TABLE IF NOT EXISTS alquileres (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                pelicula_id INTEGER NOT NULL,
                fecha_alquiler DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_devolucion DATETIME NOT NULL,
                estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'devuelto'
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
                FOREIGN KEY(pelicula_id) REFERENCES peliculas(id)
            )
        `);
        console.log('Tabla "alquileres" verificada/creada.');

        // Crear la tabla de calificaciones individuales
        await dbRun(`
            CREATE TABLE IF NOT EXISTS calificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                pelicula_id INTEGER NOT NULL,
                calificacion REAL NOT NULL CHECK(calificacion >= 1 AND calificacion <= 5),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
                FOREIGN KEY(pelicula_id) REFERENCES peliculas(id),
                UNIQUE(usuario_id, pelicula_id)
            )
        `);
        console.log('Tabla "calificaciones" verificada/creada.');


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
                ['admin', 'admin@cine.com', adminPass, 'Carlos', 'Administrador', 'administrador']
            );
            
            await dbRun(
                `INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`,
                ['gerente', 'gerente@cine.com', gerentePass, 'Sofía', 'Gerente', 'gerente']
            );
            
            await dbRun(
                `INSERT INTO usuarios (username, email, password, nombre, apellido, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`,
                ['cliente', 'cliente@cine.com', clientePass, 'Juan', 'Cliente', 'cliente']
            );

            console.log('Usuarios semilla insertados con éxito.');
        }

        // Sembrar películas si la tabla está vacía
        const countPeliculas = await dbGet('SELECT COUNT(*) as count FROM peliculas');
        if (countPeliculas.count === 0) {
            console.log('Tabla de películas vacía. Sembrando catálogo por defecto...');
            const peliculasSemilla = [
                {
                    titulo: 'Inception',
                    sinopsis: 'Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños, se le da la tarea inversa de plantar una idea en la mente de un director ejecutivo.',
                    genero: 'Ciencia Ficción',
                    duracion: 148,
                    director: 'Christopher Nolan',
                    ano: 2010,
                    imagen_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 3.99,
                    stock: 5,
                    calificacion: 4.8
                },
                {
                    titulo: 'Interstellar',
                    sinopsis: 'Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.',
                    genero: 'Ciencia Ficción',
                    duracion: 169,
                    director: 'Christopher Nolan',
                    ano: 2014,
                    imagen_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 4.50,
                    stock: 4,
                    calificacion: 4.9
                },
                {
                    titulo: 'The Matrix',
                    sinopsis: 'Cuando una bella desconocida lleva al hacker Neo a un inframundo prohibido, él descubre la impactante verdad: la vida que conoce es un elaborado engaño de una inteligencia cibernética malvada.',
                    genero: 'Acción',
                    duracion: 136,
                    director: 'Lana Wachowski, Lilly Wachowski',
                    ano: 1999,
                    imagen_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 2.99,
                    stock: 7,
                    calificacion: 4.7
                },
                {
                    titulo: 'Parasite',
                    sinopsis: 'La codicia y la discriminación de clase amenazan la relación recién formada entre la rica familia Park y el clan Kim, que carece de recursos.',
                    genero: 'Drama',
                    duracion: 132,
                    director: 'Bong Joon Ho',
                    ano: 2019,
                    imagen_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 3.99,
                    stock: 3,
                    calificacion: 4.6
                },
                {
                    titulo: 'Spirited Away',
                    sinopsis: 'Durante el viaje de su familia a los suburbios, una niña de 10 años de edad deambula por un mundo gobernado por dioses, brujas y espíritus, y donde los humanos se transforman en bestias.',
                    genero: 'Animación',
                    duracion: 125,
                    director: 'Hayao Miyazaki',
                    ano: 2001,
                    imagen_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 3.50,
                    stock: 6,
                    calificacion: 4.8
                },
                {
                    titulo: 'Pulp Fiction',
                    sinopsis: 'Las vidas de dos gángsters de la mafia, un boxeador, la esposa de un gángster y una pareja de bandidos se entrelazan en cuatro historias de violencia y redención.',
                    genero: 'Crimen',
                    duracion: 154,
                    director: 'Quentin Tarantino',
                    ano: 1994,
                    imagen_url: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=600&auto=format&fit=crop',
                    precio_alquiler: 2.99,
                    stock: 5,
                    calificacion: 4.5
                }
            ];

            for (const p of peliculasSemilla) {
                await dbRun(
                    `INSERT INTO peliculas (titulo, sinopsis, genero, duracion, director, ano, imagen_url, precio_alquiler, stock, calificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.titulo, p.sinopsis, p.genero, p.duracion, p.director, p.ano, p.imagen_url, p.precio_alquiler, p.stock, p.calificacion]
                );
            }
            console.log('Películas semilla insertadas con éxito.');
        }

        // Sembrar alquileres de prueba si la tabla está vacía
        const countAlquileres = await dbGet('SELECT COUNT(*) as count FROM alquileres');
        if (countAlquileres.count === 0) {
            console.log('Tabla de alquileres vacía. Sembrando alquileres semilla...');
            const alquileresSemilla = [
                { usuario_id: 3, pelicula_id: 1, fecha_alquiler: '2026-05-18 10:30:00', fecha_devolucion: '2026-05-25 10:30:00', estado: 'devuelto' },
                { usuario_id: 3, pelicula_id: 1, fecha_alquiler: '2026-05-20 14:15:00', fecha_devolucion: '2026-05-27 14:15:00', estado: 'activo' },
                { usuario_id: 3, pelicula_id: 2, fecha_alquiler: '2026-05-19 16:45:00', fecha_devolucion: '2026-05-26 16:45:00', estado: 'activo' },
                { usuario_id: 3, pelicula_id: 2, fecha_alquiler: '2026-05-22 09:00:00', fecha_devolucion: '2026-05-29 09:00:00', estado: 'activo' },
                { usuario_id: 2, pelicula_id: 2, fecha_alquiler: '2026-05-15 18:20:00', fecha_devolucion: '2026-05-22 18:20:00', estado: 'devuelto' },
                { usuario_id: 3, pelicula_id: 3, fecha_alquiler: '2026-05-21 11:00:00', fecha_devolucion: '2026-05-28 11:00:00', estado: 'activo' },
                { usuario_id: 3, pelicula_id: 4, fecha_alquiler: '2026-05-23 20:30:00', fecha_devolucion: '2026-05-30 20:30:00', estado: 'activo' },
                { usuario_id: 2, pelicula_id: 5, fecha_alquiler: '2026-05-24 15:00:00', fecha_devolucion: '2026-05-31 15:00:00', estado: 'activo' },
                { usuario_id: 3, pelicula_id: 6, fecha_alquiler: '2026-05-17 12:00:00', fecha_devolucion: '2026-05-24 12:00:00', estado: 'devuelto' }
            ];

            for (const a of alquileresSemilla) {
                await dbRun(
                    `INSERT INTO alquileres (usuario_id, pelicula_id, fecha_alquiler, fecha_devolucion, estado) VALUES (?, ?, ?, ?, ?)`,
                    [a.usuario_id, a.pelicula_id, a.fecha_alquiler, a.fecha_devolucion, a.estado]
                );
                
                // Si el alquiler está activo, decrementamos el stock
                if (a.estado === 'activo') {
                    await dbRun('UPDATE peliculas SET stock = stock - 1 WHERE id = ?', [a.pelicula_id]);
                }
            }
            console.log('Alquileres semilla insertados con éxito.');
        }

        // Asegurar que las películas existentes tengan calificaciones asignadas
        const ratingsSemilla = [
            { id: 1, val: 4.8 },
            { id: 2, val: 4.9 },
            { id: 3, val: 4.7 },
            { id: 4, val: 4.6 },
            { id: 5, val: 4.8 },
            { id: 6, val: 4.5 }
        ];
        for (const r of ratingsSemilla) {
            await dbRun('UPDATE peliculas SET calificacion = ? WHERE id = ? AND (calificacion IS NULL OR calificacion = 0.0)', [r.val, r.id]);
        }

        // Sembrar calificaciones individuales de ejemplo
        const countCalificaciones = await dbGet('SELECT COUNT(*) as count FROM calificaciones');
        if (countCalificaciones.count === 0) {
            console.log('Tabla de calificaciones vacía. Sembrando calificaciones semilla...');
            const calificacionesSemilla = [
                { usuario_id: 3, pelicula_id: 1, calificacion: 5 },
                { usuario_id: 3, pelicula_id: 2, calificacion: 5 },
                { usuario_id: 3, pelicula_id: 3, calificacion: 4 },
                { usuario_id: 2, pelicula_id: 1, calificacion: 4 },
                { usuario_id: 2, pelicula_id: 4, calificacion: 5 },
                { usuario_id: 2, pelicula_id: 5, calificacion: 5 },
            ];
            for (const c of calificacionesSemilla) {
                await dbRun(
                    'INSERT INTO calificaciones (usuario_id, pelicula_id, calificacion) VALUES (?, ?, ?)',
                    [c.usuario_id, c.pelicula_id, c.calificacion]
                );
            }
            // Recalcular promedios
            for (const c of calificacionesSemilla) {
                const avg = await dbGet(
                    'SELECT AVG(calificacion) as promedio FROM calificaciones WHERE pelicula_id = ?',
                    [c.pelicula_id]
                );
                if (avg && avg.promedio) {
                    await dbRun('UPDATE peliculas SET calificacion = ? WHERE id = ?', [Math.round(avg.promedio * 10) / 10, c.pelicula_id]);
                }
            }
            console.log('Calificaciones semilla insertadas con éxito.');
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
