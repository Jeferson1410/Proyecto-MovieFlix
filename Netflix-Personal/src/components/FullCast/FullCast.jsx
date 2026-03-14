/**
 * Componente: Reparto Completo (FullCast)
 * Muestra una lista exhaustiva de todos los actores y equipo técnico de una película o serie.
 * Permite la navegación hacia atrás a los detalles de la película y hacia adelante a detalles del actor.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Users } from 'lucide-react';
import './FullCast.css';

import SmartAvatar from '../SmartAvatar/SmartAvatar';

const FullCast = ({ movie, onClose, onActorClick }) => {
    if (!movie || !movie.credits) return null;

    const cast = movie.credits.cast || [];
    const director = movie.credits.crew?.find(c => c.job === 'Director')?.name;

    return (
        <motion.div
            className="full-cast-overlay"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            {/* Cabecera de la Ventana */}
            <div className="full-cast-header glass">
                <button className="back-btn" onClick={onClose}>
                    <ArrowLeft size={24} />
                    <span>Volver a Detalles</span>
                </button>
                <div className="header-title">
                    <h2>Reparto y Equipo</h2>
                    <p>{movie.title || movie.name} {director && `• Dirigida por ${director}`}</p>
                </div>
                <button className="close-all-btn" onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            {/* Contenido principal: Rejilla de Actores */}
            <div className="full-cast-body">
                <div className="section-intro">
                    <Users size={24} />
                    <h3>Reparto ({cast.length} personas)</h3>
                </div>

                <div className="full-cast-grid">
                    {cast.map((person, index) => (
                        <motion.div
                            key={`${person.id}-${index}`}
                            className="cast-card glass"
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => onActorClick(person.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.03, 1) }}
                        >
                            <div className="card-thumb">
                                <SmartAvatar
                                    src={person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : null}
                                    alt={person.name}
                                />
                                <div className="card-overlay">
                                    <span>Ver Bio</span>
                                </div>
                            </div>
                            <div className="card-info">
                                <h4 className="person-name">{person.name}</h4>
                                <p className="person-role">{person.character}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default FullCast;
