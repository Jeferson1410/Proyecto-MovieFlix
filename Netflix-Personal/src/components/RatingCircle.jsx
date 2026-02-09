import React from "react";

const RatingCircle = ({ rating }) => {
  // --- CONFIGURACIÓN DE TAMAÑO ---
  const radius = 28; // Radio más grande (antes 18)
  const stroke = 5;  // Línea más gruesa (antes 3)
  const widthHeight = 70; // Tamaño total del contenedor (antes 40)
  // -------------------------------

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Asumimos que rating viene de 0 a 10
  const percentage = rating * 10;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determinar color
  let strokeColor = "#e50914"; // Rojo
  if (rating >= 7) strokeColor = "#46d369"; // Verde
  else if (rating >= 4) strokeColor = "#e5b109"; // Amarillo

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(8, 28, 34, 0.85)', // Fondo un poco más transparente
      borderRadius: '50%',
      width: `${widthHeight}px`,
      height: `${widthHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 10px rgba(0,0,0,0.7)', // Sombra más fuerte para contraste
      border: '2px solid rgba(255,255,255,0.1)', // Borde sutil para separar de la imagen
      backdropFilter: 'blur(2px)', // Efecto borroso detrás (opcional, se ve moderno)
      zIndex: 10
    }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Círculo de fondo (gris oscuro/transparente) */}
        <circle
          stroke="rgba(255,255,255,0.1)" // Color de la pista vacío
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Círculo de progreso (color) */}
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ 
            strokeDashoffset, 
            transition: 'stroke-dashoffset 1s ease-in-out',
            strokeLinecap: 'round' // Bordes redondeados en la línea
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Texto del centro */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1
      }}>
        <span style={{
          fontSize: '1.1rem', // Letra más grande
          fontWeight: 'bold',
          color: 'white'
        }}>
          {rating?.toFixed(1)}
        </span>
        {/* Opcional: Si quieres poner un pequeño signo de % abajo */}
        {/* <span style={{ fontSize: '0.6rem', color: '#ccc' }}>%</span> */}
      </div>
    </div>
  );
};

export default RatingCircle;