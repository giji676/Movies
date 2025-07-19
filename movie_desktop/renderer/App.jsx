import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Search from './Search';
import Movie from './Movie';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Search />} />
                <Route path="/movie" element={<Movie />} />
            </Routes>
        </Router>
    );
}

export default App;
