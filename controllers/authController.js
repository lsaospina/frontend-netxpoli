const User = require('../models/User');

class AuthController {
    /**
     * Procesar el registro de un nuevo cliente
     */
    static async register(req, res) {
        try {
            const { username, email, password, nombre, apellido } = req.body;

            // Validaciones básicas
            if (!username || !email || !password || !nombre || !apellido) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios.'
                });
            }

            // Validar formato de correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de correo electrónico inválido.'
                });
            }

            // Validar longitud de la contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres.'
                });
            }

            // Verificar si el usuario ya existe
            const usernameExists = await User.usernameExists(username);
            if (usernameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso.'
                });
            }

            // Verificar si el correo ya existe
            const emailExists = await User.emailExists(email);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado.'
                });
            }

            // Crear el usuario con tipo 'cliente' por defecto
            const newUser = await User.create({
                username,
                email,
                password,
                nombre,
                apellido,
                tipo_usuario: 'cliente' // Forzado en el servidor, registro exclusivo para clientes
            });

            // Obtener el usuario completo para iniciar sesión automáticamente
            const user = await User.findById(newUser.id);

            // Iniciar sesión guardando en sesión
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                tipo_usuario: user.tipo_usuario
            };

            return res.status(201).json({
                success: true,
                message: 'Registro exitoso.',
                redirect: '/dashboard'
            });

        } catch (error) {
            console.error('Error en registro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor. Por favor, intente más tarde.'
            });
        }
    }

    /**
     * Procesar el inicio de sesión
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo y contraseña son obligatorios.'
                });
            }

            // Buscar usuario
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo electrónico o contraseña incorrectos.'
                });
            }

            // Verificar contraseña
            const isMatch = await User.verifyPassword(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo electrónico o contraseña incorrectos.'
                });
            }

            // Guardar usuario en la sesión
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                tipo_usuario: user.tipo_usuario // Esto nos permite identificar si es cliente, gerente o administrador
            };

            return res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                redirect: '/dashboard'
            });

        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor. Por favor, intente más tarde.'
            });
        }
    }

    /**
     * Cerrar sesión
     */
    static async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.redirect('/dashboard');
            }
            res.clearCookie('connect.sid'); // Limpiar cookie de sesión
            return res.redirect('/login');
        });
    }
}

module.exports = AuthController;
