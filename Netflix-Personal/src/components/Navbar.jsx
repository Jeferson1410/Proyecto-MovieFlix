import React from "react";

const Navbar = ({ goHome, loadCategoryGrid, searchTerm, setSearchTerm, handleSearch }) => {
  return (
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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">🔍</button>
      </form>
    </nav>
  );
};

export default Navbar;