/**
 * Configuración de integración con TMDB (The Movie Database)
 * Este archivo centraliza todas las peticiones a la API de películas.
 */
import axios from 'axios';

// Clave de API y URL base obtenidas de las variables de entorno de Vite
const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Instancia personalizada de Axios
 * Configurada con la URL base y el idioma predeterminado (Español de México)
 */
const tmdb = axios.create({
    baseURL: BASE_URL,
    params: {
        api_key: API_KEY,
        language: 'es-MX',
    },
});

/**
 * Diccionario de rutas (endpoints) para las peticiones
 * Facilita el acceso a diferentes categorías y funciones de búsqueda
 */
export const requests = {
    // Listas predefinidas para la pantalla de inicio
    trending: (page = 1) => `/trending/all/week?page=${page}`,
    netflixOriginals: `/discover/tv?with_networks=213`,
    topRated: `/movie/top_rated`,
    actionMovies: `/discover/movie?with_genres=28`,
    comedyMovies: `/discover/movie?with_genres=35`,
    horrorMovies: `/discover/movie?with_genres=27`,

    /**
     * Generador dinámico de URL para películas con soporte de filtros
     * @param {number} page - Número de página para paginación
     * @param {string} genre - ID del género de la película
     * @param {string} year - Año de lanzamiento
     * @param {string} rating - Calificación mínima (0-10)
     */
    movies: (page = 1, genre = '', year = '', rating = '') => {
        let url = `/discover/movie?page=${page}&sort_by=popularity.desc`;
        if (genre) url += `&with_genres=${genre}`;
        if (year) url += `&primary_release_year=${year}`;
        if (rating) url += `&vote_average.gte=${rating}`;
        return url;
    },

    /**
     * Generador dinámico de URL para series con soporte de filtros
     */
    series: (page = 1, genre = '', year = '', rating = '') => {
        let url = `/discover/tv?page=${page}&sort_by=popularity.desc`;
        if (genre) url += `&with_genres=${genre}`;
        if (year) url += `&first_air_date_year=${year}`;
        if (rating) url += `&vote_average.gte=${rating}`;
        return url;
    },

    // Listas de géneros para los desplegables de filtros
    movieGenres: `/genre/movie/list`,
    tvGenres: `/genre/tv/list`,

    // Rankings de tendencias
    trendingMovies: `/trending/movie/week`,
    trendingTv: `/trending/tv/week`,

    // Búsqueda inteligente (soporta películas, series y personas simultáneamente)
    search: (query, page = 1) => `/search/multi?query=${encodeURIComponent(query)}&page=${page}`,

    // Detalles profundos con información extra (trailers, reparto, recomendaciones)
    movieDetails: (id) => `/movie/${id}?append_to_response=videos,credits,recommendations`,
    tvDetails: (id) => `/tv/${id}?append_to_response=videos,credits,recommendations`,

    // Información completa del artista y su filmografía
    actorDetails: (id) => `/person/${id}?append_to_response=movie_credits,tv_credits,images`,

    // Motor de descubrimiento avanzado (Smart Discovery)
    discover: (type = 'movie', params = {}) => {
        let url = `/discover/${type}?sort_by=popularity.desc`;
        if (params.genre) url += `&with_genres=${params.genre}`;
        if (params.company) url += `&with_companies=${params.company}`;
        if (params.keyword) url += `&with_keywords=${params.keyword}`;
        if (params.minRating) url += `&vote_average.gte=${params.minRating}`;
        if (params.minVotes) url += `&vote_count.gte=${params.minVotes}`;
        return url;
    }
};

export default tmdb;
