import { useState, useEffect, createContext, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    updatePassword,
    updateProfile,
    linkWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Buscamos los datos en Firestore con un pequeño reintento para evitar condiciones de carrera en el registro
                const fetchWithRetry = async (retries = 3) => {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                        setUser(currentUser);
                        return true;
                    } else if (retries > 0) {
                        // Si no existe, esperamos un poco (tal vez se está creando)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return fetchWithRetry(retries - 1);
                    }
                    return false;
                };

                const found = await fetchWithRetry();
                if (!found) {
                    // Si después de los reintentos no existe, cerramos sesión (seguridad)
                    setUser(null);
                    setUserData(null);
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

    const register = async (email, password, name) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Creamos el documento inmediatamente para evitar que onAuthStateChanged use el nombre predeterminado
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
            name: name,
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
            createdAt: new Date().toISOString()
        });
        return result;
    };

    const logout = () => signOut(auth);

    // Actualizar datos del usuario (Nombre y Avatar)
    const updateUserData = async (newData) => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, {
            ...userData,
            ...newData
        }, { merge: true });

        // También actualizamos el perfil de Auth para consistencia
        if (newData.name) {
            await updateProfile(auth.currentUser, { displayName: newData.name });
        }
        if (newData.avatar) {
            await updateProfile(auth.currentUser, { photoURL: newData.avatar });
        }

        setUserData(prev => ({ ...prev, ...newData }));
    };

    // Cambiar contraseña
    const changePassword = async (newPassword) => {
        if (!auth.currentUser) return;
        await updatePassword(auth.currentUser, newPassword);
    };

    // Función de Google ahora mucho más estricta
    const loginWithGoogle = async (isRegistering = false) => {
        const result = await signInWithPopup(auth, googleProvider);
        const userRef = doc(db, "users", result.user.uid);
        const userSnap = await getDoc(userRef);

        if (isRegistering) {
            // Modo "Unirme": Si no existe perfil, lo creamos
            if (!userSnap.exists()) {
                const newData = {
                    name: result.user.displayName || result.user.email.split('@')[0],
                    email: result.user.email,
                    avatar: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
                    createdAt: new Date().toISOString()
                };
                await setDoc(userRef, newData);
                setUserData(newData);
            } else {
                setUserData(userSnap.data());
            }
            setUser(result.user);
        } else {
            // Modo "Entrar": SOLO si ya tiene perfil en Firestore
            if (userSnap.exists()) {
                setUserData(userSnap.data());
                setUser(result.user);
            } else {
                // Si la cuenta Auth es nueva pero no hay perfil, lo cerramos
                await signOut(auth);
                throw new Error("⚠️ Cuenta no registrada. Por favor, usa la opción 'Unirme' primero.");
            }
        }
        return result;
    };

    const value = {
        user,
        userData,
        login,
        register,
        logout,
        loginWithGoogle,
        updateUserData,
        changePassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
