/**
 * Componente: Modo Cine (Reproductor de Video)
 * Proporciona una experiencia de visualización inmersiva utilizando la API de YouTube IFrame.
 * Incluye controles personalizados, gestión de progreso y soporte para pantalla completa.
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Volume2, VolumeX, Info, Play, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CinemaPlayer.css';

const CinemaPlayer = ({ trailerKey, movie, onClose }) => {
    // --- ESTADOS DEL REPRODUCTOR ---
    const [isHovered, setIsHovered] = useState(true);       // ¿Interfaz visible?
    const [isPlaying, setIsPlaying] = useState(true);       // ¿El video se está reproduciendo?
    const [isMuted, setIsMuted] = useState(false);          // ¿El video está silenciado?
    const [currentTime, setCurrentTime] = useState(0);      // Tiempo actual de reproducción
    const [duration, setDuration] = useState(0);            // Duración total del video

    // Referencias para manejar la API de YouTube y el DOM
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const progressInterval = useRef(null);
    const idleTimeoutRef = useRef(null);

    /**
     * EFECTO: Gestión de inactividad del cursor
     */
    const handleMouseMove = () => {
        setIsHovered(true);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

        // Si el video se está reproduciendo, ocultamos la interfaz tras 3 segundos de calma
        if (isPlaying) {
            idleTimeoutRef.current = setTimeout(() => {
                setIsHovered(false);
            }, 3000);
        }
    };

    useEffect(() => {
        // Al pausar o reanudar, reseteamos el temporizador
        handleMouseMove();
    }, [isPlaying]);

    /**
     * EFECTO: Inicialización de la API de YouTube
     */
    useEffect(() => {
        // Carga dinámicamente el script de la API de YouTube si no existe
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Función global requerida por YouTube cuando la API está lista
        window.onYouTubeIframeAPIReady = () => {
            initPlayer();
        };

        // Si ya existe la API, inicializamos directamente
        if (window.YT && window.YT.Player) {
            initPlayer();
        }

        // Limpieza al desmontar el componente
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (playerRef.current) playerRef.current.destroy();
        };
    }, []);

    /**
     * Crea la instancia del reproductor de YouTube
     */
    const initPlayer = () => {
        playerRef.current = new window.YT.Player('youtube-player', {
            videoId: trailerKey,
            playerVars: {
                autoplay: 1,        // Reproducir automáticamente
                controls: 0,        // Ocultar controles nativos de YouTube
                modestbranding: 1,  // Minimizar logo de YouTube
                rel: 0,             // No mostrar videos relacionados al final
                iv_load_policy: 3,  // Ocultar anotaciones
                fs: 0,              // Deshabilitar botón nativo de pantalla completa
                disablekb: 1        // Deshabilitar controles de teclado nativos
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange
            }
        });
    };

    /**
     * Evento: Reproductor Listo
     */
    const onPlayerReady = (event) => {
        setDuration(event.target.getDuration());
        startProgressTimer();
    };

    /**
     * Evento: Cambio de Estado (Play, Pause, Ended)
     */
    const onPlayerStateChange = (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startProgressTimer();
        } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            stopProgressTimer();
        } else if (event.data === window.YT.PlayerState.ENDED) {
            onClose(); // Cerrar el modo cine al terminar el video
        }
    };

    /**
     * Temporizador para actualizar la barra de progreso
     */
    const startProgressTimer = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime());
            }
        }, 500);
    };

    const stopProgressTimer = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    // --- ACCIONES DE CONTROL ---

    const togglePlay = () => {
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    };

    const toggleMute = () => {
        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    /**
     * Salta a una posición específica al hacer clic en la barra de progreso
     */
    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * duration;
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current.requestFullscreen();
        else document.exitFullscreen();
    };

    if (!trailerKey) return null;

    const progressPercent = (currentTime / duration) * 100 || 0;

    return (
        <motion.div
            className="cinema-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div
                ref={containerRef}
                className="cinema-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* AMBILIGHT EFFECT (Fondo dinámico basado en la película) */}
                <div className="ambilight-wrapper">
                    <div
                        className="ambilight-blur"
                        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie?.backdrop_path})` }}
                    ></div>
                </div>

                {/* Máscaras estéticas para Cinematic Look (ocultan elementos de YT) */}
                <div className="player-mask-top"></div>
                <div className="player-mask-bottom"></div>

                {/* BARRA SUPERIOR (Info y Salida) */}
                <AnimatePresence>
                    {(isHovered || !isPlaying) && (
                        <motion.div
                            className="player-header"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                        >
                            <div className="player-info">
                                <h3>{movie?.title || movie?.name}</h3>
                                <span className="player-meta">Trailer Oficial • Alta Definición</span>
                            </div>
                            <button className="close-player" onClick={onClose}>
                                <X size={20} />
                                <span>SALIR</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CONTENEDOR DEL VIDEO */}
                <div className="video-wrapper" onClick={togglePlay}>
                    <div id="youtube-player"></div>

                    {/* Icono central de pausa/play */}
                    <AnimatePresence>
                        {!isPlaying && (
                            <motion.div
                                className="play-overlay"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Play size={60} fill="white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* BARRA INFERIOR (Controles de Reproducción) */}
                <AnimatePresence>
                    {(isHovered || !isPlaying) && (
                        <motion.div
                            className="player-footer"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                        >
                            {/* Lado Izquierdo: Play, Skip, Mute */}
                            <div className="footer-left">
                                <button className="player-control-btn" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                </button>
                                <button className="player-control-btn" onClick={() => playerRef.current?.seekTo(currentTime + 10, true)}>
                                    <SkipForward size={24} />
                                </button>
                                <button className="player-control-btn" onClick={toggleMute}>
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                            </div>

                            {/* Centro: Barra de Progreso y Tiempo */}
                            <div className="footer-center">
                                <div className="time-display">
                                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="progress-container" onClick={handleProgressClick}>
                                    <div className="progress-rail">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progressPercent}%` }}
                                        >
                                            <div className="progress-knob"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="time-display">
                                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>

                            {/* Lado Derecho: Pantalla Completa */}
                            <div className="footer-right">
                                <button className="player-control-btn" onClick={toggleFullscreen}>
                                    <Maximize2 size={24} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CinemaPlayer;
