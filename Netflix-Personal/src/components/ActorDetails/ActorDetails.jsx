/**
 * Componente: Detalles del Actor
 * Muestra una ventana modal con la biografía, datos personales y filmografía destacada de un artista.
 * Incluye un sistema inteligente de traducción automática para biografías no disponibles en español.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, MapPin, Film } from 'lucide-react';
import tmdb, { requests } from '../../services/tmdb';
import './ActorDetails.css';
import SmartAvatar from '../SmartAvatar/SmartAvatar';
import SmartPoster from '../SmartPoster/SmartPoster';

const ActorDetails = ({ actorId, onClose, onMovieClick }) => {
    const [actor, setActor] = useState(null);       // Datos detallados del artista
    const [loading, setLoading] = useState(true);   // Estado de carga

    /**
     * Efecto para cargar los datos del actor al abrir la modal
     */
    useEffect(() => {
        const fetchActorData = async () => {
            if (!actorId) return;
            setLoading(true);
            try {
                // Intento inicial: Obtener datos en español
                const res = await tmdb.get(requests.actorDetails(actorId));
                let actorData = res.data;

                // LÓGICA DE TRADUCCIÓN: Si la biografía en español está vacía o es muy corta
                if (!actorData.biography || actorData.biography.length < 50) {
                    try {
                        // 1. Buscamos la biografía original en inglés
                        const enRes = await tmdb.get(requests.actorDetails(actorId), {
                            params: { language: 'en-US' }
                        });

                        if (enRes.data.biography && enRes.data.biography.length > 50) {
                            try {
                                const fullBio = enRes.data.biography;
                                // 2. Dividimos el texto en trozos de 450 caracteres (límite de la API gratuita)
                                const chunks = [];
                                for (let i = 0; i < fullBio.length; i += 450) {
                                    chunks.push(fullBio.substring(i, i + 450));
                                }

                                // 3. Traducimos todos los trozos en paralelo para mayor velocidad
                                const translations = await Promise.all(chunks.map(async (chunk) => {
                                    const translateRes = await fetch(
                                        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`
                                    );
                                    const translateData = await translateRes.json();
                                    return translateData.responseData.translatedText || chunk;
                                }));

                                // 4. Unimos los trozos traducidos
                                actorData.biography = translations.join(' ');
                            } catch (transErr) {
                                // Si falla la traducción, mostramos la versión en inglés original
                                actorData.biography = enRes.data.biography;
                            }
                        }
                    } catch (enErr) {
                        console.error("Error al obtener biografía de respaldo:", enErr);
                    }
                }

                setActor(actorData);
            } catch (err) {
                console.error("Error al cargar datos del actor:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActorData();
    }, [actorId]);

    if (!actorId) return null;

    /**
     * Procesamiento de Filmografía:
     * - Combina películas y series
     * - Filtra apariciones irrelevantes (entrevistas, roles de 'él mismo', presentador, etc.)
     * - Ordena por 'vote_count' para priorizar sus trabajos más famosos
     */
    const allCredits = actor ? [
        ...(actor.movie_credits?.cast || []).map(c => ({ ...c, media_type: 'movie' })),
        ...(actor.tv_credits?.cast || []).map(c => ({ ...c, media_type: 'tv' }))
    ]
        .filter(item =>
            item.poster_path &&
            item.character &&
            !item.character.toLowerCase().includes('himself') &&
            !item.character.toLowerCase().includes('herself') &&
            !item.character.toLowerCase().includes('self') &&
            !item.character.toLowerCase().includes('invitado') &&
            !item.character.toLowerCase().includes('host')
        )
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
        .slice(0, 12) : [];

    return (
        <motion.div
            className="actor-modal-overlay glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="actor-modal-container"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
            >
                {/* Botón Cerrar */}
                <button className="actor-close-btn" onClick={onClose}>
                    <X size={28} />
                </button>

                {loading ? (
                    <div className="actor-loading">
                        <div className="spinner"></div>
                    </div>
                ) : actor && (
                    <div className="actor-modal-content">
                        {/* Cabecera del Actor */}
                        <div className="actor-header">
                            <div className="actor-image-wrapper">
                                <SmartAvatar
                                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null}
                                    alt={actor.name}
                                    className="actor-profile-img"
                                />
                                <div className="actor-image-glow"></div>
                            </div>

                            <div className="actor-main-info">
                                <motion.h2
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {actor.name}
                                </motion.h2>

                                {/* Etiquetas Informativas */}
                                <div className="actor-tags">
                                    {actor.birthday && (
                                        <span className="actor-tag">
                                            <Calendar size={14} /> {actor.birthday}
                                        </span>
                                    )}
                                    {actor.place_of_birth && (
                                        <span className="actor-tag">
                                            <MapPin size={14} /> {actor.place_of_birth}
                                        </span>
                                    )}
                                    <span className="actor-tag popularity">
                                        <Star size={14} fill="currentColor" /> {actor.popularity?.toFixed(1)} Popularidad
                                    </span>
                                </div>

                                {/* Sección Biográfica */}
                                <div className="actor-bio-section">
                                    <h3>Biografía</h3>
                                    <p className="actor-bio">
                                        {actor.biography || "No hay biografía disponible para este artista."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cuadrícula de Filmografía */}
                        <div className="actor-filmography">
                            <div className="filmography-header">
                                <h3><Film size={20} /> Filmografía Destacada</h3>
                                <p>Títulos más reconocidos de su trayectoria</p>
                            </div>

                            <div className="actor-credits-grid">
                                {allCredits.map(item => (
                                    <motion.div
                                        key={`${item.id}-${item.media_type}`}
                                        className="credit-card glass"
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        onClick={() => {
                                            onMovieClick(item);
                                            onClose();
                                        }}
                                    >
                                        <div className="credit-img-wrapper">
                                            <SmartPoster
                                                src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null}
                                                alt={item.title || item.name}
                                                type="poster"
                                            />
                                            <div className="credit-overlay">
                                                <Star size={12} fill="currentColor" />
                                                <span>{item.vote_average?.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="credit-info">
                                            <h4>{item.title || item.name}</h4>
                                            <p className="credit-role">{item.character || 'Reparto'}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ActorDetails;
