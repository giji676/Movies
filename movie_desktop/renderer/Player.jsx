import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Player.module.css';

function Player() {
    const location = useLocation();
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { tmdbConfig, movie } = location.state || {};
    const { tmdb_id, title, release_date, overview, poster_path, backdrop_path } = movie;

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const backdropUrl = `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.backdrop_sizes[tmdbConfig.images.backdrop_sizes.length - 1]}${backdrop_path}`;

    const getMoviePath = async () => {
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`http://192.168.1.215:8000/movie/stream-to-client/?tmdb_id=${tmdb_id}`);
            const data = await response.json();
            
            if (data.file_path) {
                setVideoPath(data.file_path);
                console.log(videoPath);
            } else {
                console.error("No file_path returned for movie:", tmdb_id);
            }
        } catch (err) {
            console.log("failed to fetch movie path", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tmdb_id && !videoPath) {
            getMoviePath();
        }
    }, [tmdb_id]);

    useEffect(() => {
        if (videoPath && videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => console.warn("Autoplay blocked:", err));
            }
        }
    }, [videoPath]);

    return (
        <div className={styles.playerContainer}>
            {videoPath ? (
                <video
                    ref={videoRef}
                    src={videoPath}
                    controls
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
