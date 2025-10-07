import { useRef, useEffect, useState } from "react";
import api from "../main/api";
import styles from "./Rooms.module.css";
import ProtectedRoute from './components/ProtectedRoute';

function Rooms() {
    const [playing, setPlaying] = useState(false);
    const [createOutput, setCreateOutput] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const url = `ws://localhost:8000/ws/socket-server/`;
    const socketRef = useRef();

    const [room, setRoom] = useState(null);
    const [roomuser, setRoomUser] = useState(null);

    const joinRoom = (room_hash) => {
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
    };

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

    const handleCreate = (e) => {
        e.preventDefault();
        setCreateOutput("createOutput");
        api
            .post("/room/create/", {
                movie_id: 22,
                is_private: true,
                password: "testpass",
                max_users: 4,})
            .then((res) => {console.log(res.data); setRoom(res.data);})
            .catch((error) => console.log(error));
    };

    const handleJoin = (e) => {
        e.preventDefault();
        console.log("join:", joinCode);
        api
            .post(`/room/join/${joinCode}/`)
            .then((res) => {
                setRoom(res.data.room);
                setRoomUser(res.data.user);
                console.log(res.data);
            })
            .catch((error) => console.log(error));
    };
    
    return (
        <ProtectedRoute>
            <div className={styles.body}>
                <div className={styles.roomContainer}>
                    <form className={styles.form}>
                        <button 
                            className={styles.createButton}
                            onClick={(e) => handleCreate(e)}
                        >
                            CREATE
                        </button>
                        <div className={styles.createOutput}>
                            {room?.room_hash}
                        </div>
                    </form>
                    <form 
                        className={styles.form}
                        onSubmit={(e) => handleJoin(e)}
                    >
                        <input 
                            type="text" 
                            className={styles.input}
                            placeholder="Enter code"
                            onChange={(e) => setJoinCode(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className={styles.joinButton}
                        >
                            JOIN
                        </button>
                    </form>
                </div>
                <button 
                    className={styles.button} 
                    onClick={() => handleSubmit()}
                >
                    {playing ? "PAUSE" : "PLAY"}
                </button>
            </div>
        </ProtectedRoute>
    );
}

export default Rooms;
