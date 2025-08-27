import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { useLocation } from 'react-router-dom';
import styles from './Player.module.css';

function Player() {
    const location = useLocation();
    const { tmdbConfig, movie } = location.state || {};
    const { tmdb_id, title, backdrop_path } = movie || {};

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const backdropUrl = `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.backdrop_sizes.slice(-1)[0]}${backdrop_path}`;

    const getMoviePath = async () => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            const response = await fetch(`http://192.168.1.215:8000/movie/stream-to-client/?tmdb_id=${tmdb_id}`);
            const data = await response.json();
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

    // Fetch video URL once when component mounts
    useEffect(() => {
        if (tmdb_id && !videoPath) {
            getMoviePath();
        }
    }, [tmdb_id]);

    // Setup HLS playback whenever videoPath changes
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

    return (
        <div className={styles.playerContainer} style={{ backgroundImage: `url(${backdropUrl})` }}>
            {videoPath ? (
                <video
                    ref={videoRef}
                    controls={false}
                    crossOrigin="anonymous"
                    style={{ width: "100%", maxHeight: "80vh" }}
                />
            ) : (
                <div className={styles.loading}>
                    {isLoading ? "Loading video..." : "Video not available"}
                </div>
            )}
        </div>
    );
}

export default Player;
