/**
 * NetPolix - Funcionalidad del Cliente
 * Control de formularios AJAX, validación y notificaciones Toast
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar contenedores de notificaciones
    initToastContainer();

    // Capturar formulario de inicio de sesión
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Capturar formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Inicializar Carrito (Solo si existe la barra lateral del carrito en el DOM)
    if (document.getElementById('cart-drawer')) {
        initCart();
    }

    // Inicializar Reproductor (Solo si existe el modal en el DOM)
    if (document.getElementById('player-modal')) {
        initPlayer();
    }

    // Inicializar Sistema de Referidos (Solo si existe el modal en el DOM)
    if (document.getElementById('referral-modal')) {
        initReferrals();
    }

    // Capturar clics de "Agregar al carrito" vía delegación de eventos
    document.addEventListener('click', (e) => {
        const btnAdd = e.target.closest('.btn-add-to-cart');
        if (btnAdd) {
            const id = btnAdd.getAttribute('data-id');
            const title = btnAdd.getAttribute('data-title');
            const price = parseFloat(btnAdd.getAttribute('data-price'));
            const image = btnAdd.getAttribute('data-image');
            addToCart({ id, title, price, image });
        }
    });

    // Capturar devoluciones de alquileres
    const returnButtons = document.querySelectorAll('.btn-return-movie-action');
    returnButtons.forEach(btn => {
        btn.addEventListener('click', handleReturnRental);
    });
});

/**
 * Inicializar el contenedor de notificaciones en el DOM
 */
function initToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

/**
 * Mostrar una notificación estilo Toast
 * @param {string} title - Título del toast
 * @param {string} message - Descripción
 * @param {string} type - 'success' o 'error'
 */
function showToast(title, message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" type="button">&times;</button>
    `;

    // Insertar en el contenedor
    container.appendChild(toast);

    // Sonido sutil o vibración si el navegador lo soporta (opcional)
    if (type === 'error' && navigator.vibrate) {
        navigator.vibrate(100);
    }

    // Evento de cierre manual
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    // Cierre automático después de 4 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

/**
 * Remover un Toast con animación suave
 * @param {HTMLElement} toast 
 */
function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'slideOut') {
            toast.remove();
        }
    });
}

// Agregar regla CSS para la animación de salida en tiempo de ejecución
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideOut {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(100px); }
}
`;
document.head.appendChild(styleSheet);


/**
 * Manejar el envío de Login vía AJAX
 */
async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.btn-submit');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Campos Incompletos', 'Por favor, llena todos los campos obligatorios.', 'error');
        return;
    }

    // Deshabilitar botón para evitar múltiples clics
    setLoadingState(submitBtn, true, 'Verificando...');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showToast('¡Bienvenido!', data.message, 'success');
            // Redirigir después de 1.2 segundos para dejar leer la notificación
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1200);
        } else {
            showToast('Error de Acceso', data.message || 'Credenciales inválidas.', 'error');
            setLoadingState(submitBtn, false, 'Entrar');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error del Servidor', 'Ocurrió un problema de red. Intenta de nuevo.', 'error');
        setLoadingState(submitBtn, false, 'Entrar');
    }
}

/**
 * Manejar el envío de Registro vía AJAX
 */
async function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.btn-submit');
    
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const referido_por = document.getElementById('referido_por') ? document.getElementById('referido_por').value.trim() : '';

    // Validaciones del lado del cliente
    if (!nombre || !apellido || !username || !email || !password || !confirmPassword) {
        showToast('Campos Vacíos', 'Todos los campos son requeridos.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Contraseña Diferente', 'Las contraseñas ingresadas no coinciden.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Contraseña Corta', 'La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    // Deshabilitar botón
    setLoadingState(submitBtn, true, 'Creando Cuenta...');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, apellido, username, email, password, referido_por })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Registro Completado', '¡Tu cuenta ha sido creada exitosamente!', 'success');
            // Redirigir tras retraso
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1200);
        } else {
            showToast('Error de Registro', data.message || 'No se pudo crear la cuenta.', 'error');
            setLoadingState(submitBtn, false, 'Crear Cuenta');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error del Servidor', 'Ocurrió un problema de conexión. Intente más tarde.', 'error');
        setLoadingState(submitBtn, false, 'Crear Cuenta');
    }
}

/**
 * Modificar el estado del botón durante peticiones
 */
function setLoadingState(button, isLoading, text) {
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `<span class="spinner"></span> ${text}`;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || text;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Estilo del Spinner de Carga
const spinnerStyle = document.createElement("style");
spinnerStyle.innerText = `
.spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
    margin-right: 5px;
    vertical-align: middle;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(spinnerStyle);

/* ==========================================================================
   NetPolix - Funcionalidad de Carrito de Compras y Alquileres
   ========================================================================== */

let cart = [];

/**
 * Inicializar el Carrito
 */
function initCart() {
    // Cargar del localStorage
    try {
        const storedCart = localStorage.getItem('cart-netpolix');
        cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
        cart = [];
    }

    updateCartBadge();
    renderCart();

    // Eventos para abrir/cerrar carrito
    const cartToggle = document.getElementById('cart-toggle');
    const cartClose = document.getElementById('cart-close');
    const cartBackdrop = document.getElementById('cart-backdrop');

    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer(true);
        });
    }

    if (cartClose) {
        cartClose.addEventListener('click', () => openCartDrawer(false));
    }

    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', () => openCartDrawer(false));
    }

    // Evento de Checkout
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', handleCheckout);
    }
}

/**
 * Abrir o Cerrar la barra lateral del carrito
 */
function openCartDrawer(isOpen) {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (!drawer) return;

    if (isOpen) {
        drawer.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        renderCart();
    } else {
        drawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
    }
}

/**
 * Añadir película al carrito
 */
function addToCart(movie) {
    // Verificar si ya existe en el carrito
    const exists = cart.some(item => item.id === movie.id);
    if (exists) {
        showToast('Ya en el carrito', `"${movie.title}" ya está agregada al carrito.`, 'error');
        return;
    }

    cart.push(movie);
    saveCart();
    updateCartBadge();
    renderCart();
    showToast('Película Agregada', `"${movie.title}" se añadió a tu carrito.`, 'success');
    
    // Abrir automáticamente el drawer para feedback inmediato
    setTimeout(() => openCartDrawer(true), 300);
}

/**
 * Guardar carrito en LocalStorage
 */
function saveCart() {
    localStorage.setItem('cart-netpolix', JSON.stringify(cart));
}

/**
 * Actualizar contador flotante del carrito
 */
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = cart.length;
        badge.style.display = cart.length === 0 ? 'none' : 'flex';
    }
}

/**
 * Renderizar items en la barra lateral del carrito
 */
function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalPriceEl = document.getElementById('cart-total-price');
    const btnCheckout = document.getElementById('btn-checkout');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
        if (totalPriceEl) totalPriceEl.innerText = '$0.00';
        if (btnCheckout) btnCheckout.disabled = true;
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price;
        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="cart-item-poster">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <button class="btn-remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar del carrito">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');

    if (totalPriceEl) totalPriceEl.innerText = `$${total.toFixed(2)}`;
    if (btnCheckout) btnCheckout.disabled = false;
}

/**
 * Eliminar película del carrito
 */
window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
    showToast('Película Eliminada', 'Se quitó el título del carrito.', 'success');
};

/**
 * Procesar el alquiler (Checkout)
 */
async function handleCheckout() {
    if (cart.length === 0) return;

    const btnCheckout = document.getElementById('btn-checkout');
    const movieIds = cart.map(item => parseInt(item.id, 10));

    setLoadingState(btnCheckout, true, 'Confirmando...');

    try {
        const response = await fetch('/api/rentals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movieIds })
        });

        const data = await response.json();

        if (data.success) {
            showToast('¡Alquiler Completo!', data.message, 'success');
            
            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartBadge();
            renderCart();
            
            // Cerrar el drawer y redirigir
            setTimeout(() => {
                openCartDrawer(false);
                window.location.href = data.redirect;
            }, 1200);
        } else {
            showToast('Error de Alquiler', data.message || 'No se pudo completar el alquiler.', 'error');
            setLoadingState(btnCheckout, false, '<i class="fa-solid fa-credit-card"></i> Confirmar Alquiler');
        }
    } catch (error) {
        console.error('Error en checkout:', error);
        showToast('Error de Conexión', 'Hubo un problema al procesar el alquiler.', 'error');
        setLoadingState(btnCheckout, false, '<i class="fa-solid fa-credit-card"></i> Confirmar Alquiler');
    }
}

/**
 * Procesar la devolución de una película alquilada
 */
async function handleReturnRental(e) {
    const btn = e.currentTarget;
    const rentalId = btn.getAttribute('data-id');
    const movieTitle = btn.getAttribute('data-title');

    if (!confirm(`¿Estás seguro de que deseas devolver "${movieTitle}"?`)) {
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Devolviendo...';

    try {
        const response = await fetch(`/api/rentals/${rentalId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Devolución Completada', data.message, 'success');
            
            // Actualizar interfaz visualmente sin recargar toda la página inmediatamente
            const card = document.getElementById(`rental-card-${rentalId}`);
            if (card) {
                card.classList.add('devuelto');
                // Cambiar el badge a devuelto
                const badge = card.querySelector('.rental-status-badge');
                if (badge) {
                    badge.className = 'rental-status-badge devuelto';
                    badge.innerText = 'Devuelto';
                }
                // Deshabilitar botones de acción
                const actionSection = card.querySelector('.rental-actions');
                if (actionSection) {
                    actionSection.innerHTML = `
                        <button class="btn-play-movie disabled" disabled>
                            <i class="fa-solid fa-ban"></i> No disponible
                        </button>
                    `;
                }
            }
            
            // Recargar después de un breve retraso para actualizar el stock real en el menú del catálogo
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showToast('Error de Devolución', data.message || 'No se pudo devolver la película.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Devolver';
        }
    } catch (error) {
        console.error('Error al devolver película:', error);
        showToast('Error de Red', 'Problema al comunicarse con el servidor.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Devolver';
    }
}

/**
 * Funcionalidad del Reproductor de Video Simulado
 */
let playerTimelineInterval = null;

function initPlayer() {
    const playButtons = document.querySelectorAll('.btn-play-movie:not(.disabled)');
    const modal = document.getElementById('player-modal');
    const closeBtn = document.getElementById('player-close');

    if (!modal) return;

    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.getAttribute('data-title');
            const poster = btn.getAttribute('data-image');
            
            // Rellenar datos en el modal
            document.getElementById('player-movie-title').innerText = title;
            const screenPoster = document.getElementById('player-video-poster');
            if (screenPoster) {
                screenPoster.style.backgroundImage = `url('${poster}')`;
            }

            // Mostrar modal
            modal.classList.add('open');
            document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

            // Iniciar animación de carga
            startSimulatedPlayer();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closePlayer);
    }
}

function closePlayer() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    // Detener intervalos y estados
    if (playerTimelineInterval) {
        clearInterval(playerTimelineInterval);
    }
    const screen = document.querySelector('.player-screen');
    if (screen) screen.classList.remove('playing');
}

function startSimulatedPlayer() {
    const loader = document.querySelector('.player-loader');
    const screen = document.querySelector('.player-screen');
    const waves = document.getElementById('audio-waves');
    const progressFill = document.getElementById('player-progress-fill');
    const playBtn = document.getElementById('player-play-btn');
    const timeElapsedEl = document.querySelector('.time-elapsed');

    // Resetear vistas
    loader.style.display = 'flex';
    screen.style.display = 'none';
    if (screen) screen.classList.remove('playing');
    if (progressFill) progressFill.style.width = '0%';
    if (timeElapsedEl) timeElapsedEl.innerText = '00:00';
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    if (waves) waves.style.display = 'none';

    // Simular carga de stream de 2.5 segundos
    setTimeout(() => {
        loader.style.display = 'none';
        screen.style.display = 'flex';
        screen.classList.add('playing');
        if (waves) waves.style.display = 'flex';

        // Simular progreso de la película
        let elapsedSeconds = 0;
        if (playerTimelineInterval) clearInterval(playerTimelineInterval);

        playerTimelineInterval = setInterval(() => {
            if (screen.classList.contains('playing')) {
                elapsedSeconds += 1;
                
                // Formatear minutos/segundos transcurridos
                const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
                const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
                timeElapsedEl.innerText = `${minutes}:${seconds}`;

                // Porcentaje para barra de progreso
                const percentage = (elapsedSeconds / 240) * 100; // Película simulada dura 4 minutos en este test
                if (progressFill) progressFill.style.width = `${Math.min(percentage, 100)}%`;

                if (elapsedSeconds >= 240) {
                    clearInterval(playerTimelineInterval);
                    screen.classList.remove('playing');
                    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    if (waves) waves.style.display = 'none';
                    showToast('Fin de la Película', 'La transmisión simulada ha finalizado.', 'info');
                }
            }
        }, 1000);
    }, 2500);

    // Controles de Play/Pause
    if (playBtn) {
        // Clonar botón para remover listeners antiguos
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

        newPlayBtn.addEventListener('click', () => {
            if (screen.classList.contains('playing')) {
                screen.classList.remove('playing');
                newPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                if (waves) waves.style.display = 'none';
            } else {
                screen.classList.add('playing');
                newPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                if (waves) waves.style.display = 'flex';
            }
        });
    }
}

/**
 * Inicializar Sistema de Referidos de Clientes
 */
function initReferrals() {
    const btnReferral = document.getElementById('btn-referral');
    const modal = document.getElementById('referral-modal');
    const closeBtn = document.getElementById('referral-close');
    const copyBtn = document.getElementById('btn-copy-referral');
    const input = document.getElementById('referral-link-input');

    if (!btnReferral || !modal) return;

    // Abrir Modal y generar enlace dinámico
    btnReferral.addEventListener('click', () => {
        const username = btnReferral.getAttribute('data-username');
        const origin = window.location.origin;
        const referralLink = `${origin}/register?ref=${username}`;
        
        if (input) {
            input.value = referralLink;
        }
        
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
    });

    // Cerrar Modal
    const closeModal = () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Cerrar haciendo clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });

    // Copiar Enlace
    if (copyBtn && input) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(input.value)
                .then(() => {
                    // Feedback visual temporizado al botón de copiar
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
                    copyBtn.style.background = 'var(--text-success)';
                    
                    showToast('¡Enlace Copiado!', 'El enlace de referido se copió al portapapeles con éxito.', 'success');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.style.background = '';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Error al copiar:', err);
                    showToast('Error al Copiar', 'No se pudo copiar el enlace automáticamente.', 'error');
                });
        });
    }
}
