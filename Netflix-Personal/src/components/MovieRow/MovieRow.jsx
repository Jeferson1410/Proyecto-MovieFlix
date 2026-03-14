/**
 * Componente: Fila de Películas
 * Muestra una lista horizontal de películas con desplazamiento lateral suave.
 * Cada tarjeta incluye botones de acción rápida y navegación a detalles.
 * Soporta transiciones de elementos compartidos (Framer Motion).
 */
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import './MovieRow.css';
import SmartPoster from '../SmartPoster/SmartPoster';

const MovieRow = ({
    title,              // Título de la categoría (ej: "Tendencias")
    movies,             // Array de objetos de películas
    onMovieClick,       // Función para abrir detalles extendidos
    myList,             // Lista de favoritos del usuario para verificar estado
    onToggleList,       // Función para añadir/quitar de favoritos
    onPlay              // Función para iniciar el modo cine (trailer)
}) => {
    const rowRef = useRef(null); // Referencia al contenedor de desplazamiento

    /**
     * Lógica de Scroll Horizontal
     * Desplaza el contenedor una cantidad igual a su ancho visible.
     */
    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="row-container">
            <h2 className="row-title">{title}</h2>

            <div className="row-wrapper">
                {/* Botón de Desplazamiento Izquierdo */}
                <button className="scroll-btn left" onClick={() => scroll('left')}>
                    <ChevronLeft size={30} />
                </button>

                {/* Contenedor de Pósteres */}
                <div className="row-posters" ref={rowRef}>
                    {movies.map((movie) => {
                        // Verifica si esta película ya está en la lista del usuario
                        const isInList = myList?.some(item => item.id === movie.id);

                        return (
                            <div key={movie.id} className="movie-card-wrapper">
                                {/* Imagen del Póster con ID de diseño para transiciones fluidas */}
                                <SmartPoster
                                    layoutId={`poster-${movie.id}-${title.replace(/\s+/g, '')}`}
                                    className="movie-poster"
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null}
                                    alt={movie.title || movie.name}
                                    onClick={() => onMovieClick(movie)}
                                    type="poster"
                                />

                                {/* Etiqueta de futuro lanzamiento (si aplica) */}
                                {new Date(movie.release_date || movie.first_air_date) > new Date() && (
                                    <div className="coming-soon-badge">Estreno</div>
                                )}

                                {/* Overlay con Información y Acciones */}
                                <div className="movie-card-info glass">
                                    <div className="quick-actions">
                                        {/* Reproducir Trailer */}
                                        <button className="q-btn play" onClick={() => onPlay(movie)} title="Reproducir Trailer">
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                        {/* Añadir/Quitar de Lista */}
                                        <button
                                            className={`q-btn add ${isInList ? 'active' : ''}`}
                                            onClick={() => onToggleList(movie)}
                                            title={isInList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
                                        >
                                            <Plus size={16} style={{ transform: isInList ? 'rotate(45deg)' : 'none' }} />
                                        </button>
                                    </div>

                                    {/* Título y Año (clicable para ver detalles) */}
                                    <div className="movie-card-details" onClick={() => onMovieClick(movie)}>
                                        <h4 className="movie-card-title">{movie.title || movie.name}</h4>
                                        <p className="movie-card-year">
                                            {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Botón de Desplazamiento Derecho */}
                <button className="scroll-btn right" onClick={() => scroll('right')}>
                    <ChevronRight size={30} />
                </button>
            </div>
        </div>
    );
};

export default MovieRow;
