import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import styles from './Movie.module.css';
import backButtonStyle from "./components/BackButton.module.css";
import ProtectedRoute from './components/ProtectedRoute';
import { FaArrowLeft, FaBookmark, FaRegBookmark, FaEllipsisV, FaPlus, FaPlay, FaMinus, FaInfo } from "react-icons/fa";

function Movie() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const { playlistMovie, fallbackMovie, navOverride, room } = location.state || {};
    const movie = playlistMovie?.movie || fallbackMovie;

    if (!movie) {
        return <p>Movie data not found.</p>;
    }

    const { title, release_date, overview, poster_path, backdrop_path } = movie;

    const posterUrl = `${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;
    const backdropUrl = `${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${backdrop_path}`;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 430);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const onNavOverride = (e) => {
        if (navOverride) {
            e.preventDefault();
            room.movie_id = movie.tmdb_id;
            navigate(navOverride, {
                state: {room: room}
            });
        }
    };

    return (
        <ProtectedRoute>
            <div className={styles.body}>
                <button className={backButtonStyle.backButton} onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
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
                    {isMobile && (
                        <>
                            <div className={styles.buttonsContainer}>
                                <div className={styles.button}>
                                    <FaRegBookmark />
                                    <p>Watch Later</p>
                                </div>
                                {/* <div className={styles.button}> */}
                                {/*     <FaRegBookmark /> */}
                                {/*     <p>Watch Later</p> */}
                                {/* </div> */}
                                {/* <div className={styles.button}> */}
                                {/*     <FaRegBookmark /> */}
                                {/*     <p>Watch Later</p> */}
                                {/* </div> */}
                                {/* <div className={styles.button}> */}
                                {/*     <FaRegBookmark /> */}
                                {/*     <p>Watch Later</p> */}
                                {/* </div> */}
                            </div>
                            <Link
                                to="/player"
                                state={{ movie, playlistMovie }}
                                className={styles.mobilePlayButton}
                                onClick={(e) => onNavOverride(e)}
                            >
                                ▶ <p>play</p>
                            </Link>
                        </>
                    )}
                    <div className={styles.overviewSide}>
                        <h1>{title}</h1>
                        <p>{release_date}</p>
                        <p>{overview}</p>
                    </div>
                    <div className={styles.posterSide}>
                        <div className={styles.posterSideContent}>
                            <Link
                                to="/player"
                                state={{ movie, playlistMovie }}
                                className={styles.posterWrapper}
                                onClick={(e) => onNavOverride(e)}
                            >
                                <img className={styles.poster} src={posterUrl} alt="Poster" />
                                <div className={styles.playButton}>▶</div>
                            </Link>
                        </div>
                        {!isMobile && (
                            <div className={styles.buttonsContainer}>
                                <div className={styles.button}>
                                    <FaRegBookmark />
                                    <p>Watch Later</p>
                                </div>
                                {/* <div className={styles.button}> */}
                                {/*     <FaRegBookmark /> */}
                                {/*     <p>Watch Later</p> */}
                                {/* </div> */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default Movie;
