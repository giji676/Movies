import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Movies from "./Movies";
import TopBar from "./components/TopBar";

// Add a on click callback event to movie card.
// in the movie card, if callback is provided call it,
// else call normal function
//
// the callback should add it to room
function RoomSelectMovie() {
    const location = useLocation();
    const room = location.state?.room || null; // safe default

    const test = () => {
        console.log("test");
    }

    return (
        <div>
            <TopBar />
            <Movies 
                navOverride={"/room"}
                room={room}
            />
        </div>
    );
}

export default RoomSelectMovie;
