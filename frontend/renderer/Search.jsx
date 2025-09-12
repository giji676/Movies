import { useState } from 'react';
import { FaSearch, FaCircleNotch  } from  "react-icons/fa";
import styles from './Search.module.css';
import api from "../main/api";

function Search({ onResults, resetMovieListData }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) {
            resetMovieListData();
            return;
        }

        setLoading(true);
        api
            .get(`/api/movie/search/?query=${encodeURIComponent(query)}`)
            .then((res) => res.data)
            .then((data) => onResults(data.movies, data.tmdb_config))
            .catch((err) => {
                console.error('Search error:', err);
                onResults([], {});
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div>
            <form onSubmit={handleSearch} className={styles.form}>
                <input
                    type="text"
                    placeholder="Search movie..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.input}
                />
                <button type="submit" className={styles.button} disabled={loading}>
                    <FaSearch className={styles.searchIcon} />
                </button>
            </form>
            {loading && (
                <div className={styles.spinnerWrapper}>
                    <FaCircleNotch className={styles.spinner} />
                </div>
            )}
        </div>
    );
}

export default Search;
