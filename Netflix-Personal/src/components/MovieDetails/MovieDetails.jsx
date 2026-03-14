/**
 * Componente: Detalles de la Película / Serie
 * Proporciona una vista expandida con sinopsis, metadatos (año, duración), reparto y acciones de usuario.
 */
import { X, Play, Plus, Star, Calendar, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MovieDetails.css';

import SmartAvatar from '../SmartAvatar/SmartAvatar';
import SmartPoster from '../SmartPoster/SmartPoster';

const MovieDetails = ({
    movie,              // Objeto con la información completa de la película
    onClose,            // Función para cerrar la modal
    onPlay,             // Función para iniciar el modo cine
    isInList,           // Booleano: ¿está en favoritos?
    onToggleList,       // Función para añadir/quitar de favoritos
    onLike,             // Función para marcar "Me encanta"
    onDislike,          // Función para marcar "No me interesa"
    isLiked,            // Booleano: ¿tiene like?
    isDisliked,         // Booleano: ¿tiene dislike?
    onActorClick,       // Función para abrir detalles del actor
    onShowFullCast      // Función para mostrar el reparto completo
}) => {
    if (!movie) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="details-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                {/* Contenedor Modal */}
                <motion.div
                    className="details-modal glass"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic dentro
                >
                    {/* Botón de Cierre */}
                    <button className="close-btn glass" onClick={onClose}>
                        <X size={24} />
                    </button>

                    {/* SECCIÓN HERO (Imagen de fondo y título) */}
                    <div className="details-hero">
                        <SmartPoster
                            layoutId={movie.layoutId}
                            src={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null}
                            alt={movie.title || movie.name}
                            className="details-bg"
                            type="backdrop"
                        />
                        <div className="details-hero-overlay"></div>
                        <div className="vibe-layer"></div>

                        <div className="details-main-info">
                            <h1 className="details-title">{movie.title || movie.name}</h1>
                            <p className="details-tagline">{movie.tagline}</p>

                            {/* Metadatos Rápidos */}
                            <div className="details-meta">
                                <div className="meta-item accent">
                                    <Star size={18} fill="currentColor" />
                                    <span>{movie.vote_average?.toFixed(1)} TMDB</span>
                                </div>
                                <div className="meta-item">
                                    <Calendar size={18} />
                                    <span>{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={18} />
                                    <span>{movie.runtime || 'N/A'} min</span>
                                </div>
                                <div className="meta-item pill">HD</div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="details-actions">
                                {(() => {
                                    // Comprobación lógica de disponibilidad de trailer
                                    const hasTrailer = movie.videos?.results?.some(
                                        v => v.type === 'Trailer' || v.site === 'YouTube'
                                    );
                                    return (
                                        <button
                                            className="btn-primary"
                                            onClick={() => onPlay(movie)}
                                        >
                                            <Play size={20} fill="currentColor" />
                                            {hasTrailer ? 'Ver Trailer' : 'Trailer no disponible'}
                                        </button>
                                    );
                                })()}

                                <button
                                    className={`btn-secondary ${isInList ? 'active' : ''}`}
                                    onClick={onToggleList}
                                >
                                    <Plus size={20} style={{ transform: isInList ? 'rotate(45deg)' : 'none' }} />
                                    {isInList ? 'En Mi Lista' : 'Mi Lista'}
                                </button>

                                {/* Calificaciones del Usuario */}
                                <div className="rate-actions" style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className={`icon-btn-rounded glass ${isLiked ? 'active-like' : ''}`}
                                        onClick={() => onLike(movie)}
                                        title="Me encanta"
                                    >
                                        <ThumbsUp size={20} fill={isLiked ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                        className={`icon-btn-rounded glass ${isDisliked ? 'active-dislike' : ''}`}
                                        onClick={() => onDislike(movie)}
                                        title="No me interesa"
                                    >
                                        <ThumbsDown size={20} fill={isDisliked ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CUERPO DE LA MODAL (Información Detallada) */}
                    <div className="details-body">
                        {/* Lado Izquierdo: Descripción y Géneros */}
                        <div className="details-content-left">
                            <section className="details-section">
                                <h3>Sinopsis</h3>
                                <p className="details-overview">{movie.overview || "No hay sinopsis disponible en español."}</p>
                            </section>
                            <section className="details-section">
                                <h3>Géneros</h3>
                                <div className="genres-list">
                                    {movie.genres?.map(g => (
                                        <span key={g.id} className="genre-pill">{g.name}</span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Lado Derecho: Reparto Principal */}
                        <div className="details-content-right">
                            <section className="details-section">
                                <div className="section-header">
                                    <h3>{movie.credits?.cast?.length > 0 ? 'Reparto Principal' : 'Equipo Directivo'}</h3>
                                    {movie.credits?.cast?.length > 0 && (
                                        <button className="see-all-btn" onClick={() => onShowFullCast(movie)}>
                                            Ver Todo
                                        </button>
                                    )}
                                </div>
                                <div className="cast-grid">
                                    {(() => {
                                        const cast = movie.credits?.cast || [];
                                        if (cast.length > 0) {
                                            return cast.slice(0, 4).map(person => (
                                                <div
                                                    key={person.id}
                                                    className="cast-item clickable"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onActorClick(person.id);
                                                    }}
                                                    title={`Ver detalles de ${person.name}`}
                                                >
                                                    <SmartAvatar
                                                        src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : null}
                                                        alt={person.name}
                                                    />
                                                    <div className="cast-info">
                                                        <p className="cast-name">{person.name}</p>
                                                        <p className="cast-role">{person.character}</p>
                                                    </div>
                                                </div>
                                            ));
                                        }

                                        // Fallback para documentales y series: Mostrar directores y equipo clave expandido
                                        let crew = movie.credits?.crew?.filter(c =>
                                            ['Director', 'Executive Producer', 'Producer', 'Writer', 'Screenplay', 'Director of Photography'].includes(c.job)
                                        ) || [];

                                        // Si aún así no hay nadie (casos raros), tomamos los primeros 4 del equipo disponible
                                        if (crew.length === 0 && movie.credits?.crew?.length > 0) {
                                            crew = movie.credits.crew;
                                        }

                                        crew = crew.slice(0, 4);

                                        return crew.map((person, idx) => (
                                            <div key={`${person.id}-${idx}`} className="cast-item">
                                                <SmartAvatar
                                                    src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : null}
                                                    alt={person.name}
                                                />
                                                <div className="cast-info">
                                                    <p className="cast-name">{person.name}</p>
                                                    <p className="cast-role">{person.job}</p>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MovieDetails;
