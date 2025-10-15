import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./RoomCreate.module.css";
import api from "../main/api";

function RoomCreate() {
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [isPrivate, setIsPrivate] = useState(true);
    const [maxUsers, setMaxUsers] = useState(4);
    const [password, setPassword] = useState("");

    const handleCreate = (e) => {
        e.preventDefault();
        api
            .post("/room/create/", {
                movie_id: 22,
                is_private: isPrivate,
                password: password || null,
                max_users: maxUsers,})
            .then((res) => {
                setRoom(res.data);
            })
            .catch((error) => console.log(error));
    };

    useEffect(() => {
    }, [isPrivate]);

    return (
        <div className={styles.body}>
            <form className={styles.container} onSubmit={handleCreate}>
                <div className={styles.inputRow}>
                    <label>Max users</label>
                    <input 
                        type="number"
                        name="max_users"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        className={styles.maxUserInput}
                        min="1"
                        max="8"
                    />
                </div>

                <div className={styles.checkboxRow}>
                    <label className={styles.checkboxLabel}>
                        Make private
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={() => setIsPrivate(!isPrivate)}
                            className={styles.checkbox}
                        />
                    </label>
                </div>

                {isPrivate && (
                    <input
                        type="text"
                        name="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.passInput}
                    />
                )}

                {room && (
                    <div>
                        <div>
                            Room code: {room.room_hash}
                        </div>
                        <button 
                            type="submit"
                            className={styles.movieSelect}
                            onClick={() => {
                                navigate("/room-select-movie", {state: {room: room}});
                            }}
                        >
                            Select a movie
                        </button>
                    </div>
                )}

                <div className={styles.actions}>
                    <button 
                        className={styles.save} 
                        type="submit"
                        onClick={(e) => handleCreate(e)}
                    >
                        Create
                    </button>
                    <button 
                        className={styles.cancel} 
                        type="button"
                        onClick={() => navigate("/room-access")}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RoomCreate;
