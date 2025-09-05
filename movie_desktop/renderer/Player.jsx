import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Player.module.css';
import api from "../main/api";

function Player() {
    const location = useLocation();
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const { movie } = location.state || {};
    const { tmdb_id, title, backdrop_path } = movie || {};

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const updateInterval = useRef(null);
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const backdropUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${tmdb_id}/${movie.backdrop_path}`;

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

        video.addEventListener("play", startTracking);
        video.addEventListener("pause", stopTracking);
        video.addEventListener("ended", stopTracking);

        if (!videoRef.current.paused) {
            startTracking();
        }

        return () => {
            stopTracking();
            video.removeEventListener("play", startTracking);
            video.removeEventListener("pause", stopTracking);
            video.removeEventListener("ended", stopTracking);
        };
    };

    useEffect(() => {
        if (tmdb_id && !videoPath) {
            getMoviePath();
        }
    }, [tmdb_id]);

    useEffect(() => {
        if (!videoPath || !videoRef.current) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(videoPath);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play().catch(() => console.warn("Autoplay blocked"));
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("HLS.js error:", data);
            });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = videoPath;
            videoRef.current.play().catch(() => console.warn("Autoplay blocked"));
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
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
                        onLoadedMetadata={() => setupTrackingListeners()}
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
    );
}

export default Player;
