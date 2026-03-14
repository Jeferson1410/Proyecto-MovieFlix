import { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Mail, Lock, Chrome, UserPlus, LogIn, Loader2, X } from 'lucide-react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onShowToast, initialIsLogin = true }) => {
    const { login, register, loginWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(initialIsLogin);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Sincronizar estado cuando se abre con un modo específico
    useEffect(() => {
        setIsLogin(initialIsLogin);
    }, [initialIsLogin, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                onShowToast('✨ ¡Bienvenido de nuevo!');
                onClose();
            } else {
                await register(email, password, name);
                onShowToast('🚀 ¡Cuenta creada con éxito!');
                onClose();
            }
        } catch (error) {
            let msg = error.message;
            if (msg.includes('auth/invalid-credential')) {
                msg = "⚠️ Credenciales incorrectas o la cuenta no tiene contraseña (si usaste Google antes).";
            } else if (msg.includes('auth/user-not-found')) {
                msg = "⚠️ Este correo no está registrado. Usa 'Unirme' para crear tu cuenta.";
            }
            onShowToast('❌ ' + msg, null, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle(!isLogin); // Si no es login, es registro
            onShowToast(isLogin ? '✨ ¡Bienvenido de nuevo!' : '🚀 ¡Cuenta creada con éxito!');
            onClose();
        } catch (error) {
            onShowToast(error.message, null, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-overlay glass">
            <div className="auth-modal neon-border">
                <button className="auth-close" onClick={onClose}>
                    <X size={24} />
                </button>
                <div className="auth-header">
                    <h2>MATHUASS<span>FLIX</span></h2>
                    <p>{isLogin ? 'Accede a tu universo cinematográfico' : 'Crea tu pase VIP al infinito'}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="auth-input-group">
                            <label><UserPlus size={16} /> Nombre de Usuario</label>
                            <input
                                type="text"
                                placeholder="¿Cómo te llamamos?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div className="auth-input-group">
                        <label><Mail size={16} /> Email</label>
                        <input
                            type="email"
                            placeholder="tu@cine.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-input-group">
                        <label><Lock size={16} /> Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn-main neon-glow" disabled={loading}>
                        {loading ? <Loader2 className="spinner" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                        {isLogin ? 'Entrar Ahora' : 'Registrarme'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>O continúa con</span>
                </div>

                <button onClick={handleGoogleLogin} className="auth-btn-google" disabled={loading}>
                    <Chrome size={20} /> Google Sign-In
                </button>

                <p className="auth-switch">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? ' Suscríbete aquí' : ' Inicia sesión'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
