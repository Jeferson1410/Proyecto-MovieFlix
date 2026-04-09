/**
 * Componente: Buscador Inteligente (Super Search)
 * Ofrece búsqueda global por texto, comandos de voz y sugerencias basadas en el ánimo del usuario.
 * Integra Web Speech API para el reconocimiento de voz.
 */
import { useRef, useEffect, useState } from 'react';
import { Search, X, Mic, TrendingUp, History, Heart, Zap, Coffee, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tmdb, { requests } from '../../services/tmdb';
import './SmartSearch.css';

// Mapeo inteligente para convertir términos de búsqueda en filtros de descubrimiento reales
const SMART_MAPPING = {
    'action': { type: 'movie', params: { genre: 28 } },
    'drama': { type: 'movie', params: { genre: 18 } },
    'comedy': { type: 'movie', params: { genre: 35 } },
    'horror': { type: 'movie', params: { genre: 27 } },
    'fantasy': { type: 'movie', params: { genre: 14 } },
    'disney': { type: 'movie', params: { company: 2 } },
    'marvel': { type: 'movie', params: { company: 420 } },
    'oscar': { type: 'movie', params: { minRating: 7.7, minVotes: 2000 } }, // Estrategia de "Obras Maestras" para Oscar
};

const SmartSearch = ({
    isOpen,             // ¿Está el buscador abierto?
    onClose,            // Función para cerrar la búsqueda
    onResultClick,      // Acción al seleccionar un resultado
    recentSearches,     // Lista de términos buscados recientemente
    onAddRecent,        // Función para guardar una búsqueda exitosa
    onRemoveRecent,     // Función para borrar una búsqueda específica
    autoListen,         // Booleano: ¿Iniciar escucha de voz al abrir?
    setAutoListen,      // Función para resetear el estado de auto-escucha
    initialQuery        // Búsqueda inicial predefinida
}) => {
    const [query, setQuery] = useState('');         // Consulta de texto actual
    const [results, setResults] = useState([]);     // Resultados de la API
    const [loading, setLoading] = useState(false);   // Estado de carga de búsqueda
    const [isListening, setIsListening] = useState(false); // Estado del micrófono
    const inputRef = useRef(null);                  // Referencia al campo de entrada

    // Efecto para sincronizar la consulta inicial o resetear al cerrar
    useEffect(() => {
        if (isOpen) {
            if (initialQuery) setQuery(initialQuery);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen, initialQuery]);

    /**
     * LÓGICA DE BÚSQUEDA POR VOZ (Web Speech API)
     */
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La búsqueda por voz no es compatible con este navegador.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX'; // Configurado para español de México
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript); // Actualiza el texto con lo escuchado
        };
        recognition.start();
    };

    // Foco automático y escucha inicial al abrir
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            if (autoListen) {
                startListening();
                setAutoListen(false);
            }
        }
    }, [isOpen, autoListen, setAutoListen]);

    /**
     * EFECTO: Petición a la API (con Debounce)
     * Espera 500ms después de que el usuario deja de escribir antes de disparar la búsqueda.
     */
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                setLoading(true);
                try {
                    const lowQuery = query.toLowerCase().trim();
                    let searchResults = [];

                    // LÓGICA DE BÚSQUEDA INTELIGENTE:
                    // Si el término coincide con un mapeo especial, usamos 'discover' para mayor precisión
                    if (SMART_MAPPING[lowQuery]) {
                        const { type, params } = SMART_MAPPING[lowQuery];
                        const res = await tmdb.get(requests.discover(type, params));
                        // Inyectamos el media_type ya que discover no lo devuelve en los resultados
                        searchResults = res.data.results.map(item => ({ ...item, media_type: type }));
                    } else {
                        // Búsqueda de texto tradicional (multi-formato)
                        const res = await tmdb.get(requests.search(query));
                        searchResults = res.data.results;
                    }

                    setResults(searchResults);
                    if (searchResults.length > 0) onAddRecent(query);
                } catch (err) {
                    console.error("Error en búsqueda inteligente:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="search-overlay glass">
            {/* Botón de Cierre */}
            <button className="search-close" onClick={onClose}>
                <X size={32} />
            </button>

            <div className="search-modal-content">
                {/* BARRA DE ENTRADA CON EFECTO NEÓN */}
                <div className={`search-input-wrapper neon-glow ${isListening ? 'listening' : ''}`}>
                    <Search className="input-icon" size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isListening ? "Escuchando..." : "Películas, series, actores..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Mic
                        className={`mic-icon ${isListening ? 'active' : ''}`}
                        size={24}
                        onClick={startListening}
                        title="Buscar por voz"
                    />
                </div>

                <div className="search-body">
                    {results.length > 0 ? (
                        /* CUADRÍCULA DE RESULTADOS ACTIVA */
                        <div className="search-results-grid">
                            {results.map((item) => (
                                <div
                                    key={item.id}
                                    className="search-result-card glass"
                                    onClick={() => onResultClick(item)}
                                >
                                    <img
                                        src={item.poster_path || item.profile_path ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.profile_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen'}
                                        alt=""
                                    />
                                    <div className="result-info">
                                        <h4>{item.title || item.name}</h4>
                                        <p>{item.media_type === 'movie' ? 'Película' : item.media_type === 'tv' ? 'Serie' : 'Persona'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* SECCIÓN DE SUGERENCIAS (Cuando no hay búsqueda activa) */
                        <div className="search-suggestions">
                            {/* Sugerencias por Ánimo */}
                            <div className="suggestion-section">
                                <h3><Zap size={18} /> ¿Qué te apetece hoy?</h3>
                                <div className="chips">
                                    {[
                                        { label: 'Acción Pura 🔥', query: 'action' },
                                        { label: 'Emocionarme 😭', query: 'drama' },
                                        { label: 'Reírme un rato 🍕', query: 'comedy' },
                                        { label: 'Terror Siniestro 💀', query: 'horror' },
                                        { label: 'Pura Fantasía ✨', query: 'fantasy' }
                                    ].map(mood => (
                                        <button key={mood.label} className="chip mood" onClick={() => setQuery(mood.query)}>
                                            {mood.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tendencias Populares */}
                            <div className="suggestion-section">
                                <h3><TrendingUp size={18} /> Tendencias Sugeridas</h3>
                                <div className="chips">
                                    {['Marvel', 'Batman', 'Disney', 'Oscar'].map(term => (
                                        <button key={term} className="chip" onClick={() => setQuery(term)}>{term}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Historial Reciente */}
                            {recentSearches.length > 0 && (
                                <div className="suggestion-section">
                                    <h3><History size={18} /> Búsquedas Recientes</h3>
                                    <div className="chips">
                                        {recentSearches.map(term => (
                                            <div key={term} className="chip-wrapper">
                                                <button className="chip" onClick={() => setQuery(term)}>{term}</button>
                                                <button className="chip-delete" onClick={() => onRemoveRecent(term)} title="Eliminar"><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartSearch;
