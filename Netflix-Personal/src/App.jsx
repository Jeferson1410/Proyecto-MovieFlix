/**
 * ARCHIVO: App.jsx
 * Componente Principal y Orquestador de MATHUASSFLIX.
 * Gestiona el estado global de la aplicación, incluyendo la persistencia de datos (localStorage),
 * la comunicación con la API de TMDB, el sistema de navegación por pestañas y el control de modales.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTACIÓN DE COMPONENTES ---
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import MovieRow from './components/MovieRow/MovieRow';
import MovieGrid from './components/MovieGrid/MovieGrid';
import MovieDetails from './components/MovieDetails/MovieDetails';
import SmartSearch from './components/SmartSearch/SmartSearch';
import tmdb, { requests } from './services/tmdb';
import FilterBar from './components/FilterBar/FilterBar';
import CinemaPlayer from './components/CinemaPlayer/CinemaPlayer';
import Notifications from './components/Notifications/Notifications';
import ActorDetails from './components/ActorDetails/ActorDetails';
import FullCast from './components/FullCast/FullCast';
import AuthModal from './components/AuthModal';
import { useAuth } from './services/authContext';
import { db } from './services/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import './App.css';

function App() {
  // --- ESTADOS DE DATOS Y SECCIONES ---
  const [activeTab, setActiveTab] = useState('home');             // Sección activa: 'home', 'movies', 'tv', 'trending', 'mylist'
  const [featuredMovie, setFeaturedMovie] = useState(null);       // Película destacada para el Banner (Hero)
  const [trending, setTrending] = useState([]);                  // Contenido en tendencia (fila horizontal)
  const [actionMovies, setActionMovies] = useState([]);          // Fila de acción
  const [comedyMovies, setComedyMovies] = useState([]);          // Fila de comedia
  const [topRated, setTopRated] = useState([]);                  // Fila de los más valorados

  // --- ESTADOS DE PERSISTENCIA Y LISTAS DE USUARIO ---
  const [moviesList, setMoviesList] = useState([]);              // Resultados paginados para la pestaña Películas
  const [seriesList, setSeriesList] = useState([]);              // Resultados paginados para la pestaña Series
  const [myList, setMyList] = useState([]);                      // Lista de favoritos guardada por el usuario
  const [recentSearches, setRecentSearches] = useState([]);      // Historial de términos buscados
  const [likedMovies, setLikedMovies] = useState([]);            // Registro de likes para sugerencias IA
  const [dislikedMovies, setDislikedMovies] = useState([]);      // Registro de dislikes para filtrar contenido
  const { user } = useAuth();                                    // Usuario actual de Firebase
  const [showAuthModal, setShowAuthModal] = useState(false);      // Control del modal de autenticación
  const [authMode, setAuthMode] = useState(true);                 // true: login, false: signup

  // --- ESTADOS DE UI, REPRODUCTOR Y MODALES ---
  const [selectedMovie, setSelectedMovie] = useState(null);      // Objeto de película para mostrar en detalles
  const [selectedActorId, setSelectedActorId] = useState(null); // ID del actor para mostrar biografía
  const [showFullCast, setShowFullCast] = useState(false);        // Visibilidad del reparto extendido
  const [isSearchOpen, setIsSearchOpen] = useState(false);        // Visibilidad del buscador inteligente
  const [autoListen, setAutoListen] = useState(false);            // Disparador de voz automático
  const [trailerKey, setTrailerKey] = useState(null);            // ID de YouTube para el reproductor
  const [showTrailer, setShowTrailer] = useState(false);          // Visibilidad del "Modo Cine"
  const [loading, setLoading] = useState(false);                  // Indicador de carga de datos
  const [notifications, setNotifications] = useState([]);        // Array de avisos flotantes (Toasts)
  const [recommendations, setRecommendations] = useState([]);    // Sugerencias personalizadas (AI Select)
  const [theme, setTheme] = useState(localStorage.getItem('mathuassflix-theme') || 'purple'); // Tema de color
  const [filters, setFilters] = useState({ genre: '', year: '', rating: '' }); // Filtros de búsqueda global
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);      // Menú lateral móvil
  const [history, setHistory] = useState([]);                    // Historial de visualización
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);    // Menú desplegable de perfil
  const [searchQuery, setSearchQuery] = useState('');            // Texto enviado al buscador inteligente

  // Función auxiliar para eliminar duplicados y limpiar contenido sin imágenes
  const getUniqueItems = (oldItems, newItems) => {
    // Filtramos primero los nuevos que NO tengan póster o nombre (datos basura)
    const validNewItems = newItems.filter(m => m.poster_path && (m.title || m.name));

    // Combinamos y eliminamos por ID real
    const combined = [...oldItems, ...validNewItems];
    const uniqueIds = new Set();
    return combined.filter(item => {
      if (!item.id || uniqueIds.has(item.id)) return false;
      uniqueIds.add(item.id);
      return true;
    });
  };

  /**
   * Abre el modal de búsqueda con opciones de configuración rápida.
   */
  const handleSearchOpen = (listen = false, query = '') => {
    setAutoListen(listen);
    setSearchQuery(query);
    setIsSearchOpen(true);
  };

  // --- EFECTOS DE INICIALIZACIÓN (Lifecycle) ---

  // EFECTO: Sincronización en tiempo real con Firebase Firestore
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, limpiamos estados y mostramos modal de login
      setMyList([]);
      setRecentSearches([]);
      setLikedMovies([]);
      setShowAuthModal(false); // No forzar login al entrar
      return;
    }

    setShowAuthModal(false);

    // Escuchador en tiempo real para el documento del usuario
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMyList(data.mylist || []);
        setLikedMovies(data.likes || []);
        setDislikedMovies(data.dislikes || []);
        setHistory(data.history || []);
      }
    });

    // Carga inicial de datos locales para búsquedas y para el historial de invitados
    const savedRecent = JSON.parse(localStorage.getItem('mathuassflix-recent')) || [];
    setRecentSearches(savedRecent);

    if (!user) {
      const savedHistory = JSON.parse(localStorage.getItem('mathuassflix-guest-history')) || [];
      setHistory(savedHistory);
    }

    return () => unsubscribe();
  }, [user]);

  // Sincroniza el tema visual con los estilos CSS y el almacenamiento local
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mathuassflix-theme', theme);
  }, [theme]);

  // Maneja el bloqueo de scroll del body cuando hay una capa interactiva abierta (overlay)
  useEffect(() => {
    const isOverlayOpen = isSidebarOpen || isSearchOpen || selectedMovie || showTrailer || selectedActorId || showFullCast || isUserMenuOpen;
    document.body.style.overflow = isOverlayOpen ? 'hidden' : 'unset';
  }, [isSidebarOpen, isSearchOpen, selectedMovie, showTrailer, selectedActorId, showFullCast, isUserMenuOpen]);

  /**
   * EFECTO: Carga de los datos de la Home (Dashboard Principal)
   */
  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [trend, top, action, comedy] = await Promise.all([
          tmdb.get(requests.trending(1)),
          tmdb.get(requests.topRated),
          tmdb.get(requests.actionMovies),
          tmdb.get(requests.comedyMovies)
        ]);

        // Filtramos resultados con datos incompletos
        const validTrend = trend.data.results.filter(m => m.poster_path && (m.title || m.name));
        const validTop = top.data.results.filter(m => m.poster_path && (m.title || m.name));
        const validAction = action.data.results.filter(m => m.poster_path && (m.title || m.name));
        const validComedy = comedy.data.results.filter(m => m.poster_path && (m.title || m.name));

        setTrending(validTrend);
        setTopRated(validTop);
        setActionMovies(validAction);
        setComedyMovies(validComedy);

        // Selección inteligente: Filtramos películas que tengan imagen de fondo, sinopsis y calificación
        const highQualityMovies = validTrend.filter(m => m.backdrop_path && m.overview && m.overview.length > 50);

        // Elegimos de las de "Alta Calidad"
        const sourceList = highQualityMovies.length > 0 ? highQualityMovies : validTrend;
        const randomItem = sourceList[Math.floor(Math.random() * sourceList.length)];

        // Obtiene detalles extendidos (detectando si es Serie o Película)
        try {
          const isTV = !randomItem.title && randomItem.name;
          const res = await tmdb.get(isTV ? requests.tvDetails(randomItem.id) : requests.movieDetails(randomItem.id));
          let itemData = res.data;

          // Traducción inteligente si falta descripción en español
          if (!itemData.overview || itemData.overview.length < 10) {
            const enRes = await tmdb.get(isTV ? requests.tvDetails(randomItem.id) : requests.movieDetails(randomItem.id), {
              params: { language: 'en-US' }
            });
            if (enRes.data.overview) {
              const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(enRes.data.overview.substring(0, 500))}&langpair=en|es`);
              const transData = await transRes.json();
              itemData.overview = transData.responseData.translatedText || enRes.data.overview;
            }
          }
          // Aseguramos que conserve el tipo de medio y la información completa de créditos e imágenes
          setFeaturedMovie({ ...itemData, media_type: isTV ? 'tv' : 'movie' });
        } catch (e) {
          setFeaturedMovie({ ...randomItem, media_type: !randomItem.title && randomItem.name ? 'tv' : 'movie' });
        }
      } catch (err) {
        console.error("Error al poblar la página principal:", err);
      }
    }
    fetchHomeData();
  }, []);

  /**
   * LÓGICA DE PAGINACIÓN Y FILTRADO
   * Se dispara cada vez que el usuario cambia de pestaña o aplica filtros.
   */
  const [pagination, setPagination] = useState({ movies: 1, tv: 1, trending: 1 });
  const [hasMore, setHasMore] = useState({ movies: true, tv: true, trending: true });

  useEffect(() => {
    async function fetchTabData() {
      // No cargar datos adicionales si estamos en secciones estáticas o listas personales
      if (activeTab === 'home' || activeTab === 'mylist') return;

      // Solo mostramos el spinner de carga total si la lista actual está vacía para evitar rebotes visuales
      const isEmpty = (activeTab === 'movies' && moviesList.length === 0) ||
        (activeTab === 'tv' && seriesList.length === 0) ||
        (activeTab === 'trending' && trending.length === 0);

      if (isEmpty && pagination[activeTab === 'trending' ? 'trending' : activeTab] === 1) {
        setLoading(true);
      }

      try {
        let res;
        if (activeTab === 'movies') {
          res = await tmdb.get(requests.movies(pagination.movies, filters.genre, filters.year, filters.rating));
          setMoviesList(prev => pagination.movies === 1 ? res.data.results : getUniqueItems(prev, res.data.results));
          setHasMore(prev => ({ ...prev, movies: res.data.page < res.data.total_pages }));
        } else if (activeTab === 'tv') {
          res = await tmdb.get(requests.series(pagination.tv, filters.genre, filters.year, filters.rating));
          setSeriesList(prev => pagination.tv === 1 ? res.data.results : getUniqueItems(prev, res.data.results));
          setHasMore(prev => ({ ...prev, tv: res.data.page < res.data.total_pages }));
        } else if (activeTab === 'trending') {
          res = await tmdb.get(requests.trending(pagination.trending));
          setTrending(prev => pagination.trending === 1 ? res.data.results : getUniqueItems(prev, res.data.results));
          setHasMore(prev => ({ ...prev, trending: res.data.page < res.data.total_pages }));
        }
      } catch (err) {
        console.error("Error en carga paginada:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTabData();
  }, [activeTab, filters, pagination]);

  // Reinicia estados al cambiar de sección
  useEffect(() => {
    setPagination({ movies: 1, tv: 1, trending: 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, filters]);

  // --- HANDLERS DE INTERACCIÓN ---

  /**
   * Sistema de Notificaciones Flotantes
   */
  const showToast = (message, movie = null, type = 'success') => {
    const id = Date.now();
    const newNotif = { id, message, movieTitle: movie?.title || movie?.name, movieImage: movie?.poster_path, type };
    setNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  /**
   * Carga detalles de una película/serie y prepara el trailer
   * @param {Object} movie - Datos básicos de la película
   * @param {string} source - Título de la sección origen para la transición layoutId
   */
  const handleMovieClick = async (movie, source = '') => {
    try {
      const isTV = !movie.title && movie.name;
      const res = await tmdb.get(isTV ? requests.tvDetails(movie.id) : requests.movieDetails(movie.id));
      let movieData = res.data;

      // LÓGICA DE TRADUCCIÓN DE RESPALDO: Si no hay sinopsis en español
      if (!movieData.overview || movieData.overview.length < 10) {
        try {
          const enRes = await tmdb.get(isTV ? requests.tvDetails(movie.id) : requests.movieDetails(movie.id), {
            params: { language: 'en-US' }
          });

          if (enRes.data.overview) {
            const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(enRes.data.overview.substring(0, 500))}&langpair=en|es`);
            const transData = await transRes.json();
            movieData.overview = transData.responseData.translatedText || enRes.data.overview;
          }
        } catch (errTranslate) {
          console.error("Error traduciendo sinopsis:", errTranslate);
        }
      }

      // Construimos el layoutId único que coincide con el del póster en la fila/rejilla
      const layoutId = source ? `poster-${movie.id}-${source.replace(/\s+/g, '')}` : null;
      const fullData = { ...movieData, media_type: isTV ? 'tv' : 'movie', layoutId };

      setSelectedMovie(fullData);

      // Busca el trailer oficial en la lista de videos
      const trailer = movieData.videos?.results.find(v => v.type === 'Trailer') || movieData.videos?.results[0];
      setTrailerKey(trailer?.key);
      return trailer?.key;
    } catch (err) {
      showToast('⚠️ No pudimos cargar los detalles', null, 'error');
      return null;
    }
  };

  /**
   * Gestión de Favoritos (Mi Lista) con Firebase
   */
  const toggleMyList = async (movie) => {
    if (!user) return setShowAuthModal(true);

    const exists = myList.some(item => item.id === movie.id);
    const userRef = doc(db, "users", user.uid);

    // Notificación inmediata para mejor UX (Optimistic)
    showToast(exists ? 'Quitado de tu lista' : '¡Añadido a tu lista!', movie, 'list');

    try {
      await updateDoc(userRef, {
        mylist: exists ? arrayRemove(movie) : arrayUnion(movie)
      });
    } catch (error) {
      console.error("Error actualizando lista:", error);
    }
  };

  /**
   * Inicia el modo de reproducción de video (Reproductor)
   */
  const handlePlayTrailer = async (movie) => {
    const key = await handleMovieClick(movie);
    if (key) {
      setShowTrailer(true);

      const updatedMovie = {
        id: movie.id,
        title: movie.title || movie.name,
        name: movie.name || movie.title,
        poster_path: movie.poster_path,
        watchDate: new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      if (user) {
        // Modo Registrado: Persistencia en Firestore
        const userRef = doc(db, "users", user.uid);
        const newHistory = [updatedMovie, ...history.filter(item => item.id !== movie.id)].slice(0, 10);
        await updateDoc(userRef, { history: newHistory });
      } else {
        // Modo Invitado: Persistencia en localStorage
        const savedHistory = JSON.parse(localStorage.getItem('mathuassflix-guest-history')) || [];
        const newHistory = [updatedMovie, ...savedHistory.filter(item => item.id !== movie.id)].slice(0, 10);
        localStorage.setItem('mathuassflix-guest-history', JSON.stringify(newHistory));
        setHistory(newHistory);
      }
    } else {
      showToast('⚠️ Trailer no disponible actualmente', movie, 'error');
    }
  };

  /**
   * Limpia el historial de visualización
   */
  const handleClearHistory = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { history: [] });
    } else {
      localStorage.removeItem('mathuassflix-guest-history');
      setHistory([]);
    }
  };

  // --- MOTOR DE RENDERIZADO DINÁMICO ---
  const renderContent = () => {
    if (loading) return <div className="loading-spinner"></div>;

    switch (activeTab) {
      case 'home':
        return (
          <>
            <Hero
              movie={featuredMovie}
              onPlay={handlePlayTrailer}
              onInfo={handleMovieClick}
              onToggleList={toggleMyList}
              isInList={myList.some(m => m.id === featuredMovie?.id)}
              onLike={handleLike}
              onDislike={handleDislike}
              isLiked={likedMovies.some(m => m.id === featuredMovie?.id)}
              isDisliked={dislikedMovies.some(m => m.id === featuredMovie?.id)}
            />
            <div className="rows-container">
              <MovieRow title="Tendencias Ahora" movies={trending} onMovieClick={(m) => handleMovieClick(m, "Tendencias Ahora")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} />
              <MovieRow title="Favoritos de la Crítica" movies={topRated} onMovieClick={(m) => handleMovieClick(m, "Favoritos de la Crítica")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} />
              <MovieRow title="Acción Explosiva" movies={actionMovies} onMovieClick={(m) => handleMovieClick(m, "Acción Explosiva")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} />
              <MovieRow title="Risas Garantizadas" movies={comedyMovies} onMovieClick={(m) => handleMovieClick(m, "Risas Garantizadas")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} />
            </div>
          </>
        );
      case 'movies':
        return (
          <>
            <FilterBar filters={filters} onFilterChange={setFilters} type="movie" />
            <MovieGrid title="Catálogo de Películas" movies={moviesList} onMovieClick={(m) => handleMovieClick(m, "Catálogo de Películas")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} onLoadMore={() => setPagination(p => ({ ...p, movies: p.movies + 1 }))} hasMore={hasMore.movies} />
          </>
        );
      case 'tv':
        return (
          <>
            <FilterBar filters={filters} onFilterChange={setFilters} type="tv" />
            <MovieGrid title="Series y Documentales" movies={seriesList} onMovieClick={(m) => handleMovieClick(m, "Series y Documentales")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} onLoadMore={() => setPagination(p => ({ ...p, tv: p.tv + 1 }))} hasMore={hasMore.tv} />
          </>
        );
      case 'mylist':
        return <MovieGrid title="Mi Selección Personal" movies={myList} onMovieClick={(m) => handleMovieClick(m, "Mi Selección Personal")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} isMyListView={true} />;
      case 'trending':
        return <MovieGrid title="Lo Más Trendy de hoy" movies={trending} onMovieClick={(m) => handleMovieClick(m, "Tendencias")} myList={myList} onToggleList={toggleMyList} onPlay={handlePlayTrailer} onLoadMore={() => setPagination(p => ({ ...p, trending: p.trending + 1 }))} hasMore={hasMore.trending} />;
      default: return null;
    }
  };

  // Funciones simplificadas para Likes/Dislikes con Firebase
  const handleLike = async (movie) => {
    if (!user) return setShowAuthModal(true);
    const userRef = doc(db, "users", user.uid);
    showToast('¡Me encanta!', movie, 'like');
    try {
      await updateDoc(userRef, {
        likes: arrayUnion(movie),
        dislikes: arrayRemove(movie)
      });
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  };

  const handleDislike = async (movie) => {
    if (!user) return setShowAuthModal(true);
    const userRef = doc(db, "users", user.uid);
    showToast('No me interesa', movie, 'error');
    try {
      await updateDoc(userRef, {
        dislikes: arrayUnion(movie),
        likes: arrayRemove(movie)
      });
    } catch (error) {
      console.error("Error al dar dislike:", error);
    }
  };

  return (
    <div className="app">
      {/* Barra lateral: Navegación y Temas */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
        currentTheme={theme}
        onThemeChange={setTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onUserMenuToggle={() => { setIsSidebarOpen(false); setIsUserMenuOpen(true); }}
      />

      <main className="content-area">
        {/* Cabecera: Búsqueda y Perfil */}
        <Header
          onSearchOpen={handleSearchOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onUserMenuToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
          isUserMenuOpen={isUserMenuOpen}
          onCloseUserMenu={() => setIsUserMenuOpen(false)}
          onShowToast={showToast}
          likedMovies={likedMovies}
          history={history}
          onClearHistory={handleClearHistory}
          onAuthOpen={(isLogin) => {
            setAuthMode(isLogin ? 'login' : 'signup');
            setShowAuthModal(true);
          }}
        />

        {/* Sección de Contenido Dinámico */}
        {renderContent()}

        {/* Pie de página profesional */}
        <footer className="main-footer">
          <div className="footer-tmdb">
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
              alt="TMDB Logo"
              className="tmdb-logo"
            />
            <p className="tmdb-disclaimer">
              Este producto utiliza la API de TMDB pero no está respaldado ni certificado por TMDB.
            </p>
          </div>
          <p>MATHUASS<span>FLIX</span> &copy; 2026</p>
        </footer>
      </main>

      {/* Capas modales (Ancladas al root por portales) */}
      <SmartSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        autoListen={autoListen}
        setAutoListen={setAutoListen}
        recentSearches={recentSearches}
        onAddRecent={(term) => {
          const newList = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
          setRecentSearches(newList);
          localStorage.setItem('mathuassflix-recent', JSON.stringify(newList));
        }}
        onRemoveRecent={(term) => {
          const newList = recentSearches.filter(t => t !== term);
          setRecentSearches(newList);
          localStorage.setItem('mathuassflix-recent', JSON.stringify(newList));
        }}
        initialQuery={searchQuery}
        onResultClick={(item) => {
          if (item.media_type === 'person') {
            setIsSearchOpen(false);
            setSelectedActorId(item.id);
          } else {
            handleMovieClick(item);
          }
        }}
      />

      <MovieDetails
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={handlePlayTrailer}
        isInList={myList.some(item => item.id === selectedMovie?.id)}
        onToggleList={() => toggleMyList(selectedMovie)}
        onLike={handleLike}
        onDislike={handleDislike}
        isLiked={likedMovies.some(m => m.id === selectedMovie?.id)}
        isDisliked={dislikedMovies.some(m => m.id === selectedMovie?.id)}
        onActorClick={setSelectedActorId}
        onShowFullCast={() => setShowFullCast(true)}
      />

      <AnimatePresence>
        {showFullCast && selectedMovie && (
          <FullCast
            movie={selectedMovie}
            onClose={() => setShowFullCast(false)}
            onActorClick={(actorId) => {
              setSelectedActorId(actorId);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrailer && trailerKey && (
          <CinemaPlayer
            movie={selectedMovie || featuredMovie}
            trailerKey={trailerKey}
            onClose={() => setShowTrailer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedActorId && (
          <ActorDetails
            actorId={selectedActorId}
            onClose={() => setSelectedActorId(null)}
            onMovieClick={handleMovieClick}
          />
        )}
      </AnimatePresence>

      <Notifications notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onShowToast={showToast}
        initialIsLogin={authMode}
      />
    </div>
  );
}

export default App;