import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
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
import Hls from "hls.js";
import socketUrl from "../main/webSocketBase";

function Room() {
    const navigate = useNavigate();
    const location = useLocation();
    const { room } = location.state || {};

    const socketRef = useRef();
    const videoRef = useRef();
    const hlsRef = useRef();
    const progressBarRef = useRef();
    const volumeBarRef = useRef();
    const playerContainerRef = useRef();
    const timeoutRef = useRef(null);

    const [showControls, setShowControls] = useState(true);
    const [mouseVisible, setMouseVisible] = useState(true);
    const [moviePath, setMoviePath] = useState("");
    const [roomUser, setRoomUser] = useState(null);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [lastVolume, setLastVolume] = useState(1);
    const [mute, setMute] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        getMoviePath();
        getRoomUser();
        setUpWebSocket();
    }, []);

    useEffect(() => {
        if (!moviePath || !videoRef.current ) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls();

            hls.loadSource(moviePath);
            hls.attachMedia(videoRef.current);
        }
        setUpTrackingListeners();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [moviePath]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!videoRef.current) return;

            switch (e.key.toLowerCase()) {
                case "k": // pause/play
                case " ":
                    e.preventDefault();
                    handleMouseMove();
                    updatePlayState();
                    break;

                case "f": // fullscreen
                case "f11":
                    e.preventDefault();
                    toggleFullscreen();
                    break;

                case "m": // mute/unmute
                    e.preventDefault();
                    handleMouseMove();
                    toggleMute();
                    break;

                case "arrowup": // volume up
                    e.preventDefault();
                    handleMouseMove();
                    setVolumeValue(Math.min(volume + 0.05, 1));
                    break;

                case "arrowdown": // volume down
                    e.preventDefault();
                    handleMouseMove();
                    setVolumeValue(Math.max(volume - 0.05, 0));
                    break;

                case "arrowright": // seek forward
                    e.preventDefault();
                    if (!roomUser.privileges.play_pause) return;
                    handleMouseMove();
                    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 15, videoRef.current.duration);
                    sendSeekUpdate(videoRef.current.currentTime);
                    break;

                case "arrowleft": // seek backward
                    e.preventDefault();
                    if (!roomUser.privileges.play_pause) return;
                    handleMouseMove();
                    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 15, 0);
                    sendSeekUpdate(videoRef.current.currentTime);
                    break;

                case "tab": // let browser handle tab normally for focus
                    break;

                default:
                    break;
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [roomUser, volume, mute, videoRef, isPlaying]);

    const getMoviePath = async () => {
        if (!room.movie_id) return;

        try {
            const res = await api.get(`/movie/stream-to-client/?tmdb_id=${room.movie_id}`);
            if (!res.data.file_path) {
                throw new Error("No file path returned from server");
            }
            setMoviePath(res.data.file_path);
        } catch (err) {
            toast.error("Failed to fetch movie path");
        }
    };

    const getRoomUser = async () => {
        if (!room.room_hash) return;

        try {
            const res = await api.get(`/room/${room.room_hash}/room-user/`);
            if (res.data?.room_user) {
                setRoomUser(res.data.room_user);
            }
        } catch (err) {
            toast.error("Failed to fetch room-user", err);
        }
    };

    const setUpWebSocket = () => {
        const socket = new WebSocket(socketUrl(`/ws/room/${room.room_hash}/`));
        socketRef.current = socket;

        socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            switch (data.type) {
                case "room_update":
                    setRoomState(data);
                    break;
            }
        }

        return () => {
            socket.close();
        };
    };

    const compensate = (time, lastUpdated) => {
        const cleanLastUpdated = new Date(lastUpdated);
        const now = new Date();
        const diff = (now - cleanLastUpdated) / 1000;
        return time + diff;
    };

    const setRoomState = (data) => {
        if (!videoRef?.current) return;

        const video = videoRef.current;
        const compensatedTime = compensate(data.timestamp, data.last_updated);

        const current = video.currentTime;
        const diff = compensatedTime - current;

        const TOLERANCE = 0.5; // Transmision latency tollerance

        // Only seek if it's significantly out of sync
        if (Math.abs(diff) > TOLERANCE) {
            video.currentTime = compensatedTime;
        }

        if (data.play_state) {
            if (video.paused) {
                video.play().catch(() => {
                    toast.warn("Autoplay blocked, interact to continue");
                });
                setIsPlaying(true);
            }
        } else {
            if (!video.paused) {
                video.pause();
                setIsPlaying(false);
            }
        }
    };

    const updatePlayState = (state) => {
        if (!roomUser.privileges.play_pause) return;
        let new_state = true;

        if (typeof state === "boolean") {
            new_state = state;
            // if (state) videoRef.current.play();
            // else videoRef.current.pause();
        } else {
            if (videoRef.current.paused) {
                new_state = true;
                // videoRef.current.play();
            } else {
                new_state = false;
                // videoRef.current.pause();
            }
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                "action_type": "play_state",
                "action_state": new_state,
            }));
        }
    };

    const sendSeekUpdate = (timeStamp) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                "action_type": "seek",
                "action_state": timeStamp,
                "action_time": new Date(),
            }));
        }
    };

    const handleProgressBarSlider = (ref) => (e) => {
        if (!roomUser.privileges.play_pause) return;
        if (!videoRef.current) return;

        const updateValue = (e) => {
            const rect = ref.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;

            let value = offsetX / width;
            value = Math.max(0, Math.min(1, value));
            setProgress(value);

            const timeStamp = value * videoRef.current.duration;
            videoRef.current.currentTime = timeStamp;
            return timeStamp;
        };

        let timeStamp = updateValue(e);

        const handleMouseMove = (e) => {
            timeStamp = updateValue(e);
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            sendSeekUpdate(timeStamp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleVolumeBarSlider = (ref) => (e) => {
        const updateValue = (e) => {
            const rect = ref.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;

            let value = offsetX / width;
            value = Math.max(0, Math.min(1, value));
            setVolumeValue(value);
        };

        updateValue(e);

        const handleMouseMove = (e) => {
            updateValue(e);
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

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

    const setVolumeValue = (value) => {
        if (!videoRef.current) return;
        const clamped = Math.max(0, Math.min(1, value));
        setVolume(clamped);
        if (clamped > 0 && mute) setMute(false);
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

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        if (!videoRef.current.duration || videoRef.current.duration === 0) {
            setProgress(0);
            return;
        }
        setProgress(videoRef.current.currentTime/videoRef.current.duration);
    };

    const setUpTrackingListeners = () => {
        const video = videoRef.current
        if (!video) return;

        video.addEventListener("timeupdate", handleTimeUpdate);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
        };
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "00:00:00";

        const h = Math.floor(seconds / (60 * 60));
        const m = Math.floor((seconds % (60 * 60)) / 60);
        const s = Math.floor(seconds % 60);

        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
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

    return (
        <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            className={`${styles.playerContainer}`}
        >
            {moviePath ? (
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
                                <div 
                                    ref={progressBarRef}
                                    onMouseDown={handleProgressBarSlider(progressBarRef)}
                                    className={styles.progressBar}
                                >
                                    <div
                                        className={`${styles.progressBarFill} ${roomUser?.privileges?.play_pause ? "" : styles.notEnoughPrivileges}`} 
                                        style={{width: `${progress * 100}%`}}
                                    />
                                </div>
                                <div className={styles.controlButtons}>
                                    <div className={styles.leftButtonStack}>
                                        <button 
                                            onClick={updatePlayState}
                                            className={`${roomUser?.privileges?.play_pause ? "" : styles.notEnoughPrivileges}`}
                                        >
                                            {isPlaying ? <FaPause /> : <FaPlay />}
                                        </button>
                                        <button onClick={toggleMute}>
                                            {renderVolumeIcon()}
                                        </button>
                                        <div
                                            ref={volumeBarRef}
                                            onMouseDown={handleVolumeBarSlider(volumeBarRef)}
                                            className={styles.volumeBar}
                                        >
                                            <div
                                                className={styles.volumeBarFill} 
                                                style={{width: `${volume * 100}%`}}
                                            >
                                            </div>
                                        </div>
                                        <p>
                                            {`${formatTime(videoRef.current?.currentTime || 0)} / ${formatTime(videoRef.current?.duration || 0)}`}
                                        </p>
                                    </div>
                                    <div className={styles.rightButtonStack}>
                                        <button onClick={toggleFullscreen}>
                                            {isExpanded ? <FaCompress /> : <FaExpand />}
                                        </button>
                                        <button>
                                            <FaEllipsisV />
                                        </button>
                                    </div>
                                </div>
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
