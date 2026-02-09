import React from "react";
import MovieImage from "./MovieImage";
// import RatingCircle from "./RatingCircle"; // Descomenta si quieres el círculo en todas las listas

const MovieCard = ({ movie, onClick, imagePath }) => {
  return (
    <div className="movie-card" onClick={() => onClick(movie)}>
      <MovieImage
        src={`${imagePath}${movie.poster_path}`}
        alt={movie.title}
        className="movie-img"
      />
      
      {/* Opcional: <RatingCircle rating={movie.vote_average} /> */}
      
      <div className="movie-info">
        <h4>{movie.title}</h4>
      </div>
    </div>
  );
};

export default MovieCard;