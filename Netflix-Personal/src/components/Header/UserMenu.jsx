/**
 * Componente: Menú de Usuario (UserMenu)
 * Proporciona acceso al perfil, configuración de cuenta e historial de películas vistas.
 * Utiliza un sistema de navegación interna (vistas) dentro de la misma modal.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Settings, History, LogOut, X, Mail, Lock, Trash2, Clock, Heart, User as UserIcon, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../services/authContext';
import SmartAvatar from '../SmartAvatar/SmartAvatar';
import './UserMenu.css';

const UserMenu = ({
    isOpen,             // Estado de visibilidad
    onClose,            // Función para cerrar la modal
    onShowToast,        // Función para mostrar notificaciones rápidas
    likedMovies = [],   // Lista de películas con Like
    history = [],       // Historial de películas vistos (proviene de App/Firestore)
    onClearHistory,     // Función para limpiar el historial (proviene de App/Firestore)
    onAuthOpen          // Función para abrir el modal de autenticación
}) => {
    // ESTADOS INTERNOS
    const { user: authUser, userData, logout, updateUserData, changePassword } = useAuth();
    const [view, setView] = useState('menu');       // Vista actual: 'menu', 'settings', 'history', 'liked'
    const contentRef = useRef(null);                // Referencia para resetear el scroll

    // ESTADOS PARA FORMULARIO DE AJUSTES
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Listado de avatares disponibles
    const avatars = [
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.uid || '1'}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Snuggles`,
        `https://api.dicebear.com/7.x/pixel-art/svg?seed=Math`,
        `https://api.dicebear.com/7.x/bottts/svg?seed=Assflix`
    ];

    // Objeto consolidado del usuario
    const user = {
        name: userData?.name || authUser?.displayName || authUser?.email?.split('@')[0] || (authUser ? 'Usuario' : 'Invitado'),
        email: authUser?.email || '',
        avatar: userData?.avatar || authUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.uid || 'Guest'}`
    };

    /**
     * EFECTO: Carga de recursos al abrir el menú e inicializar ajustes
     */
    useEffect(() => {
        if (isOpen) {
            setView('menu');
            // Inicializar campos de ajustes
            setNewName(user.name);
            setSelectedAvatar(user.avatar);
            setNewPassword('');
        }
    }, [isOpen, user.name, user.avatar]);

    /**
     * EFECTO: Resetear scroll al cambiar de vista para que no se herede la posición
     */
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [view]);

    /**
     * Actualización real de datos en Firebase
     */
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            // 1. Actualizar Nombre y Avatar si cambiaron
            if (newName !== user.name || selectedAvatar !== user.avatar) {
                await updateUserData({
                    name: newName,
                    avatar: selectedAvatar
                });
            }

            // 2. Actualizar Contraseña si se proporcionó una nueva
            if (newPassword.trim().length > 0) {
                if (newPassword.length < 6) {
                    throw new Error("La contraseña debe tener al menos 6 caracteres");
                }
                await changePassword(newPassword);
            }

            onShowToast('✅ Perfil y seguridad actualizados');
            setView('menu');
        } catch (error) {
            let msg = error.message;
            if (msg.includes('requires-recent-login')) {
                msg = "⚠️ Por seguridad, vuelve a iniciar sesión para cambiar tu contraseña.";
            }
            onShowToast('❌ ' + msg, null, 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Limpia el historial de visualización llamando a la función padre
     */
    const handleClearHistory = async () => {
        if (window.confirm('¿Estás seguro de que deseas borrar todo tu historial?')) {
            await onClearHistory();
            onShowToast('🧹 Historial borrado correctamente');
        }
    };

    /**
     * Cierre de sesión real con Firebase
     */
    const handleLogout = async () => {
        try {
            onShowToast('👋 Cerrando sesión...');
            await logout();
            onClose();
        } catch (error) {
            onShowToast('❌ Error al cerrar sesión', null, 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="usermenu-overlay" onClick={onClose}>
            {/* Contenedor con ancho variable según la vista (extended para historial/ajustes) */}
            <div className={`usermenu-container glass ${view !== 'menu' ? 'extended' : ''}`} onClick={e => e.stopPropagation()}>

                {/* Cabecera dinámica de la modal */}
                <header className="usermenu-header">
                    <button className="back-btn" onClick={() => view === 'menu' ? onClose() : setView('menu')}>
                        {view === 'menu' ? <X size={20} /> : '← Volver'}
                    </button>
                    <h3>{
                        view === 'menu' ? 'Mi Perfil' :
                            view === 'settings' ? 'Configuración' :
                                view === 'liked' ? 'Mis Me Gusta' :
                                    'Historial de Vistos'
                    }</h3>
                </header>

                <div className="usermenu-content" ref={contentRef}>
                    {/* VISTA 1: MENÚ PRINCIPAL (BASADO EN STITCH) */}
                    {view === 'menu' && (
                        <div className="menu-main">
                            <div className="stitch-profile-header">
                                <div className="stitch-avatar-container">
                                    <div className="stitch-avatar-glow"></div>
                                    <SmartAvatar src={user.avatar} alt={user.name} className="stitch-avatar" />
                                </div>
                                <div className="stitch-user-info">
                                    <h4>{user.name}</h4>
                                    <span className="stitch-status"> BIENVENIDO A MATHUASSFLIX</span>
                                </div>
                                {authUser && (
                                    <button className="stitch-manage-btn" onClick={() => setView('settings')}>
                                        <History size={14} />
                                        GESTIONAR PERFIL
                                    </button>
                                )}
                            </div>

                            <div className="stitch-menu-list">
                                {authUser ? (
                                    <>
                                        <button className="stitch-menu-item" onClick={() => setView('history')}>
                                            <div className="item-left">
                                                <div className="item-icon-circle">
                                                    <Clock size={16} />
                                                </div>
                                                <span>Historial de Vistos</span>
                                            </div>
                                            <div className="item-right">
                                                <div className="stitch-progress">
                                                    <div className="stitch-progress-fill" style={{ width: '68%' }}></div>
                                                </div>
                                                <span className="item-chevron">›</span>
                                            </div>
                                        </button>

                                        <button className="stitch-menu-item" onClick={() => setView('liked')}>
                                            <div className="item-left">
                                                <div className="item-icon-circle">
                                                    <Heart size={16} />
                                                </div>
                                                <span>Películas Favoritas</span>
                                            </div>
                                            <div className="item-right">
                                                <span className="stitch-badge">{likedMovies.length}</span>
                                                <span className="item-chevron">›</span>
                                            </div>
                                        </button>

                                        <button className="stitch-menu-item" onClick={() => setView('settings')}>
                                            <div className="item-left">
                                                <div className="item-icon-circle">
                                                    <Settings size={16} />
                                                </div>
                                                <span>Ajustes de Cuenta</span>
                                            </div>
                                            <div className="item-right">
                                                <span className="item-chevron">›</span>
                                            </div>
                                        </button>

                                        <div className="stitch-divider" />

                                        <a href="https://www.themoviedb.org/about" target="_blank" rel="noopener noreferrer" className="stitch-menu-item secondary-text no-decoration">
                                            <div className="item-left">
                                                <div className="help-icon-circle">?</div>
                                                <span>Acerca de TMDB</span>
                                            </div>
                                            <div className="item-right">
                                                <ExternalLink size={14} opacity={0.5} />
                                            </div>
                                        </a>

                                        <button className="stitch-menu-item logout-red" onClick={handleLogout}>
                                            <div className="item-left">
                                                <LogOut size={16} />
                                                <span>CERRAR SESIÓN</span>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    <div className="guest-card glass">
                                        <div className="guest-glow"></div>
                                        <div className="guest-icon-wrapper">
                                            <UserIcon size={32} className="guest-icon" />
                                        </div>
                                        <h4>Modo Limitado</h4>
                                        <p>Inicia sesión para desbloquear tu historial, favoritos y la personalización total de tu perfil.</p>
                                        <button className="stitch-manage-btn guest-login-btn" onClick={() => { onClose(); onAuthOpen(true); }}>
                                            INICIAR SESIÓN
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VISTA 2: CONFIGURACIÓN REAL */}
                    {view === 'settings' && (
                        <form className="settings-form" onSubmit={handleUpdateUser}>
                            <p className="stitch-status center-text">IDENTIDAD NEURAL</p>
                            <p className="settings-intro">Personaliza tu perfil en MATHUASS<span>FLIX</span> para una experiencia única.</p>

                            {/* Selector de Avatares */}
                            <div className="avatar-selector-section">
                                <label className="section-label">Elige tu Avatar</label>
                                <div className="avatar-grid">
                                    {avatars.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className={`avatar-option ${selectedAvatar === url ? 'selected' : ''}`}
                                            onClick={() => setSelectedAvatar(url)}
                                        >
                                            <img src={url} alt={`Avatar ${idx}`} />
                                            {selectedAvatar === url && <div className="selected-check">✓</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label><UserIcon size={16} /> Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Tu nuevo nombre"
                                    required
                                />
                            </div>

                            <div className="input-divider"><span>Seguridad</span></div>

                            <div className="input-group">
                                <label><Lock size={16} /> Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="•••••••• (deja vacío para no cambiar)"
                                />
                                <p className="input-help">Mínimo 6 caracteres</p>
                            </div>

                            <button type="submit" className="btn-save neon-glow" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="spinner" /> : 'Guardar Cambios'}
                            </button>
                        </form>
                    )}

                    {/* VISTA 3: HISTORIAL DE VISUALIZACIÓN */}
                    {view === 'history' && (
                        <div className="history-view">
                            {history.length > 0 ? (
                                <>
                                    <div className="history-list">
                                        {history.map((movie) => (
                                            <div key={movie.id || Math.random()} className="history-item glass">
                                                <img
                                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200'}
                                                    alt={movie.title || movie.name}
                                                />
                                                <div className="history-item-info">
                                                    <span>{movie.title || movie.name}</span>
                                                    <p><Clock size={12} /> {movie.watchDate || 'Recientemente'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn-clear" onClick={handleClearHistory}>
                                        <Trash2 size={16} /> Borrar Todo el Historial
                                    </button>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <History size={48} />
                                    <p>Tu historial está vacío. ¡Empieza a ver algo hoy!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA 4: MIS ME GUSTA */}
                    {view === 'liked' && (
                        <div className="history-view">
                            {likedMovies.length > 0 ? (
                                <div className="history-list">
                                    {likedMovies.map((movie, index) => (
                                        <div key={index} className="history-item glass">
                                            <img
                                                src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200'}
                                                alt={movie.title || movie.name}
                                            />
                                            <div className="history-item-info">
                                                <span>{movie.title || movie.name}</span>
                                                <p><Heart size={12} fill="currentColor" /> ¡Te encanta!</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Heart size={48} />
                                    <p>Todavía no has dado Like a ninguna película.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserMenu;
