import Movies from "./Movies";
import TopBar from "./components/TopBar";

// Add a on click callback event to movie card.
// in the movie card, if callback is provided call it,
// else call normal function
//
// the callback should add it to room
function RoomSelectMovie({ room }) {
    return (
        <div>
            <TopBar />
            <Movies />

        </div>
    );
}

export default RoomSelectMovie;
