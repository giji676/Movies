import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import { 
    FaArrowLeft,
    FaPlay,
    FaPause,
    FaVolumeMute,
    FaVolumeOff,
    FaVolumeDown,
    FaVolumeUp,
    FaExpand,
    FaCompress,
    FaEllipsisV,
} from "react-icons/fa";
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
    const playerContainerRef = useRef(null);
    const volumeBarRef = useRef(null);
    const progressBarRef = useRef(null);
    const hlsRef = useRef(null);
    const updateInterval = useRef(null);
    const timeoutRef = useRef(null);

    const [showControls, setShowControls] = useState(true);
    const [mouseVisible, setMouseVisible] = useState(true);
    const [movieId, setMovieId] = useState(null);
    const [videoPath, setVideoPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [originSync, setOriginSync] = useState(null);
    const [mute, setMute] = useState(false);
    const [volume, setVolume] = useState(1);
    const [lastVolume, setLastVolume] = useState(volume);
    const [progress, setProgress] = useState(0);

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

    useEffect(() => {
        const duration = videoRef.current?.duration;
    }, [originSync]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = mute;
            if (mute && volume > 0) videoRef.current.volume = 0;
            if (!mute) videoRef.current.volume = volume;
        }
    }, [mute, volume]);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!videoRef.current) return;

            switch (e.key.toLowerCase()) {
                case "k": // pause/play
                case " ":
                    e.preventDefault(); // prevent scrolling
                    togglePlay();
                    break;

                case "f": // fullscreen
                case "f11":
                    e.preventDefault();
                    toggleFullscreen();
                    break;

                case "arrowup": // volume up
                    e.preventDefault();
                    setVolumeValue(Math.min(volume + 0.05, 1));
                    break;

                case "arrowdown": // volume down
                    e.preventDefault();
                    setVolumeValue(Math.max(volume - 0.05, 0));
                    break;

                case "arrowright": // seek forward
                    e.preventDefault();
                    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 15, videoRef.current.duration);
                    break;

                case "arrowleft": // seek backward
                    e.preventDefault();
                    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 15, 0);
                    break;

                case "m": // mute/unmute
                    e.preventDefault();
                    toggleMute();
                    break;

                case "tab": // let browser handle tab normally for focus
                    break;

                default:
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [volume, mute, videoRef, isPlaying]);

    const setUpWebSocket = () => {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            switch (data.action) {
                case "playing":
                    setIsPlaying(data.action_state);
                    break;
                case "sync":
                    setOriginSync(data.action_state);
                    break;
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

        socketRef.current.send(JSON.stringify({
            "type": "room_action",
            "action": "sync",
            "action_state": currentTime,
        }));
    };

    const startTracking = () => {
        if (updateInterval.current) return;
        updateInterval.current = setInterval(updateTimeStamp, 10000);
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

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        const current = video.currentTime;
        const duration = video.duration;
        if (!duration) return;
        setProgress(current / duration);
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
        video.addEventListener("timeupdate", handleTimeUpdate);

        if (!videoRef.current.paused) {
            startTracking();
        }

        return () => {
            stopTracking();
            video.removeEventListener("play", stopTracking);
            video.removeEventListener("pause", stopTracking);
            video.removeEventListener("ended", stopTracking);
            video.removeEventListener("seeked", onSeek);
            video.removeEventListener("timeupdate", handleTimeUpdate);
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

    const renderVolumeIcon = () => {
        if (mute) {
            return <FaVolumeMute />;
        } else if (volume === 0) {
            return <FaVolumeOff />;
        } else if (volume <= 0.5) {
            return <FaVolumeDown />;
        } else {
            return <FaVolumeUp />;
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        setMouseVisible(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setShowControls(false);
            setMouseVisible(false);
        }, 2500);
    };

    const handleSliderMouseDown = (ref, setter) => (e) => {
        const updateValue = (eMove) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const offsetX = eMove.clientX - rect.left;
            const width = rect.width;

            let value = offsetX / width;
            value = Math.max(0, Math.min(1, value));
            setter(value);
        };

        updateValue(e);

        const handleMouseMove = (eMove) => updateValue(eMove);
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleSoundButton = () => {
        videoRef.current.muted = !mute;
        setMute(!mute);
    }

    const setVolumeValue = (value) => {
        const clamped = Math.max(0, Math.min(1, value));
        setVolume(clamped);
        if (clamped > 0 && mute) setMute(false);
    };

    const setProgressValue = (value) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;

        const clamped = Math.max(0, Math.min(1, value));
        video.currentTime = clamped * video.duration;
        setProgress(clamped);
    };

    const toggleMute = () => {
        if (mute) {
            setMute(false);
            setVolume(lastVolume || 0.5);
        } else {
            setLastVolume(volume);
            setMute(true);
            setVolume(0);
        }
    };

    const toggleFullscreen = () => {
        const container = playerContainerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
                else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
                    else if (container.msRequestFullscreen) container.msRequestFullscreen();
            setIsExpanded(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                    else if (document.msExitFullscreen) document.msExitFullscreen();
            setIsExpanded(false);
        }
    };

    const handleSettings = () => {
        console.log("settigns");
    };

    return (
        <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            className={`${styles.playerContainer} ${!mouseVisible ? styles.hideCursor : ''}`}
        >
            {videoPath ? (
                <div 
                    className={styles.videoContainer}
                >
                    <video
                        ref={videoRef}
                        className={styles.video}
                        crossOrigin="anonymous"
                        autoPlay
                    />
                    {showControls && (
                        <>
                            <div className={styles.controlBar}>
                                <button onClick={togglePlay}>
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>
                                <button onClick={toggleMute}>
                                    {renderVolumeIcon()}
                                </button>
                                <div
                                    ref={volumeBarRef}
                                    onMouseDown={handleSliderMouseDown(volumeBarRef, setVolumeValue)}
                                    className={styles.volumeBar}
                                >
                                    <div
                                        className={styles.volumeBarFill} 
                                        style={{width: `${volume * 100}%`}}
                                    >
                                    </div>
                                </div>
                                <div 
                                    ref={progressBarRef}
                                    onMouseDown={handleSliderMouseDown(progressBarRef, setProgressValue)}
                                    className={styles.progressBar}
                                >
                                    <div
                                        className={styles.progressBarFill} 
                                        style={{width: `${progress * 100}%`}}
                                    >
                                    </div>
                                </div>
                                <button onClick={toggleFullscreen}>
                                    {isExpanded ? <FaCompress /> : <FaExpand />}
                                </button>
                                <button onClick={handleSettings}>
                                    <FaEllipsisV />
                                </button>
                            </div>
                            <button className={backButtonStyle.backButton} onClick={() => navigate(-1)}>
                                <FaArrowLeft />
                            </button>
                        </>
                    )}
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
