import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Player.module.css';
import api from "../main/api";
import ProtectedRoute from './components/ProtectedRoute';

function Player() {
    const location = useLocation();
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const { movie, playlistMovie: initialPlaylistMovie } = location.state || {};
    const [playlistMovie, setPlaylistMovie] = useState(initialPlaylistMovie);

    const movieData = playlistMovie?.movie || movie || {};
    const { tmdb_id, title, backdrop_path } = movieData;

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const updateInterval = useRef(null);
    const hasSeeked = useRef(false);
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const backdropUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${tmdb_id}/${movieData.backdrop_path}`;

    useEffect(() => {
        if (!playlistMovie) {
            api
                .patch(`/playlist-movie/modify/${movie.tmdb_id}/`, {
                    modify_field: "watch_history",
                    value: true
                })
                .then((res) => {
                    if (res.status === 200) {
                        setPlaylistMovie(res.data.data);
                    } else {
                        console.log("Unexpected response:", res.status);
                    }
                })
                .catch((err) => {
                    if (err.response && err.response.status === 404) {
                    } else {
                        console.log("Failed to update playlist:", err);
                    }
                });
            }
    }, [movie]);

    const getMoviePath = async () => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            const res = await api.get(`/movie/stream-to-client/?tmdb_id=${tmdb_id}`);
            const data = res.data;
            if (data.file_path) {
                setVideoPath(data.file_path);
            } else {
                console.error("No file_path returned for movie:", tmdb_id);
            }
        } catch (err) {
            console.error("Failed to fetch movie path", err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTimeStamp = async () => {
        if (!videoRef.current) return;

        const currentTime = Math.floor(videoRef.current.currentTime); // seconds
        try {
            await api.patch(`/playlist/${tmdb_id}/update-progress/`, { time_stamp: currentTime });
        } catch (error) {
            console.error("Failed to update time stamp:", error.response?.data || error.message);
        }
    };

    const startTracking = () => {
        if (updateInterval.current) return;
        updateInterval.current = setInterval(updateTimeStamp, 15000); // every 15 seconds
    };

    const stopTracking = () => {
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
            updateInterval.current = null;
        }
    };

    const setupTrackingListeners = () => {
        const video = videoRef.current;
        if (!video) return;

        const onSeek = () => {
            updateTimeStamp();
        };

        video.addEventListener("play", startTracking);
        video.addEventListener("pause", stopTracking);
        video.addEventListener("ended", stopTracking);
        video.addEventListener("seeked", onSeek);

        if (!videoRef.current.paused) {
            startTracking();
        }

        return () => {
            stopTracking();
            video.removeEventListener("play", startTracking);
            video.removeEventListener("pause", stopTracking);
            video.removeEventListener("ended", stopTracking);
            video.removeEventListener("seeked", onSeek);
        };
    };

    useEffect(() => {
        if (tmdb_id && !videoPath) {
            getMoviePath();
        }
    }, [tmdb_id]);

    useEffect(() => {
        if (!videoPath || !videoRef.current || !playlistMovie) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        const resumeTime = playlistMovie.time_stamp || 0;
        videoRef.current.currentTime = resumeTime;

        if (Hls.isSupported()) {
            const hls = new Hls();

            hls.loadSource(videoPath);
            hls.attachMedia(videoRef.current);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoPath, playlistMovie]);

    useEffect(() => {
        if (!videoRef.current) return;
        const cleanup = setupTrackingListeners();
        return cleanup;
    }, [videoPath]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => console.warn("Autoplay blocked"));
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <ProtectedRoute>
            <div
                className={styles.playerContainer}
                style={{ backgroundImage: videoPath ? "none" : `url(${backdropUrl})` }}
            >
                {videoPath ? (
                    <div className={styles.videoContainer}>
                        <video
                            ref={videoRef}
                            className={styles.video}
                            controls
                            crossOrigin="anonymous"
                            autoPlay
                        />
                        <button className={styles.backButton} onClick={() => navigate(-1)}>
                            ← Back
                        </button>
                    </div>
                ) : (
                        <div className={styles.loading}>
                            <button className={styles.backButton} onClick={() => navigate(-1)}>
                                ← Back
                            </button>
                            <h1>Video Not Available</h1>
                            <p>Sorry, this movie cannot be played at the moment.</p>
                        </div>
                    )}
            </div>
        </ProtectedRoute>
    );
}

export default Player;
