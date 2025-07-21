import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Search from './Search';
import AvailableMovies from './AvailableMovies';
import styles from "./App.module.css";
import './Colors.module.css';

function App() {
    return (
        <Router>
            <div className={styles.body}>
                <Routes>
                    <Route path="/" element={<> <Search /> <AvailableMovies /> </>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
