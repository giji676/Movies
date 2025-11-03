import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./RoomCreate.module.css";
import api from "../main/api";
import { toast } from "react-toastify";

function RoomCreate() {
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [isPrivate, setIsPrivate] = useState(true);
    const [maxUsers, setMaxUsers] = useState(4);
    const [password, setPassword] = useState("");
    const [inviteURL, setInviteURL] = useState("");

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/room/create/", {
                is_private: isPrivate,
                password: password || null,
                max_users: maxUsers,
            });
            setRoom(res.data);
        } catch (error) {
            toast.error("Failed to create room");
            console.error(error);
        }
    };

    useEffect(() => {
        if (room?.room_hash) {
            const url = `${window.location.origin}/room/${room.room_hash}/`;
            setInviteURL(url);
        }
    }, [room]);

    const handleCopy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`);
        } catch {
            toast.error("Failed to copy");
        }
    };

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
                    <div className={styles.inviteSection}>
                        <div className={styles.inviteBlock}>
                            <label>Invite Code</label>
                            <div className={styles.copyRow}>
                                <input
                                    type="text"
                                    value={room.room_hash}
                                    readOnly
                                    className={styles.copyInput}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopy(room.room_hash, "Invite code")}
                                    className={styles.copyButton}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className={styles.inviteBlock}>
                            <label>Invite URL</label>
                            <div className={styles.copyRow}>
                                <input
                                    type="text"
                                    value={inviteURL}
                                    readOnly
                                    className={styles.copyInput}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopy(inviteURL, "Invite URL")}
                                    className={styles.copyButton}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <button 
                            type="button"
                            className={styles.movieSelect}
                            onClick={() => {
                                navigate("/room-select-movie", { state: { room } });
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
