import { useState } from 'react';
import styles from './Search.module.css';

function Search({ onResults }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/movie/search/?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            onResults(data.movies, data.tmdb_config);
        } catch (err) {
            console.error('Search error:', err);
            onResults([], {});
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSearch} className={styles.form}>
            <input
                type="text"
                placeholder="Search movie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.input}
            />
            <button type="submit" className={styles.button}>
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
}

export default Search;
