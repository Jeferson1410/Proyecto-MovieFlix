import React from "react";
import MovieCard from "./MovieCard";

const CategoryRow = ({ title, movies, scrollRef, onScroll, onSelectMovie, onLoadMore, imagePath }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="carousel-container">
      <h2 className="section-title">{title}</h2>
      <div className="carousel-wrapper">
        <button className="arrow-btn arrow-left" onClick={() => onScroll(scrollRef, "left")}>
          &#10094;
        </button>
        
        <div className="carousel" ref={scrollRef}>
          {movies.map((movie) => 
            movie.poster_path && (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onClick={onSelectMovie} 
                imagePath={imagePath} 
              />
            )
          )}
          
          {/* Botón Cargar Más */}
          {onLoadMore && (
            <div className="load-more-card" onClick={onLoadMore}>
              <span className="plus-icon">+</span>
              <span>Cargar más</span>
            </div>
          )}
        </div>

        <button className="arrow-btn arrow-right" onClick={() => onScroll(scrollRef, "right")}>
          &#10095;
        </button>
      </div>
    </div>
  );
};

export default CategoryRow;