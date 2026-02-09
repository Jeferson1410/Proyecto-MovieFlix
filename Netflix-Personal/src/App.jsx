import { useEffect, useState, useRef } from "react";
import "./App.css";

// Importamos los nuevos componentes
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import CategoryRow from "./components/CategoryRow";
import RatingCircle from "./components/RatingCircle"; // Asumiendo que está en src/

// --- UTILIDAD DE NORMALIZACIÓN ---
const cleanText = (text) => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function App() {
  // --- ESTADOS PRINCIPALES ---
  const [movies, setMovies] = useState([]); 
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]); 

  const [categoryTitle, setCategoryTitle] = useState(null); 
  const [notification, setNotification] = useState(null);

  // Categorías
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  const [scifiMovies, setScifiMovies] = useState([]);

  // UI Detalle
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);

  // Traducción
  const [translatedOverview, setTranslatedOverview] = useState(""); 
  const [isTranslating, setIsTranslating] = useState(false);      

  // Refs
  const carouselRef = useRef(null);     
  const castCarouselRef = useRef(null); 
  const actionRef = useRef(null);
  const comedyRef = useRef(null);
  const animationRef = useRef(null);
  const scifiRef = useRef(null);

  // Constantes
  const API_URL = "https://api.themoviedb.org/3";
  const API_KEY = import.meta.env.VITE_API_KEY; 
  const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
  const IMAGE_PATH_POSTER = "https://image.tmdb.org/t/p/w500";

  // --- LOGICA (Se mantiene igual) ---
  const fetchMovies = async (searchKey) => {
    const type = searchKey ? "search/movie" : "trending/movie/week";
    try {
      const { results: apiResults } = await fetch(
        `${API_URL}/${type}?api_key=${API_KEY}&query=${searchKey}&language=es-MX`
      ).then((res) => res.json());

      let finalResults = apiResults || [];

      if (searchKey) {
        const cleanSearch = cleanText(searchKey);
        const allLocalMovies = [ ...actionMovies, ...comedyMovies, ...animationMovies, ...scifiMovies ];
        const localMatches = allLocalMovies.filter(movie => 
            cleanText(movie.title).includes(cleanSearch)
        );
        const combined = [...finalResults, ...localMatches];
        const uniqueResults = Array.from(new Map(combined.map(m => [m.id, m])).values());
        finalResults = uniqueResults;
      }

      setMovies(finalResults);

      if (!searchKey && !categoryTitle && finalResults.length > 0) {
        const randomIndex = Math.floor(Math.random() * finalResults.length);
        setHeroMovie(finalResults[randomIndex]);
        fetchMovieVideo(finalResults[randomIndex].id);
      }
    } catch (error) { console.log(error); }
  };

  const fetchMovieVideo = async (id) => {
    try {
      let response = await fetch(`${API_URL}/movie/${id}/videos?api_key=${API_KEY}&language=es-MX`).then((res) => res.json());
      if (!response.results?.length) {
        response = await fetch(`${API_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`).then((res) => res.json());
      }
      if (response.results) {
        const youtubeVideos = response.results.filter((vid) => vid.site === "YouTube");
        let trailer = youtubeVideos.find((vid) => vid.type === "Trailer") || youtubeVideos[0];
        setTrailerKey(trailer ? trailer.key : null);
      }
    } catch (error) { console.log(error); }
  };

  const fetchMovieCast = async (id) => {
    try {
      const { cast } = await fetch(`${API_URL}/movie/${id}/credits?api_key=${API_KEY}&language=es-MX`).then((res) => res.json());
      setCast(cast.slice(0, 20)); 
    } catch (error) { console.log(error); }
  };

  const fetchSimilarMovies = async (currentMovie) => {
    try {
      const response = await fetch(`${API_URL}/movie/${currentMovie.id}/recommendations?api_key=${API_KEY}&language=es-MX`);
      const data = await response.json();
      if (data.results) {
        const filtered = data.results.filter(item => 
           item.poster_path && item.genre_ids && currentMovie.genre_ids &&
           item.genre_ids.some(genreId => currentMovie.genre_ids.includes(genreId))
        );
        setSimilarMovies(filtered.slice(0, 6));
      } else {
        setSimilarMovies([]);
      }
    } catch (error) { console.error("Error buscando similares:", error); }
  };

  const fetchMoviesByActor = async (actorId, actorName) => {
    try {
      closeDetail();
      setCategoryTitle(`Películas de: ${actorName}`);
      setSearchTerm("");
      const { results } = await fetch(
        `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&with_people=${actorId}`
      ).then((res) => res.json());
      setMovies(results);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { console.error(error); }
  };

  const fetchByGenre = async (genreId, setState) => {
    try {
      const { results } = await fetch(
        `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&include_adult=false&with_genres=${genreId}`
      ).then((res) => res.json());
      setState(results);
    } catch (error) { console.log(error); }
  };

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

  const loadMore = async (genreId, currentList, setList) => {
    const nextPage = Math.floor(currentList.length / 20) + 1;
    try {
      const url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc&include_adult=false&with_genres=${genreId}&page=${nextPage}`;
      const { results } = await fetch(url).then(res => res.json());
      setList([...currentList, ...results]); 
    } catch (error) { console.error(error); }
  };

  const goHome = () => {
    setCategoryTitle(null);
    setSearchTerm("");
    fetchMovies(); 
  };

  useEffect(() => {
    fetchMovies();
    fetchByGenre(28, setActionMovies);
    fetchByGenre(35, setComedyMovies);
    fetchByGenre(16, setAnimationMovies);
    fetchByGenre(878, setScifiMovies);
    const movieFavorites = JSON.parse(localStorage.getItem('react-movie-app-favorites'));
    if (movieFavorites) setFavorites(movieFavorites);
  }, []);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000); 
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

  const scroll = (ref, direction) => {
    if (ref.current) ref.current.scrollBy({ left: direction === "left" ? -800 : 800, behavior: "smooth" });
  };
  const scrollCast = (direction) => {
    if (castCarouselRef.current) castCarouselRef.current.scrollBy({ left: direction === "left" ? -350 : 350, behavior: "smooth" });
  };

  const selectMovie = async (movie, playNow = false) => {
    setTranslatedOverview("");
    setPlayTrailer(false);
    setTrailerKey(null);
    setCast([]);
    setSimilarMovies([]); 
    setSelectedMovie(movie);
    document.body.style.overflow = "hidden"; 
    
    await Promise.all([
        fetchMovieVideo(movie.id),
        fetchMovieCast(movie.id),
        fetchSimilarMovies(movie)
    ]);

    if (playNow) setPlayTrailer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const closeDetail = () => {
    setSelectedMovie(null);
    setPlayTrailer(false);
    document.body.style.overflow = "auto";
  };

  const handleTranslate = async (text) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`);
      const data = await response.json();
      setTranslatedOverview(data.responseData.translatedText);
    } catch (error) { console.error("Error al traducir:", error);
    } finally { setIsTranslating(false); }
  };

  // --- RENDER ---
  return (
    <div className="app-container">
      
      {/* NOTIFICACIÓN */}
      {notification && (
        <div className="toast-notification">
            <span className="toast-icon">ℹ️</span> {notification}
        </div>
      )}

      {selectedMovie ? (
        /* ================= VISTA DETALLE ================= */
        /* (Esta parte es tan compleja que la dejaremos aquí por ahora, 
           pero usa MovieImage y RatingCircle si quieres) */
        <div className="movie-detail">
          <button className="back-btn" onClick={closeDetail}>← Volver</button>

          {playTrailer && trailerKey ? (
             <div className="video-overlay" onClick={() => setPlayTrailer(false)} 
                style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
                <div className="video-content-wrapper" onClick={(e) => e.stopPropagation()} 
                   style={{position: 'relative', width: '90%', maxWidth: '1200px', aspectRatio: '16/9', backgroundColor: '#000', boxShadow: '0 0 30px rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden'}}>
                   <button onClick={() => setPlayTrailer(false)} style={{position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10}}>✕</button>
                   <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} title="Trailer" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                </div>
             </div>
          ) : (
            <>
              {/* HEADER DEL DETALLE */}
              <div className="detail-hero" style={{ backgroundImage: `url("${IMAGE_PATH}${selectedMovie.backdrop_path}")` }}>
                <div className="movie-detail-overlay"></div>
                <div className="detail-content">
                    <div style={{position: 'relative'}}>
                        <img src={`${IMAGE_PATH_POSTER}${selectedMovie.poster_path}`} alt={selectedMovie.title} className="detail-poster"/>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px' }}>
                           <RatingCircle rating={selectedMovie.vote_average} />
                        </div>
                    </div>
                    
                    <div className="detail-info">
                      <h1 className="detail-title">{selectedMovie.title}</h1>
                      <div style={{ display: 'flex', gap: '15px', color: '#ccc', fontSize: '0.9rem', marginBottom: '15px' }}>
                        <span>{selectedMovie.release_date?.split('-')[0]}</span>
                        <span>•</span>
                        <span style={{ border: '1px solid #ccc', padding: '0 4px', fontSize: '0.7rem', borderRadius: '2px' }}>HD</span>
                      </div>
                      
                      {/* Lógica de traducción */}
                      <div className="overview-container">
                          <p className="detail-overview">
                              {translatedOverview ? translatedOverview : selectedMovie.overview}
                          </p>
                          {!translatedOverview && selectedMovie.overview && (
                              <button onClick={() => handleTranslate(selectedMovie.overview)} disabled={isTranslating} className="btn-translate">
                                  {isTranslating ? "🔄 Traduciendo..." : "🌐 Traducir al español"}
                              </button>
                          )}
                      </div>

                      <div className="hero-buttons">
                          {trailerKey ? <button className="btn btn-play" onClick={() => setPlayTrailer(true)}>▶ Ver Trailer</button> : <button className="btn btn-info" disabled>No Disponible</button>}
                          <button onClick={() => toggleFavorite(selectedMovie)} className="btn btn-fav">
                          {isFav(selectedMovie.id) ? "❤️ En mi lista" : "➕ Agregar a Mi lista"} </button>
                      </div>
                    </div>
                </div>
              </div>

              {/* CONTENIDO INFERIOR */}
              <div className="movie-content-below">
                 {/* REPARTO */}
                 {cast.length > 0 && (
                  <div className="cast-section-wrapper">
                    <h3 className="cast-title">Reparto Principal</h3>
                    <div className="cast-row-container">
                      <button className="cast-arrow-btn" onClick={() => scrollCast("left")}>&#10094;</button>
                      <div className="cast-scroll-area" ref={castCarouselRef}>
                        {cast.map((actor) => actor.profile_path && (
                            <div key={actor.id} className="cast-card" onClick={() => fetchMoviesByActor(actor.id, actor.name)}>
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

                 {/* SIMILARES REUTILIZANDO MOVIECARD */}
                 <div className="container" style={{padding: '20px 40px'}}>
                   <h3 style={{color: 'white', marginBottom: '20px', borderLeft: '4px solid #e50914', paddingLeft: '10px'}}>También podría gustarte</h3>
                   <div className="row" style={{display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center'}}>
                     {similarMovies.slice(0, 6).map((similar) => (
                       <MovieCard key={similar.id} movie={similar} onClick={selectMovie} imagePath={IMAGE_PATH_POSTER} />
                     ))}
                   </div>
                   {similarMovies.length === 0 && <p style={{color: 'gray'}}>No se encontraron títulos similares.</p>}
                 </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ================= VISTA PRINCIPAL ================= */
        <>
          <Navbar 
            goHome={goHome} 
            loadCategoryGrid={loadCategoryGrid} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            handleSearch={handleSearch} 
          />

          {searchTerm || categoryTitle ? (
            /* --- VISTA GRID --- */
            <div className="grid-container">
                <h2 className="grid-title">
                    {searchTerm ? `Resultados de búsqueda: "${searchTerm}"` : `${categoryTitle}`}
                </h2>
                <div className="movie-grid">
                    {movies.map((movie) => movie.poster_path && (
                        <MovieCard key={movie.id} movie={movie} onClick={selectMovie} imagePath={IMAGE_PATH_POSTER} />
                    ))}
                    {movies.length === 0 && <p style={{color: 'gray'}}>No se encontraron resultados.</p>}
                </div>
            </div>
          ) : (
            /* --- VISTA HOME (Ahora super limpia gracias a CategoryRow) --- */
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

              {favorites.length > 0 && (
                 <CategoryRow 
                    title="Mi Lista de Favoritos ❤️" 
                    movies={favorites} 
                    scrollRef={{ current: null }} // Favoritos no tiene ref de scroll horizontal con flechas en tu código original, se mueve nativo
                    onScroll={() => {}} 
                    onSelectMovie={selectMovie} 
                    imagePath={IMAGE_PATH_POSTER}
                 />
              )}

              <CategoryRow title="Tendencias ahora" movies={movies} scrollRef={carouselRef} onScroll={scroll} onSelectMovie={selectMovie} imagePath={IMAGE_PATH_POSTER} />
              
              <CategoryRow title="Acción y Adrenalina" movies={actionMovies} scrollRef={actionRef} onScroll={scroll} onSelectMovie={selectMovie} imagePath={IMAGE_PATH_POSTER} 
                 onLoadMore={() => loadMore(28, actionMovies, setActionMovies)} />
              
              <CategoryRow title="Comedias Populares" movies={comedyMovies} scrollRef={comedyRef} onScroll={scroll} onSelectMovie={selectMovie} imagePath={IMAGE_PATH_POSTER} 
                 onLoadMore={() => loadMore(35, comedyMovies, setComedyMovies)} />
              
              <CategoryRow title="Películas de Animación" movies={animationMovies} scrollRef={animationRef} onScroll={scroll} onSelectMovie={selectMovie} imagePath={IMAGE_PATH_POSTER} 
                 onLoadMore={() => loadMore(16, animationMovies, setAnimationMovies)} />
              
              <CategoryRow title="Ciencia Ficción" movies={scifiMovies} scrollRef={scifiRef} onScroll={scroll} onSelectMovie={selectMovie} imagePath={IMAGE_PATH_POSTER} 
                 onLoadMore={() => loadMore(878, scifiMovies, setScifiMovies)} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;