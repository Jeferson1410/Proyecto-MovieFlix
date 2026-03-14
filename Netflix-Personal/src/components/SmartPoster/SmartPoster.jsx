import React, { useState, useEffect } from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import './SmartPoster.css';

const SmartPoster = ({ src, alt, className, type = 'poster', layoutId, onClick }) => {
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!src) {
            setStatus('error');
            return;
        }

        setStatus('loading');
        const img = new Image();
        img.src = src;

        img.onload = () => setStatus('success');
        img.onerror = () => {
            setStatus('error');
            if (retryCount < 3) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 5000);
            }
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, retryCount]);

    const getIcon = () => {
        if (type === 'backdrop') return <ImageIcon size="15%" className="poster-placeholder-icon" />;
        return <Film size="30%" className="poster-placeholder-icon" />;
    };

    const containerClasses = `smart-poster-container ${className || ''} ${type} ${status}`;

    return (
        <div className={containerClasses} onClick={onClick}>
            {status === 'success' ? (
                <motion.img
                    layoutId={layoutId}
                    src={src}
                    alt={alt}
                    className="smart-poster-img"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
            ) : (
                <div className="smart-poster-placeholder">
                    {getIcon()}
                    {status === 'loading' && <div className="poster-loader"></div>}
                </div>
            )}
        </div>
    );
};

export default SmartPoster;
