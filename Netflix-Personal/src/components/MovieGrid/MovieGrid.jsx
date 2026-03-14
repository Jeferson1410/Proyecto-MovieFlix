/**
 * Componente: Cuadrícula de Películas (MovieGrid)
 * Muestra películas en un formato de rejilla responsive.
 * Se utiliza para visualizaciones de categorías, resultados de filtrado y "Mi Lista".
 * Incluye soporte para carga infinita (paginación) y transiciones animadas.
 */
import { useRef } from 'react';
import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import './MovieGrid.css';
import SmartPoster from '../SmartPoster/SmartPoster';

const MovieGrid = ({
    title,              // Título de la sección (ej: "Resultados de Acción")
    movies,             // Array de objetos de películas
    onMovieClick,       // Función al hacer clic en la tarjeta (detalles)
    myList,             // Lista de favoritos para verificar estado
    onToggleList,       // Función para añadir/quitar de favoritos
    onPlay,             // Función para reproducir trailer
    isMyListView,       // Booleano: ¿Estamos viendo la lista personal?
    onLoadMore,         // Función para cargar la siguiente página de resultados
    hasMore             // Booleano: ¿Hay más páginas disponibles en la API?
}) => {
    return (
        <div className="grid-section">
            {/* Título dinámico de la cuadrícula */}
            <h2 className="grid-title">{title}</h2>

            <div className="movie-grid">
                {movies?.map((movie) => {
                    // Verifica si la película ya está guardada por el usuario
                    const isInList = myList?.some(item => item.id === movie.id);

                    return (
                        <div key={movie.id} className="grid-card-wrapper">
                            <div className="grid-card-inner">
                                {/* Imagen del Póster con ID de diseño para transiciones fluidas */}
                                <SmartPoster
                                    layoutId={`poster-${movie.id}-${title.replace(/\s+/g, '')}`}
                                    className="grid-poster"
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null}
                                    alt={movie.title || movie.name}
                                    onClick={() => onMovieClick(movie)}
                                    type="poster"
                                />

                                {/* Etiqueta de próximamente basado en fecha de estreno */}
                                {new Date(movie.release_date || movie.first_air_date) > new Date() && (
                                    <div className="coming-soon-badge grid">Próximamente</div>
                                )}

                                {/* Overlay con controles y metadatos (visible al hacer hover) */}
                                <div className="grid-card-overlay glass" onClick={() => onMovieClick(movie)}>
                                    <div className="card-controls" onClick={e => e.stopPropagation()}>
                                        {/* Botón rápido de reproducción */}
                                        <button className="control-btn play" onClick={() => onPlay(movie)} title="Reproducir">
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                        {/* Botón rápido de lista */}
                                        <button
                                            className={`control-btn add ${isInList ? 'active' : ''}`}
                                            onClick={() => onToggleList(movie)}
                                            title={isInList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
                                        >
                                            <Plus size={16} style={{ transform: isInList ? 'rotate(45deg)' : 'none' }} />
                                        </button>
                                    </div>

                                    {/* Información rápida en la base de la tarjeta */}
                                    <div className="card-details">
                                        <div className="card-top">
                                            <span className="card-rating">
                                                <Star size={12} fill="currentColor" /> {movie.vote_average?.toFixed(1)}
                                            </span>
                                            <span className="card-year">
                                                {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
                                            </span>
                                        </div>
                                        <h4 className="card-title">{movie.title || movie.name}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BOTÓN "CARGAR MÁS" (Paginación manual) */}
            {onLoadMore && hasMore && (
                <div className="load-more-container">
                    <button className="load-more-btn glass" onClick={onLoadMore}>
                        <Plus size={18} /> Explorar más títulos
                    </button>
                </div>
            )}
        </div>
    );
};

export default MovieGrid;
