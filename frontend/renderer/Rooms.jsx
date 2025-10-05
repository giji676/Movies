import { useRef, useEffect, useState } from "react";
import api from "../main/api";
import styles from "./Rooms.module.css";

function Rooms() {
    const [res, setRes] = useState(null);
    const [playing, setPlaying] = useState(null);
    const url = `ws://localhost:8000/ws/socket-server/`;
    const socketRef = useRef();

    useEffect(() => {
        api
            .get("room/")
            .then((res) => res.data)
            .then((data) => console.log(data));

        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            if (data.action) {
                setRes(data.res);
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
            "action": playing,
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
            <div>
                {res}
            </div>
        </div>
    );
}

export default Rooms;
