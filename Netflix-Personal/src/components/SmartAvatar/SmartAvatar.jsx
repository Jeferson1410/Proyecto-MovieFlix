import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import './SmartAvatar.css';

const SmartAvatar = ({ src, alt, className }) => {
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
            if (retryCount < 5) { // Aumentado a 5 reintentos
                const delay = (retryCount + 1) * 3000; // Retraso progresivo: 3s, 6s, 9s...
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, delay);
            }
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, retryCount]);

    return (
        <div className={`smart-avatar-container ${className || ''} ${status}`}>
            {status === 'success' ? (
                <img src={src} alt={alt} className="smart-avatar-img" />
            ) : (
                <div className="smart-avatar-placeholder">
                    <User size="40%" className="placeholder-icon" />
                    {status === 'loading' && <div className="avatar-loader"></div>}
                </div>
            )}
        </div>
    );
};

export default SmartAvatar;
