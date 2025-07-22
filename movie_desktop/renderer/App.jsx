import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Search from './Search';
import Movie from './Movie';
import AvailableMovies from './AvailableMovies';
import styles from "./App.module.css";
import './Colors.module.css';

function App() {
    return (
        <Router>
            <div className={styles.body}>
                <Routes>
                    <Route path="/" element={<> <Search /> <AvailableMovies /> </>} />
                    <Route path="/movie" element={<Movie />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
