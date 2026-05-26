const Movie = require('../models/Movie');

class MovieController {
    /**
     * Procesar la creación de una nueva película (solo administradores)
     */
    static async create(req, res) {
        try {
            // Verificar si el usuario ha iniciado sesión y es administrador
            if (!req.session || !req.session.user || req.session.user.tipo_usuario !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado. Se requiere perfil de Administrador.'
                });
            }

            const { titulo, sinopsis, genero, duracion, director, ano, imagen_url, precio_alquiler, stock } = req.body;

            // Validar campos obligatorios
            if (!titulo || !titulo.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El título es un campo obligatorio.'
                });
            }

            if (!genero || !genero.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El género es un campo obligatorio.'
                });
            }

            // Validar tipos numéricos
            const parsedDuracion = parseInt(duracion, 10);
            const parsedAno = parseInt(ano, 10);
            const parsedPrecio = parseFloat(precio_alquiler);
            const parsedStock = parseInt(stock, 10);

            if (isNaN(parsedDuracion) || parsedDuracion <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La duración debe ser un número entero positivo.'
                });
            }

            if (isNaN(parsedAno) || parsedAno < 1888 || parsedAno > new Date().getFullYear() + 10) {
                return res.status(400).json({
                    success: false,
                    message: 'El año de lanzamiento debe ser un año válido.'
                });
            }

            if (isNaN(parsedPrecio) || parsedPrecio < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio de alquiler debe ser un número mayor o igual a 0.'
                });
            }

            if (isNaN(parsedStock) || parsedStock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock disponible debe ser un número mayor o igual a 0.'
                });
            }

            // Usar una imagen predeterminada elegante si no se provee
            const defaultImage = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600';
            const finalImageUrl = (imagen_url && imagen_url.trim()) ? imagen_url.trim() : defaultImage;

            // Crear la película en la BD
            const result = await Movie.create({
                titulo: titulo.trim(),
                sinopsis: sinopsis ? sinopsis.trim() : '',
                genero: genero.trim(),
                duracion: parsedDuracion,
                director: director ? director.trim() : 'Desconocido',
                ano: parsedAno,
                imagen_url: finalImageUrl,
                precio_alquiler: parsedPrecio,
                stock: parsedStock
            });

            return res.status(201).json({
                success: true,
                message: `¡La película "${titulo}" ha sido agregada con éxito!`,
                movieId: result.id
            });

        } catch (error) {
            console.error('Error al agregar película:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al procesar la creación de la película.'
            });
        }
    }
}

module.exports = MovieController;
