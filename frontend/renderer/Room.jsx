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

    const [moviePath, setMoviePath] = useState("");
    const [roomUser, setRoomUser] = useState(null);
    const [originTimeStamp, setOriginTimeStamp] = useState(null);
    const [showInputs, setShowInputs] = useState(true);
    const [progress, setProgress] = useState(null);

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

        // videoRef.current.currentTime = originTimeStamp;

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
                    updatePlayState();
                    break;
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [roomUser]);

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
            }
        } else {
            if (!video.paused) video.pause();
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

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    "action_type": "seek",
                    "action_state": timeStamp,
                    "action_time": new Date(),
                }));
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        if (!videoRef.current.duration || videoRef.current.duration === 0) {
            setProgress(0);
            return;
        }
        setProgress(videoRef.current.currentTime/videoRef.current.duration);
    };

    // const handleSeek = () => {
    //     if (!videoRef.current) return;
    //     const newTime = videoRef.current.currentTime;
    //     console.log("seek:", newTime);
    // };
    //
    const setUpTrackingListeners = () => {
        const video = videoRef.current
        if (!video) return;

        // video.addEventListener("play", () => {updateState(); startTracking();});
        // video.addEventListener("pause", () => {updateState(); stopTracking();});
        // video.addEventListener("ended", stopTracking);
        // video.addEventListener("seeked", handleSeek);
        video.addEventListener("timeupdate", handleTimeUpdate);

        if (!video.paused) {
            // startTracking();
        }

        return () => {
            // stopTracking();
            // video.removeEventListener("play", stopTracking);
            // video.removeEventListener("pause", stopTracking);
            // video.removeEventListener("ended", stopTracking);
            // video.removeEventListener("seeked", handleSeek);
            video.removeEventListener("timeupdate", handleTimeUpdate);
        };
    };

    return (
        <div
            className={`${styles.playerContainer}`}
        >
            {moviePath ? (
                <>
                    <div 
                        className={styles.videoContainer}
                    >
                        <video
                            ref={videoRef}
                            className={styles.video}
                            crossOrigin="anonymous"
                            autoPlay
                        />
                        {showInputs && (
                            <>
                                <div className={styles.controlBar}>
                                    <div 
                                        ref={progressBarRef}
                                        onMouseDown={handleProgressBarSlider(progressBarRef)}
                                        className={styles.progressBar}
                                    >
                                        <div
                                            className={styles.progressBarFill} 
                                            style={{width: `${progress * 100}%`}}
                                        />
                                    </div>
                                    <div className={styles.controlButtons}>
                                        <div className={styles.leftButtonStack}>
                                            <button>
                                                <FaPlay />
                                            </button>
                                            <button>
                                                <FaVolumeMute />
                                            </button>
                                            <div
                                                className={styles.volumeBar}
                                            >
                                                <div
                                                    className={styles.volumeBarFill} 
                                                    // style={{width: `${volume * 100}%`}}
                                                >
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.rightButtonStack}>
                                            <button>
                                                <FaExpand />
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
                </>
            ) : (
                    <div>

                    </div>
                )}
        </div>
    );
}

export default Room;
