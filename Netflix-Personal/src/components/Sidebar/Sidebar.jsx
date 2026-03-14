/**
 * Componente: Barra Lateral (Sidebar)
 * Proporciona la navegación principal de la aplicación, selector de temas y acceso al perfil.
 * En dispositivos móviles, funciona como un menú lateral (drawer) con overlay.
 */
import { Home, Film, Tv, TrendingUp, Plus, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../services/authContext';
import './Sidebar.css';

const Sidebar = ({
    activeTab,          // Pestaña seleccionada actualmente (id)
    onTabChange,        // Función para cambiar de sección
    currentTheme,       // ID del tema visual activo
    onThemeChange,      // Función para cambiar el tema (esquema de colores)
    isOpen,             // Estado del menú en móviles (abierto/cerrado)
    onClose,            // Función para cerrar el menú lateral
    onUserMenuToggle    // Función para abrir el menú de usuario
}) => {
    const { user, userData } = useAuth();
    // Definición de las opciones de navegación principal
    const menuItems = [
        { id: 'home', icon: <Home size={22} />, label: 'Inicio' },
        { id: 'movies', icon: <Film size={22} />, label: 'Películas' },
        { id: 'tv', icon: <Tv size={22} />, label: 'Series' },
        { id: 'trending', icon: <TrendingUp size={22} />, label: 'Tendencias' },
        { id: 'mylist', icon: <Plus size={22} />, label: 'Mi Lista' },
    ];

    // Opciones de personalización de color ("Modo Cine")
    const themes = [
        { id: 'purple', color: '#7f0df2', label: 'Neón' },
        { id: 'cyan', color: '#00f2ff', label: 'Cian' },
        { id: 'red', color: '#e50914', label: 'Netflix' },
        { id: 'gold', color: '#ffad1f', label: 'Gold' },
    ];

    return (
        <>
            {/* Overlay oscurecedor para móviles cuando el menú está abierto */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

            <aside className={`sidebar-container glass ${isOpen ? 'drawer-active' : ''}`}>
                {/* Logo Principal con acento de color del tema */}
                <div className="sidebar-logo">
                    <h1 className="logo-text">MATHUASS<span>FLIX</span></h1>
                </div>

                {/* Menú de Navegación Vertical */}
                <nav className="sidebar-menu">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Selector de Temas Visuales */}
                <div className="theme-switcher">
                    <p className="theme-label">MODO CINE</p>
                    <div className="theme-options">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                className={`theme-dot ${currentTheme === t.id ? 'active' : ''}`}
                                style={{ backgroundColor: t.color }}
                                onClick={() => onThemeChange(t.id)}
                                title={`Cambiar a tema ${t.label}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Sección de Perfil de Usuario (Pie de sidebar) */}
                <div className="sidebar-footer">
                    <div className="profile-badge" onClick={onUserMenuToggle} style={{ cursor: 'pointer' }}>
                        <div className="avatar">
                            {user && userData?.avatar ? <img src={userData.avatar} alt="P" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <UserIcon size={20} />}
                        </div>
                        <div className="profile-info">
                            <p className="profile-name">{user ? userData?.name || 'Usuario' : 'Invitado'}</p>
                            <p className="profile-status">{user ? 'Usuario Registrado' : 'Modo Invitado'}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
