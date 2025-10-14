import { useRef, useEffect, useState } from "react";
import api from "../main/api";
import styles from "./RoomAccess.module.css";
import ProtectedRoute from './components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

function RoomAccess() {
    const navigate = useNavigate();

    const [createOutput, setCreateOutput] = useState("");
    const [joinCode, setJoinCode] = useState(""); // TEMP: set to empty string after testing
    const [room, setRoom] = useState(null);
    const [roomuser, setRoomUser] = useState(null);

    const handleCreate = (e) => {
        navigate("/room-create");
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
                            create room
                        </button>
                        <div className={styles.createOutput}>
                            {room?.room_hash}
                        </div>
                    </form>
                    <span className={styles.or}>OR</span>
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
                            join room
                        </button>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default RoomAccess;
