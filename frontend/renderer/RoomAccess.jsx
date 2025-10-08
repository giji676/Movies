import { useRef, useEffect, useState } from "react";
import api from "../main/api";
import styles from "./RoomAccess.module.css";
import ProtectedRoute from './components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

function RoomAccess() {
    const [createOutput, setCreateOutput] = useState("");
    const [joinCode, setJoinCode] = useState("edc49eb1bd7a"); // TEMP: set to empty string after testing
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [roomuser, setRoomUser] = useState(null);

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
        api
            .post(`/room/join/${joinCode}/`)
            .then((res) => {
                setRoom(res.data.room);
                setRoomUser(res.data.user);
                navigate("/room", {state: {room: res.data.room}});
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
            </div>
        </ProtectedRoute>
    );
}

export default RoomAccess;
