import React, { useState } from "react";

const MovieImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`img-container ${className}`}>
      {!loaded && <div className="skeleton"></div>}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? "img-loaded" : "img-loading"}`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

export default MovieImage;