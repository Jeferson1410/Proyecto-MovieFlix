import { useEffect, useState, useRef } from "react";
import "./App.css";

// --- UTILIDAD DE NORMALIZACIÓN ---
const cleanText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Componente auxiliar para imágenes
const MovieImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`img-container ${className}`}>
      {!loaded && <div className="skeleton"></div>}
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${loaded ? 'img-loaded' : 'img-loading'}`}
        onLoad={() => setLoaded(true)} 
        loading="lazy"
      />
    </div>
  );
};

function App() {
  // --- ESTADOS PRINCIPALES ---
  const [movies, setMovies] = useState([]); // Tendencias y Resultados de búsqueda
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]); // Nuevo estado para similares

  // Estado para Categoría Seleccionada (Grid)
  const [categoryTitle, setCategoryTitle] = useState(null); 

  // Estado para Notificaciones
  const [notification, setNotification] = useState(null);

  // Categorías (Carruseles)
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  const [scifiMovies, setScifiMovies] = useState([]);

  // Estados de UI (Detalle y Reproductor)
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);

  // --- ESTADOS PARA TRADUCCIÓN ---
  const [translatedOverview, setTranslatedOverview] = useState(""); // Guarda el texto en español
  const [isTranslating, setIsTranslating] = useState(false);      // Para mostrar "Cargando..."

  // --- REFERENCIAS (Scroll) ---
  const carouselRef = useRef(null);     
  const castCarouselRef = useRef(null); 
  const actionRef = useRef(null);
  const comedyRef = useRef(null);
  const animationRef = useRef(null);
  const scifiRef = useRef(null);

  // --- CONSTANTES ---
  const API_URL = "https://api.themoviedb.org/3";
  const API_KEY = import.meta.env.VITE_API_KEY; 
  const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
  const IMAGE_PATH_POSTER = "https://image.tmdb.org/t/p/w500";

  // --- 1. FUNCIÓN DE BÚSQUEDA Y TENDENCIAS ---
  const fetchMovies = async (searchKey) => {
    const type = searchKey ? "search/movie" : "trending/movie/week";
    try {
      const { results: apiResults } = await fetch(
        `${API_URL}/${type}?api_key=${API_KEY}&query=${searchKey}&language=es-MX`
      ).then((res) => res.json());

      let finalResults = apiResults || [];

      // Filtrado local para mejorar la búsqueda
      if (searchKey) {
        const cleanSearch = cleanText(searchKey);
        const allLocalMovies = [
            ...actionMovies, ...comedyMovies, ...animationMovies, ...scifiMovies
        ];
        const localMatches = allLocalMovies.filter(movie => 
            cleanText(movie.title).includes(cleanSearch)
        );
        const combined = [...finalResults, ...localMatches];
        // Eliminar duplicados por ID
        const uniqueResults = Array.from(new Map(combined.map(m => [m.id, m])).values());
        finalResults = uniqueResults;
      }

      setMovies(finalResults);

      // Actualizar Hero solo si estamos en inicio
      if (!searchKey && !categoryTitle && finalResults.length > 0) {
        const randomIndex = Math.floor(Math.random() * finalResults.length);
        setHeroMovie(finalResults[randomIndex]);
        fetchMovieVideo(finalResults[randomIndex].id);
      }
    } catch (error) {
       console.log(error);
    }
  };

  // --- 2. FUNCIÓN PARA BUSCAR VIDEO (TRAILER) ---
  const fetchMovieVideo = async (id) => {
    try {
      let response = await fetch(`${API_URL}/movie/${id}/videos?api_key=${API_KEY}&language=es-MX`).then((res) => res.json());
      if (!response.results?.length) {
        // Si no hay en español, intentar en inglés
        response = await fetch(`${API_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`).then((res) => res.json());
      }
      if (response.results) {
        const youtubeVideos = response.results.filter((vid) => vid.site === "YouTube");
        let trailer = youtubeVideos.find((vid) => vid.type === "Trailer") || youtubeVideos[0];
        setTrailerKey(trailer ? trailer.key : null);
      }
    } catch (error) { console.log(error); }
  };

  // --- 3. FUNCIÓN PARA BUSCAR REPARTO ---
  const fetchMovieCast = async (id) => {
    try {
      const { cast } = await fetch(`${API_URL}/movie/${id}/credits?api_key=${API_KEY}&language=es-MX`).then((res) => res.json());
      setCast(cast.slice(0, 20)); 
    } catch (error) { console.log(error); }
  };

  // --- 4. FUNCIÓN PARA BUSCAR SIMILARES (Corregida y movida aquí dentro) ---
  // --- 4. FUNCIÓN PARA BUSCAR SIMILARES (MEJORADA) ---
  const fetchSimilarMovies = async (currentMovie) => {
    try {
      // Usamos el endpoint de recommendations que es más inteligente
      const response = await fetch(`${API_URL}/movie/${currentMovie.id}/recommendations?api_key=${API_KEY}&language=es-MX`);
      const data = await response.json();
      
      if (data.results) {
        // FILTRO DE CALIDAD:
        // 1. Que tenga póster (para que no se vea feo).
        // 2. Que comparta al menos un género con la película que estamos viendo.
        const filtered = data.results.filter(item => 
           item.poster_path && 
           item.genre_ids && 
           currentMovie.genre_ids &&
           item.genre_ids.some(genreId => currentMovie.genre_ids.includes(genreId))
        );

        // Guardamos solo las 6 mejores que pasaron el filtro
        setSimilarMovies(filtered.slice(0, 6));
      } else {
        setSimilarMovies([]);
      }
    } catch (error) {
      console.error("Error buscando similares:", error);
    }
  };

  // Helper para cargar categorías iniciales
  const fetchByGenre = async (genreId, setState) => {
    try {
      const { results } = await fetch(
        `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&include_adult=false&with_genres=${genreId}`
      ).then((res) => res.json());
      setState(results);
    } catch (error) { console.log(error); }
  };

  // Helper para cargar Grid de Categoría
  const loadCategoryGrid = async (genreId, title) => {
    setCategoryTitle(title); 
    setSearchTerm("");       
    try {
        const { results } = await fetch(
          `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&include_adult=false&with_genres=${genreId}`
        ).then((res) => res.json());
        setMovies(results); 
    } catch (error) { console.log(error); }
  };
// --- FUNCIÓN CARGAR MÁS (PAGINACIÓN) ---
  const loadMore = async (genreId, currentList, setList) => {
    // Calculamos la siguiente página matemáticamente
    const nextPage = Math.floor(currentList.length / 20) + 1;
    
    try {
      const url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&include_adult=false&with_genres=${genreId}&page=${nextPage}`;
      const { results } = await fetch(url).then(res => res.json());
      
      // Añadimos las nuevas a las que ya teníamos (Spread Operator)
      setList([...currentList, ...results]); 
    } catch (error) {
      console.error("Error cargando más:", error);
    }
  };
  // Vuelta al inicio
  const goHome = () => {
    setCategoryTitle(null);
    setSearchTerm("");
    fetchMovies(); 
  };

  // Efecto inicial
  useEffect(() => {
    fetchMovies();
    fetchByGenre(28, setActionMovies);
    fetchByGenre(35, setComedyMovies);
    fetchByGenre(16, setAnimationMovies);
    fetchByGenre(878, setScifiMovies);
    const movieFavorites = JSON.parse(localStorage.getItem('react-movie-app-favorites'));
    if (movieFavorites) setFavorites(movieFavorites);
  }, []);

  // --- GESTIÓN DE FAVORITOS Y NOTIFICACIONES ---
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
        setNotification(null);
    }, 3000); 
  };

  const toggleFavorite = (movie) => {
    const newFavoriteList = [...favorites];
    const isFavorite = newFavoriteList.find((fav) => fav.id === movie.id);

    if (isFavorite) {
      const updatedList = newFavoriteList.filter((fav) => fav.id !== movie.id);
      setFavorites(updatedList);
      localStorage.setItem('react-movie-app-favorites', JSON.stringify(updatedList));
      showNotification("💔 Eliminado de Favoritos");
    } else {
      newFavoriteList.push(movie);
      setFavorites(newFavoriteList);
      localStorage.setItem('react-movie-app-favorites', JSON.stringify(newFavoriteList));
      showNotification("❤️ Agregado a Favoritos");
    }
  };
  
  const isFav = (id) => favorites.some((fav) => fav.id === id);

  const handleSearch = (e) => {
    e.preventDefault();
    setCategoryTitle(null);
    fetchMovies(searchTerm);
  };

  // Funciones de Scroll
  const scroll = (ref, direction) => {
    if (ref.current) ref.current.scrollBy({ left: direction === "left" ? -800 : 800, behavior: "smooth" });
  };
  const scrollCast = (direction) => {
    if (castCarouselRef.current) castCarouselRef.current.scrollBy({ left: direction === "left" ? -350 : 350, behavior: "smooth" });
  };

  // --- SELECCIÓN DE PELÍCULA (Abre Detalle) ---
  const selectMovie = async (movie, playNow = false) => {
    setTranslatedOverview("");
    setPlayTrailer(false);
    setTrailerKey(null);
    setCast([]);
    setSimilarMovies([]); // Limpiamos similares anteriores
    setSelectedMovie(movie);
    document.body.style.overflow = "hidden"; // Bloquea el scroll del fondo
    
    // Ejecutamos las llamadas en paralelo
    await Promise.all([
        fetchMovieVideo(movie.id),
        fetchMovieCast(movie.id),
        fetchSimilarMovies(movie) // <--- Llamada a la nueva función corregida
    ]);

    if (playNow) setPlayTrailer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube el scroll dentro del modal si es necesario
  };

  const closeDetail = () => {
    setSelectedMovie(null);
    setPlayTrailer(false);
    document.body.style.overflow = "auto"; // Reactiva el scroll
  };

  // Función para traducir usando una API gratuita
  const handleTranslate = async (text) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      // Usamos la API de MyMemory (gratuita para uso moderado)
      // Traduce de Inglés (en) a Español (es)
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`);
      const data = await response.json();
      
      // Guardamos la traducción
      setTranslatedOverview(data.responseData.translatedText);
    } catch (error) {
      console.error("Error al traducir:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* --- NOTIFICACIÓN TOAST --- */}
      {notification && (
        <div className="toast-notification">
            <span className="toast-icon">ℹ️</span> {notification}
        </div>
      )}

      {selectedMovie ? (
        /* ================= VISTA DETALLE (MODAL COMPLETO) ================= */
        <div className="movie-detail">
          <button className="back-btn" onClick={closeDetail}>← Volver</button>

          {playTrailer && trailerKey ? (
             <div className="video-overlay" onClick={() => setPlayTrailer(false)} 
                style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
                <div className="video-content-wrapper" onClick={(e) => e.stopPropagation()} 
                    style={{position: 'relative', width: '90%', maxWidth: '1200px', aspectRatio: '16/9', backgroundColor: '#000', boxShadow: '0 0 30px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden'}}>
                    <button onClick={() => setPlayTrailer(false)}
                        style={{position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} title="Trailer" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                </div>
             </div>
          ) : (
            <>
              {/* HEADER DEL DETALLE */}
              <div className="detail-hero" style={{ backgroundImage: `url("${IMAGE_PATH}${selectedMovie.backdrop_path}")` }}>
                <div className="movie-detail-overlay"></div>
                <div className="detail-content">
                    <img src={`${IMAGE_PATH_POSTER}${selectedMovie.poster_path}`} alt={selectedMovie.title} className="detail-poster"/>
                    <div className="detail-info">
                      <h1 className="detail-title">{selectedMovie.title}</h1>
                      <div style={{ display: 'flex', gap: '15px', color: '#ccc', fontSize: '0.9rem', marginBottom: '15px' }}>
                        <span>{selectedMovie.release_date?.split('-')[0]}</span>
                        <span>•</span>
                        <span style={{ border: '1px solid #ccc', padding: '0 4px', fontSize: '0.7rem', borderRadius: '2px' }}>HD</span>
                      </div>
                      <div className="overview-container">
                      <p className="detail-overview">
                          {/* Si ya tradujimos, mostramos eso. Si no, mostramos el original */}
                          {translatedOverview ? translatedOverview : selectedMovie.overview}
                      </p>

                      {/* Botón de traducir: Solo aparece si NO hay traducción aún y hay texto para traducir */}
                      {!translatedOverview && selectedMovie.overview && (
                          <button 
                              onClick={() => handleTranslate(selectedMovie.overview)}
                              disabled={isTranslating}
                              style={{
                                  marginTop: '10px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  color: 'white',
                                  padding: '8px 16px',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.3s ease'
                              }}
                          >
                              {isTranslating ? (
                                  <span>🔄 Traduciendo...</span>
                              ) : (
                                  <span>🌐 Traducir al español</span>
                              )}
                          </button>
                      )}
                  </div>
                      <div className="hero-buttons">
                          {trailerKey ? <button className="btn btn-play" onClick={() => setPlayTrailer(true)}>▶ Ver Trailer</button> : <button className="btn btn-info" disabled>No Disponible</button>}
                          <button onClick={() => toggleFavorite(selectedMovie)} className="btn btn-fav">
                          {isFav(selectedMovie.id) ? "❤️ En mi lista" : "➕ Agregar a Mi lista"} </button>
                      </div>
                      <p style={{marginTop: '20px', color: '#aaa'}}>Valoración: ⭐ {selectedMovie.vote_average}</p>
                    </div>
                </div>
              </div>

              {/* CONTENIDO INFERIOR DEL DETALLE */}
              <div className="movie-content-below">
                 
                 {/* REPARTO */}
                 {cast.length > 0 && (
                  <div className="cast-section-wrapper">
                    <h3 className="cast-title">Reparto Principal</h3>
                    <div className="cast-row-container">
                      <button className="cast-arrow-btn" onClick={() => scrollCast("left")}>&#10094;</button>
                      <div className="cast-scroll-area" ref={castCarouselRef}>
                        {cast.map((actor) => actor.profile_path && (
                            <div key={actor.id} className="cast-card">
                              <img src={`${IMAGE_PATH_POSTER}${actor.profile_path}`} alt={actor.name} className="cast-img"/>
                              <p className="actor-name">{actor.name}</p>
                              <p className="character-name">{actor.character}</p>
                            </div>
                        ))}
                      </div>
                      <button className="cast-arrow-btn" onClick={() => scrollCast("right")}>&#10095;</button>
                    </div>
                  </div>
                )}

                {/* --- SECCIÓN DE PELÍCULAS SIMILARES --- */}
                <div className="container" style={{padding: '20px 40px'}}>
                  <h3 style={{color: 'white', marginBottom: '20px', borderLeft: '4px solid #e50914', paddingLeft: '10px'}}>También podría gustarte</h3>
                  
                  <div className="row" style={{display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center'}}>
                    {similarMovies.slice(0, 6).map((similar) => (
                      <div 
                        key={similar.id} 
                        style={{ width: '160px', cursor: "pointer", transition: 'transform 0.3s' }}
                        className="similar-card"
                        onClick={() => selectMovie(similar)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{position: 'relative', borderRadius: '8px', overflow: 'hidden'}}>
                          <img
                            src={`${IMAGE_PATH_POSTER + similar.poster_path}`}
                            alt={similar.title}
                            style={{ width: "100%", height: "240px", objectFit: "cover" }}
                          />
                        </div>
                        <div className="mt-2">
                          <p style={{color: '#ddd', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '5px'}}>{similar.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {similarMovies.length === 0 && (
                    <p style={{color: 'gray'}}>No se encontraron títulos similares.</p>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      ) : (
        /* ================= VISTA PRINCIPAL (HOME) ================= */
        <>
          <nav className="navbar">
            <h2 className="logo" onClick={goHome}>MATHUASSFLIX</h2>
            
            <div className="nav-links">
                <span className="nav-link" onClick={goHome}>Inicio</span>
                <span className="nav-link" onClick={() => loadCategoryGrid(28, "Acción")}>Acción</span>
                <span className="nav-link" onClick={() => loadCategoryGrid(35, "Comedia")}>Comedia</span>
                <span className="nav-link" onClick={() => loadCategoryGrid(16, "Animación")}>Animación</span>
                <span className="nav-link" onClick={() => loadCategoryGrid(878, "Ciencia Ficción")}>Sci-Fi</span>
            </div>

            <form onSubmit={handleSearch} className="search-box">
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value === "") fetchMovies(); 
                }}
              />
              <button type="submit">🔍</button>
            </form>
          </nav>

          {/* RENDERIZADO CONDICIONAL: ¿HOME O GRID? */}
          {searchTerm || categoryTitle ? (
            /* --- VISTA GRID (Búsqueda o Categoría) --- */
            <div className="grid-container">
                <h2 className="grid-title">
                    {searchTerm ? `Resultados de búsqueda: "${searchTerm}"` : `${categoryTitle}`}
                </h2>
                <div className="movie-grid">
                    {movies.map((movie) => movie.poster_path && (
                        <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                            <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                            <div className="movie-info"><h4>{movie.title}</h4></div>
                        </div>
                    ))}
                    {movies.length === 0 && <p style={{color: 'gray'}}>No se encontraron resultados.</p>}
                </div>
            </div>
          ) : (
            /* --- VISTA HOME CLÁSICA (Carruseles) --- */
            <>
              {heroMovie && (
                <div className="hero" style={{ backgroundImage: `url("${IMAGE_PATH}${heroMovie.backdrop_path}")` }}>
                  <div className="hero-content">
                    <h1 className="hero-title">{heroMovie.title}</h1>
                    <p className="hero-overview">{heroMovie.overview}</p>
                    <div className="hero-buttons">
                      <button onClick={() => selectMovie(heroMovie, true)} className="btn btn-play">▶ Ver Trailer</button>
                      <button onClick={() => selectMovie(heroMovie)} className="btn btn-info">ℹ Más info</button>
                      <button onClick={() => toggleFavorite(heroMovie)} className="btn btn-fav">
                        {isFav(heroMovie.id) ? "❤️ Quitar" : "🤍 Agregar"}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN DE FAVORITOS */}
              {favorites.length > 0 && (
                <div className="carousel-container">
                  <h2 className="section-title">Mi Lista de Favoritos❤️</h2>
                  <div className="carousel-wrapper">
                    <div className="carousel" style={{ overflowX: 'auto', display: 'flex', gap: '10px', paddingBottom: '20px' }}>
                      {favorites.map((movie) => (
                          <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)} style={{ flex: '0 0 auto' }}>
                          <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                          <div className="movie-info"><h4>{movie.title}</h4></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Carruseles normales */}
              <div className="carousel-container">
                <h2 className="section-title">Tendencias ahora</h2>
                <div className="carousel-wrapper">
                  <button className="arrow-btn arrow-left" onClick={() => scroll(carouselRef, "left")}>&#10094;</button>
                  <div className="carousel" ref={carouselRef}>
                    {movies.map((movie) => movie.poster_path && (
                        <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                          <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                          <div className="movie-info"><h4>{movie.title}</h4></div>
                        </div>
                    ))}
                  </div>
                  <button className="arrow-btn arrow-right" onClick={() => scroll(carouselRef, "right")}>&#10095;</button>
                </div>
              </div>

              <div className="carousel-container">
                <h2 className="section-title">Acción y Adrenalina</h2>
                <div className="carousel-wrapper">
                  <button className="arrow-btn arrow-left" onClick={() => scroll(actionRef, "left")}>&#10094;</button>
                  <div className="carousel" ref={actionRef}>
                    {actionMovies.map((movie) => movie.poster_path && (
                      <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                        <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                        <div className="movie-info"><h4>{movie.title}</h4></div>
                      </div>
                    ))}
                    {/* 2. EL BOTÓN MÁGICO AL FINAL */}
                    <div className="load-more-card" onClick={() => loadMore(28, actionMovies, setActionMovies)}>
                      <span className="plus-icon">+</span>
                      <span>Cargar más</span>
                    </div>
                  </div>
                  <button className="arrow-btn arrow-right" onClick={() => scroll(actionRef, "right")}>&#10095;</button>
                </div>
              </div>
              
              <div className="carousel-container">
                <h2 className="section-title">Comedias Populares</h2>
                <div className="carousel-wrapper">
                  <button className="arrow-btn arrow-left" onClick={() => scroll(comedyRef, "left")}>&#10094;</button>
                  <div className="carousel" ref={comedyRef}>
                    {comedyMovies.map((movie) => movie.poster_path && (
                      <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                        <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                        <div className="movie-info"><h4>{movie.title}</h4></div>
                      </div>
                    ))}
                    <div className="load-more-card" onClick={() => loadMore(35, comedyMovies, setComedyMovies)}>
                      <span className="plus-icon">+</span>
                      <span>Cargar más</span>
                    </div>
                  </div>      
                  <button className="arrow-btn arrow-right" onClick={() => scroll(comedyRef, "right")}>&#10095;</button>
                </div>
              </div>
              
               <div className="carousel-container">
                <h2 className="section-title">Películas de Animación</h2>
                <div className="carousel-wrapper">
                  <button className="arrow-btn arrow-left" onClick={() => scroll(animationRef, "left")}>&#10094;</button>
                  <div className="carousel" ref={animationRef}>
                    {animationMovies.map((movie) => movie.poster_path && (
                      <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                        <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                        <div className="movie-info"><h4>{movie.title}</h4></div>
                      </div>
                    ))}
                    <div className="load-more-card" onClick={() => loadMore(16, animationMovies, setAnimationMovies)}>
                      <span className="plus-icon">+</span>
                      <span>Cargar más</span>
                    </div>
                  </div>
                  <button className="arrow-btn arrow-right" onClick={() => scroll(animationRef, "right")}>&#10095;</button>
                </div>
              </div>
              <div className="carousel-container">
                <h2 className="section-title">Ciencia Ficción y Fantasía</h2>
                <div className="carousel-wrapper">
                  <button className="arrow-btn arrow-left" onClick={() => scroll(scifiRef, "left")}>&#10094;</button>
                  <div className="carousel" ref={scifiRef}>
                    {scifiMovies.map((movie) => movie.poster_path && (
                      <div key={movie.id} className="movie-card" onClick={() => selectMovie(movie)}>
                        <MovieImage src={`${IMAGE_PATH_POSTER + movie.poster_path}`} alt={movie.title} className="movie-img" />
                        <div className="movie-info"><h4>{movie.title}</h4></div>
                      </div>
                    ))}
                    <div className="load-more-card" onClick={() => loadMore(878, scifiMovies, setScifiMovies)}>
                      <span className="plus-icon">+</span>
                      <span>Cargar más</span>
                    </div>
                  </div>
                  <button className="arrow-btn arrow-right" onClick={() => scroll(scifiRef, "right")}>&#10095;</button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;