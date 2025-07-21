import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Search from './Search';
import AvailableMovies from './AvailableMovies';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<> <Search /> <AvailableMovies /> </>} />
            </Routes>
        </Router>
    );
}

export default App;
