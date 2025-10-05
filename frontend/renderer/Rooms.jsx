import { useEffect } from "react";
import api from "../main/api";

function Rooms() {
    const url = `ws://localhost:8000/ws/socket-server/`;

    useEffect(() => {
        api
            .get("room/")
            .then((res) => res.data)
            .then((data) => console.log(data));

        const roomSocket = new WebSocket(url);

        roomSocket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            console.log(data);
        }
    }, []);
}

export default Rooms;
