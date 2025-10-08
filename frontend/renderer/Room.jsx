import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../main/api";
import styles from "./Room.module.css";

function Room() {
    const location = useLocation();
    const { room } = location.state || {};

    const [playing, setPlaying] = useState(false);
    const url = `ws://localhost:8000/ws/socket-server/`;
    const socketRef = useRef();

    const setUpWebSocket = () => {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            if (data.action === "playing") {
                setPlaying(data.action_state);
            }
        }

        return () => {
            socket.close();
        };
    };

    useEffect(() => {
        setUpWebSocket();
    }, []);

    useEffect(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;
        socketRef.current.send(JSON.stringify({
            "type": "room_action",
            "action": "playing",
            "action_state": playing,
        }));
    }, [playing]);

    const handleSubmit = () => {
        setPlaying(!playing);
    };

    return (
        <div>
            <button 
                className={styles.button} 
                onClick={() => handleSubmit()}
            >
                {playing ? "PAUSE" : "PLAY"}
            </button>
        </div>
    );
}

export default Room;
