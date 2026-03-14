/**
 * Componente: Hero (Banner Principal)
 * Muestra el contenido destacado en la parte superior de la página de inicio.
 * Incluye una imagen de fondo impactante, sinopsis breve y botones de acción principal.
 */
import { Play, Info, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import './Hero.css';
import SmartPoster from '../SmartPoster/SmartPoster';

const Hero = ({
    movie,              // Película destacada actualmente
    onPlay,             // Función para abrir el tráiler
    onInfo,             // Función para abrir la modal de detalles
    onToggleList,       // Función para añadir/quitar de favoritos
    isInList,           // Booleano: ¿está en la lista del usuario?
    onLike,             // Función para dar like
    onDislike,          // Función para dar dislike
    isLiked,            // Estado del like
    isDisliked          // Estado del dislike
}) => {
    // Estado de carga inicial (skeleton)
    if (!movie) return <div className="hero-skeleton"></div>;

    /**
     * Trunca un texto a un número específico de caracteres para no saturar el diseño.
     */
    const truncate = (str, n) => {
        return str?.length > n ? str.substr(0, n - 1) + "..." : str;
    };

    // Verificación de si existe un tráiler oficial disponible en los metadatos
    const hasTrailer = movie.videos?.results?.some(
        v => v.type === 'Trailer' || v.site === 'YouTube'
    );

    return (
        <section className="hero-container">
            {/* FONDO: Imagen de alta resolución con degradado dinámico */}
            <div className="hero-background">
                <SmartPoster
                    src={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null}
                    alt={movie.title || movie.name}
                    type="backdrop"
                />
                <div className="hero-overlay"></div>
            </div>

            {/* CONTENIDO: Información textual y acciones */}
            <div className="hero-content">
                <h1 className="hero-title">{movie.title || movie.name}</h1>

                {/* Metadatos rápidos: Valoración, Año y Calidad */}
                <div className="hero-meta">
                    <span className="rating">TMDB {movie.vote_average?.toFixed(1)}</span>
                    <span className="year">
                        {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
                    </span>
                    <span className="quality">4K Ultra HD</span>
                </div>

                {/* Descripción breve (truncada a 200 caracteres) */}
                <p className="hero-description">
                    {truncate(movie.overview || "Sin descripción disponible.", 200)}
                </p>

                {/* ACCIONES: Reproducción, Info y Personalización */}
                <div className="hero-actions">
                    <div className="main-actions">
                        {/* Botón de Reproducción / Tráiler */}
                        <button
                            className="btn-primary"
                            onClick={() => onPlay(movie)}
                        >
                            <Play size={20} fill="currentColor" />
                            Ver Trailer
                        </button>

                        {/* Botón de Detalles Extendidos */}
                        <button className="btn-secondary" onClick={() => onInfo(movie)}>
                            <Info size={20} />
                            Más Detalles
                        </button>
                    </div>

                    <div className="secondary-actions">
                        {/* Control de Lista de Favoritos */}
                        <button
                            className={`icon-btn-rounded glass ${isInList ? 'active' : ''}`}
                            onClick={() => onToggleList(movie)}
                            title={isInList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
                        >
                            <Plus size={20} style={{ transform: isInList ? 'rotate(45deg)' : 'none' }} />
                        </button>

                        {/* Controles de Valoración Rápida */}
                        <div className="rate-actions">
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
        </section>
    );
};

export default Hero;
