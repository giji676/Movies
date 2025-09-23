import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import styles from './Movie.module.css';
import ProtectedRoute from './components/ProtectedRoute';

function Movie() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const { playlistMovie, fallbackMovie } = location.state || {};
    const movie = playlistMovie?.movie || fallbackMovie;

    if (!movie) {
        return <p>Movie data not found.</p>;
    }

    const { title, release_date, overview, poster_path, backdrop_path } = movie;

    const posterUrl = `${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;
    const backdropUrl = `${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${backdrop_path}`;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 430);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <ProtectedRoute>
            <div className={styles.body}>
                {!isMobile ? (
                    <div
                        className={styles.backdropDesktop}
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                ) : (
                        <div className={styles.backdropMobileWrapper}>
                            <img className={styles.backdropMobile} src={backdropUrl} alt="Backdrop" />
                            <div className={styles.backdropGradient} />
                        </div>
                    )}

                <div className={styles.content}>
                    <h1>{title}</h1>
                    <p>{release_date}</p>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default Movie;
