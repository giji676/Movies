import { useState, useEffect } from "react";
import styles from "./RoomCreate.module.css";
import api from "../main/api";

function RoomCreate() {
    const [room, setRoom] = useState(null);
    const [isPrivate, setIsPrivate] = useState(true);
    const [maxUsers, setMaxUsers] = useState(4);
    const [password, setPassword] = useState("");

    const handleCreate = (e) => {
        e.preventDefault();
        setCreateOutput("createOutput");
        api
            .post("/room/create/", {
                movie_id: 22,
                is_private: true,
                password: "testpass" || null,
                max_users: 4,})
            .then((res) => {console.log(res.data); setRoom(res.data);})
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
                        max="10"
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

                <div className={styles.actions}>
                    <button className={styles.save} type="submit">Save</button>
                    <button className={styles.cancel} type="button">Cancel</button>
                </div>
            </form>
        </div>
    );
}

export default RoomCreate;
