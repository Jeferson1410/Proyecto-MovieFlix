/**
 * Componente: Sistema de Notificaciones (Toasts)
 * Gestiona la visualización de avisos flotantes temporales (ej: "Añadido a favoritos").
 * Utiliza Framer Motion para animaciones fluidas de entrada, salida y barra de progreso.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, XCircle, Heart, Plus } from 'lucide-react';
import './Notifications.css';

const Notifications = ({
    notifications,      // Array de objetos de notificación activos
    onRemove            // Función para eliminar una notificación manualmente o por tiempo
}) => {
    return (
        <div className="notifications-portal">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        className={`notif-card glass ${notif.type}`}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="notif-content">
                            {/* Miniatura de la película (si la notificación está vinculada a un título) */}
                            {notif.movieImage && (
                                <div className="notif-image">
                                    <img src={`https://image.tmdb.org/t/p/w92${notif.movieImage}`} alt="póster miniatura" />
                                </div>
                            )}

                            <div className="notif-text">
                                <div className="notif-title-row">
                                    {/* Icono dinámico según el tipo de mensaje */}
                                    <span className="notif-icon-wrapper">
                                        {notif.type === 'like' && <Heart size={14} fill="currentColor" />}
                                        {notif.type === 'list' && <Plus size={14} />}
                                        {notif.type === 'success' && <CheckCircle size={14} />}
                                    </span>
                                    <p className="notif-msg">{notif.message}</p>
                                </div>
                                {/* Subtítulo opcional con el nombre de la película */}
                                {notif.movieTitle && <p className="notif-movie-name">{notif.movieTitle}</p>}
                            </div>
                        </div>

                        {/* BARRA DE PROGRESO VISUAL: Indica cuánto tiempo queda antes de desaparecer */}
                        <div className="notif-progress">
                            <motion.div
                                className="notif-progress-bar"
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 4, ease: "linear" }}
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Notifications;
