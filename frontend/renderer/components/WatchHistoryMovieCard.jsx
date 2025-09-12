import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './WatchHistoryMovieCard.module.css';
import { FaBookmark, FaRegBookmark, FaEllipsisV, FaPlus, FaPlay, FaMinus, FaInfo } from "react-icons/fa";
import api from "../../main/api";

function WatchHistoryMovieCard({ playlistMovie, playlist, onPlaylistUpdate }) {
    /*
     * playlistMovie wraps a movie, with extra user specific fields,
     * such as saved to watched later, watched time, etc.
    */
    const movie = playlistMovie.movie;
    const tmdb_id = movie.tmdb_id;

    const [hovered, setHovered] = useState(false);
    const [isWatchHistory, setIsWatchHistory] = useState(null);
    const [progress, setProgress] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const titleRef = useRef(null);
    const wrapperRef = useRef(null);
    const [scrollDistance, setScrollDistance] = useState(0);
    const [shouldScroll, setShouldScroll] = useState(false);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${tmdb_id}/${movie.poster_path}`;

    useEffect(() => {
        const match = playlist.find(m => m.movie.tmdb_id === tmdb_id);
        if (match) {
            setIsWatchHistory(true);
        } else {
            setIsWatchHistory(false);
        }
    }, [playlist, isWatchHistory]);

    useEffect(() => {
        if (playlistMovie.completed) {
            //setProgress(100);
            setProgress((playlistMovie.time_stamp / movie.duration) * 100);
        } else if (playlistMovie.time_stamp && movie.duration) {
            setProgress((playlistMovie.time_stamp / movie.duration) * 100);
        } else {
            setProgress(0);
        }
    }, []);

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/api/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: true
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setIsWatchHistory(true);
                    onPlaylistUpdate(res.data.data, "add");
                } else {
                    console.log("Failed to add movie");
                }
            })
            .catch((err) => console.log(err));
    };

    const deleteFromWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/api/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: false
            })
            .then((res) => {
                if (res.status === 200) {
                    setIsWatchHistory(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    console.log("Unexpected response:", res.status);
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 404) {
                    setIsWatchHistory(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    console.log("Failed to update playlist:", err);
                }
            });
    };

    const toggleSave = (e) => {
        e.preventDefault();
        if (isWatchHistory) {
            deleteFromWatchLater(e);
        } else {
            saveToWatchLater(e);
        }
    };

    useEffect(() => {
        if (titleRef.current && wrapperRef.current) {
            const textWidth = titleRef.current.scrollWidth;
            const containerWidth = wrapperRef.current.offsetWidth;

            const overflow = textWidth - containerWidth;
            if (overflow > 0) {
                setScrollDistance(overflow);
                setShouldScroll(true);
            } else {
                setShouldScroll(false);
            }
        }
    }, [movie.title]);

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const remove = () => {console.log("remove");};
    const toggleWatchLater = () => {console.log("watch later");};

    return (
        <div className={styles.movieCard}>
            <Link
                to="/movie"
                state={{ playlistMovie }}
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={(e) => {
                    if (dropdownOpen) {
                        e.preventDefault(); // prevent link navigation
                    }
                }}
            >
                {posterUrl && (
                    <div
                        className={`${styles.imageWrapper} ${dropdownOpen ? styles.noHover : ''}`}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        <img
                            loading="lazy"
                            src={posterUrl}
                            alt={movie.title}
                            className={styles.poster}
                        />
                        {!dropdownOpen ? (
                            <div className={styles.progressBarContainer}>
                                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                            </div>
                        ) : (
                                <div className={`${styles.dropdownContainer} ${dropdownOpen ? styles.open : ''}`}>
                                    <Link
                                        to="/player"
                                        state={{ movie, playlistMovie }}
                                        className={styles.dropdownItem}
                                    >
                                        Resume
                                        <FaPlay className={styles.dropdownIcon} />
                                    </Link>
                                    <Link
                                        to="/movie"
                                        state={{ playlistMovie }}
                                        className={styles.dropdownItem}
                                    >
                                        Details
                                        <FaInfo className={styles.dropdownIcon} />
                                    </Link>
                                    <p onClick={remove} className={styles.dropdownItem}>
                                        Remove
                                        <FaMinus className={styles.dropdownIcon} />
                                    </p>
                                    <p onClick={toggleSave} className={styles.dropdownItem}>
                                        Watch Later
                                        <FaPlus className={styles.dropdownIcon} />
                                    </p>
                                </div>
                            )}
                    </div>
                )}
            </Link>
            <div className={styles.bottomBar}>
                <p
                    className={styles.titleWrapper}
                    ref={wrapperRef}
                    style={
                        shouldScroll ? { "--scroll-distance": `${scrollDistance}px` } : {}
                    }
                >
                    <span
                        className={styles.scrollText}
                        ref={titleRef}
                    >
                        {movie.title}
                    </span>
                </p>
                <FaEllipsisV className={styles.detailsButton} onClick={toggleDropdown} />
            </div>
        </div>
    );
}

export default WatchHistoryMovieCard;
