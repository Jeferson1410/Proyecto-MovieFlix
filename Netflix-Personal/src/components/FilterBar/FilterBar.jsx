/**
 * Componente: Barra de Filtrado (FilterBar)
 * Proporciona controles interactivos para filtrar el contenido por género, año y valoración (estrellas).
 * Los géneros se cargan dinámicamente desde la API de TMDB según el tipo (película o serie).
 */
import { useState, useEffect } from 'react';
import './FilterBar.css';
import { Filter, Calendar, Star, ChevronDown } from 'lucide-react';
import tmdb, { requests } from '../../services/tmdb';

const FilterBar = ({
    filters,            // Objeto con los valores de filtro activos
    onFilterChange,     // Función para notificar cambios en los filtros
    type = 'movie'      // Tipo de contenido: 'movie' o 'tv'
}) => {
    const [genres, setGenres] = useState([]);               // Lista de géneros obtenida de la API
    const [activeDropdown, setActiveDropdown] = useState(null); // 'genre', 'year', 'rating' o null

    /**
     * EFECTO: Carga de géneros según el tipo (películas o series)
     */
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const endpoint = type === 'movie' ? requests.movieGenres : requests.tvGenres;
                const res = await tmdb.get(endpoint);
                setGenres(res.data.genres);
            } catch (err) {
                console.error("Error al obtener géneros:", err);
            }
        };
        fetchGenres();
    }, [type]);

    /**
     * EFECTO: Cerrar desplegables al hacer clic fuera del componente
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.filter-group')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Maneja la selección de una opción en cualquier filtro
     */
    const handleSelect = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        onFilterChange(newFilters);
        setActiveDropdown(null); // Cierra el menú tras seleccionar
    };

    /**
     * Abre/Cierra un menú desplegable específico
     */
    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    // Genera una lista de los últimos 30 años para el filtro de fecha
    const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

    /** 
     * HELPERS: Obtienen el texto/etiqueta actual para mostrar en el botón
     */
    const getGenreLabel = () => {
        if (!filters.genre) return 'Todos los Géneros';
        const genre = genres.find(g => g.id.toString() === filters.genre.toString());
        return genre ? genre.name : 'Todos los Géneros';
    };

    const getYearLabel = () => filters.year || 'Cualquier Año';

    const getRatingLabel = () => {
        if (!filters.rating) return 'Cualquier Rating';
        const ratingMap = {
            '9': '9+ ⭐ (Obras Maestras)',
            '8': '8+ ⭐ (Excelentes)',
            '7': '7+ ⭐ (Muy Buenas)',
            '6': '6+ ⭐ (Buenas)'
        };
        return ratingMap[filters.rating] || 'Cualquier Rating';
    };

    return (
        <div className="filter-bar glass">
            {/* FILTRO DE GÉNERO */}
            <div className={`filter-group ${activeDropdown === 'genre' ? 'active' : ''}`} onClick={() => toggleDropdown('genre')}>
                <Filter size={16} className="filter-icon" />
                <div className="custom-select-trigger">
                    <span>{getGenreLabel()}</span>
                    <ChevronDown size={14} className={`chevron ${activeDropdown === 'genre' ? 'open' : ''}`} />
                </div>

                {activeDropdown === 'genre' && (
                    <div className="custom-dropdown-menu glass">
                        <div className={`dropdown-item ${!filters.genre ? 'selected' : ''}`} onClick={() => handleSelect('genre', '')}>
                            Todos los Géneros
                        </div>
                        {genres.map(g => (
                            <div
                                key={g.id}
                                className={`dropdown-item ${filters.genre.toString() === g.id.toString() ? 'selected' : ''}`}
                                onClick={() => handleSelect('genre', g.id)}
                            >
                                {g.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-divider"></div>

            {/* FILTRO DE AÑO */}
            <div className={`filter-group ${activeDropdown === 'year' ? 'active' : ''}`} onClick={() => toggleDropdown('year')}>
                <Calendar size={16} className="filter-icon" />
                <div className="custom-select-trigger">
                    <span>{getYearLabel()}</span>
                    <ChevronDown size={14} className={`chevron ${activeDropdown === 'year' ? 'open' : ''}`} />
                </div>

                {activeDropdown === 'year' && (
                    <div className="custom-dropdown-menu glass">
                        <div className={`dropdown-item ${!filters.year ? 'selected' : ''}`} onClick={() => handleSelect('year', '')}>
                            Cualquier Año
                        </div>
                        {years.map(y => (
                            <div
                                key={y}
                                className={`dropdown-item ${filters.year.toString() === y.toString() ? 'selected' : ''}`}
                                onClick={() => handleSelect('year', y)}
                            >
                                {y}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="filter-divider"></div>

            {/* FILTRO DE VALORACIÓN (STARS) */}
            <div className={`filter-group ${activeDropdown === 'rating' ? 'active' : ''}`} onClick={() => toggleDropdown('rating')}>
                <Star size={16} className="filter-icon" />
                <div className="custom-select-trigger">
                    <span>{getRatingLabel()}</span>
                    <ChevronDown size={14} className={`chevron ${activeDropdown === 'rating' ? 'open' : ''}`} />
                </div>

                {activeDropdown === 'rating' && (
                    <div className="custom-dropdown-menu glass">
                        <div className={`dropdown-item ${!filters.rating ? 'selected' : ''}`} onClick={() => handleSelect('rating', '')}>
                            Cualquier Rating
                        </div>
                        <div className={`dropdown-item ${filters.rating === '9' ? 'selected' : ''}`} onClick={() => handleSelect('rating', '9')}>9+ ⭐ (Obras Maestras)</div>
                        <div className={`dropdown-item ${filters.rating === '8' ? 'selected' : ''}`} onClick={() => handleSelect('rating', '8')}>8+ ⭐ (Excelentes)</div>
                        <div className={`dropdown-item ${filters.rating === '7' ? 'selected' : ''}`} onClick={() => handleSelect('rating', '7')}>7+ ⭐ (Muy Buenas)</div>
                        <div className={`dropdown-item ${filters.rating === '6' ? 'selected' : ''}`} onClick={() => handleSelect('rating', '6')}>6+ ⭐ (Buenas)</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
