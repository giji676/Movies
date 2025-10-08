import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import { FaArrowLeft } from "react-icons/fa";
import api from "../main/api";
import styles from "./Room.module.css";
import playerStyles from "./Player.module.css";
import backButtonStyle from "./components/BackButton.module.css";
import Hls from 'hls.js';

function Room() {
    const navigate = useNavigate();
    const location = useLocation();
    const { room } = location.state || {};

    const url = `ws://localhost:8000/ws/socket-server/`;
    const socketRef = useRef();

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const updateInterval = useRef(null);
    const [movieId, setMovieId] = useState(null);
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setUpWebSocket();
        setMovieId(room.movie_id);
    }, []);

    useEffect(() => {
        getMoviePath();
    }, [movieId]);

    useEffect(() => {
        if (!videoPath || !videoRef.current ) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        const resumeTime = 0;
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
    }, [videoPath]);

    useEffect(() => {
        if (!videoRef.current) return;
        const cleanup = setupTrackingListeners();
        return cleanup;
    }, [videoPath]);

    useEffect(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;
        socketRef.current.send(JSON.stringify({
            "type": "room_action",
            "action": "playing",
            "action_state": isPlaying,
        }));
    }, [isPlaying]);

    const setUpWebSocket = () => {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            if (data.action === "playing") {
                setIsPlaying(data.action_state);
            }
        }

        return () => {
            socket.close();
        };
    };

    const getMoviePath = async () => {
        if (isLoading || !movieId) return;
        try {
            setIsLoading(true);
            const res = await api.get(`/movie/stream-to-client/?tmdb_id=${movieId}`);
            const data = res.data;
            if (data.file_path) {
                //setVideoPath(data.file_path);
                setVideoPath("http://localhost:5173/media/downloads/22/hls/Pirates_of_the_Caribbean__The_Curse_of_the_Black_Pearl.m3u8");
            } else {
                toast.error("No file_path returned for movie:", tmdb_id);
            }
        } catch (err) {
            toast.error("Failed to fetch movie path", err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTimeStamp = async () => {
        if (!videoRef.current) return;
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;

        const currentTime = Math.floor(videoRef.current.currentTime); // seconds
        console.log("updating time:", currentTime);

        socketRef.current.send(JSON.stringify({
            "type": "room_action",
            "action": "sync",
            "action_state": currentTime,
        }));
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

    const updateState = () => {
        const video = videoRef.current;
        if (!video) return;

        setIsPlaying(!video.paused);
    };

    const setupTrackingListeners = () => {
        const video = videoRef.current;
        if (!video) return;

        const onSeek = () => {
            updateTimeStamp();
        };

        video.addEventListener("play", () => {updateState(); startTracking();});
        video.addEventListener("pause", () => {updateState(); stopTracking();});
        video.addEventListener("ended", stopTracking);
        video.addEventListener("seeked", onSeek);

        if (!videoRef.current.paused) {
            startTracking();
        }

        return () => {
            stopTracking();
            video.removeEventListener("play", stopTracking);
            video.removeEventListener("pause", stopTracking);
            video.removeEventListener("ended", stopTracking);
            video.removeEventListener("seeked", onSeek);
        };
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => toast.warn("Autoplay blocked"));
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div
            className={styles.playerContainer}
        >
            {videoPath ? (
                <div className={playerStyles.videoContainer}>
                    <video
                        ref={videoRef}
                        className={playerStyles.video}
                        controls
                        crossOrigin="anonymous"
                        autoPlay
                    />
                    <button className={backButtonStyle.backButton} onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                    </button>
                </div>
            ) : (
                    <div className={playerStyles.loading}>
                        <button className={backButtonStyle.backButton} onClick={() => navigate(-1)}>
                            <FaArrowLeft />
                        </button>
                        <h1>Video Not Available</h1>
                        <p>Sorry, this movie cannot be played at the moment.</p>
                    </div>
                )}
        </div>
    );
}

export default Room;
