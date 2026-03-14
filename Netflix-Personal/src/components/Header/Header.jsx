/**
 * Componente: Cabecera (Header)
 * Contiene el buscador inteligente, el acceso al menú lateral en móviles,
 * el centro de notificaciones y el perfil de usuario.
 */
import { Search, Bell, Mic, Menu } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../../services/authContext';
import './Header.css';

const Header = ({
    onSearchOpen,
    onMenuToggle,
    onUserMenuToggle,
    isUserMenuOpen,
    onCloseUserMenu,
    onShowToast,
    likedMovies,
    history,
    onClearHistory,
    onAuthOpen
}) => {
    const { user, userData } = useAuth();
    const userAvatar = userData?.avatar || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Mathuass'}`;

    return (
        <header className="header-container">
            {/* Botón de Menú (Solo visible en dispositivos móviles) */}
            <button className="menu-toggle-btn glass" onClick={onMenuToggle}>
                <Menu size={22} />
            </button>

            {/* BARRA DE BÚSQUEDA FLOTANTE (Disparador) */}
            <div className="search-trigger glass" onClick={() => onSearchOpen(false)}>
                <Search size={18} className="search-icon" />
                <span className="search-placeholder">Búsqueda Inteligente...</span>

                {/* Atajo rápido para búsqueda por voz */}
                <div
                    className="search-shortcut"
                    onClick={(e) => {
                        e.stopPropagation(); // Evita que se abra la búsqueda normal al hacer clic en el micro
                        onSearchOpen(true);  // Abre con auto-escucha
                    }}
                    title="Búsqueda por voz"
                >
                    <Mic size={16} />
                </div>
            </div>

            {/* ACCIONES DEL LADO DERECHO */}
            <div className="header-actions">
                {/* BOTONES DE AUTH PARA INVITADOS */}
                {!user && (
                    <div className="auth-buttons">
                        <button className="auth-btn-nav login" onClick={() => onAuthOpen(true)}>Entrar</button>
                        <button className="auth-btn-nav signup neon-glow" onClick={() => onAuthOpen(false)}>Unirme</button>
                    </div>
                )}

                {/* Avatar del Usuario con efecto neón interactivo */}
                <div
                    className={`user-profile-circle neon-glow ${!user ? 'guest-avatar' : ''}`}
                    onClick={onUserMenuToggle}
                    style={{ cursor: 'pointer' }}
                    title={user ? "Ver Perfil" : "Modo Invitado"}
                >
                    <img src={userAvatar} alt="Perfil" />
                </div>
            </div>

            {/* Menú Desplegable de Usuario */}
            <UserMenu
                isOpen={isUserMenuOpen}
                onClose={onCloseUserMenu}
                onShowToast={onShowToast}
                likedMovies={likedMovies}
                history={history}
                onClearHistory={onClearHistory}
                onAuthOpen={onAuthOpen}
            />
        </header>
    );
};

export default Header;
