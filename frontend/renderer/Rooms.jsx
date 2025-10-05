import { useRef, useEffect, useState } from "react";
import api from "../main/api";
import styles from "./Rooms.module.css";

function Rooms() {
    const [playing, setPlaying] = useState(false);
    const url = `ws://localhost:8000/ws/socket-server/`;
    const socketRef = useRef();

    useEffect(() => {
        api
            .get("room/")
            .then((res) => res.data)
            .then((data) => ()=>{});

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
    }, []);

    const handleSubmit = () => {
        setPlaying(!playing);
    };

    useEffect(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;
        socketRef.current.send(JSON.stringify({
            "type": "room_action",
            "action": "playing",
            "action_state": playing,
        }));
    }, [playing]);

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

export default Rooms;
