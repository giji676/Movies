import { useState } from 'react';
import MovieSearchResult from './MovieSearchResult';
import styles from './Search.module.css';

function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            const cat = 207;
            const count = 5;
            const response = await fetch(`http://192.168.1.215:8000/movie/search/?query=${encodeURIComponent(query)}&cat=${cat}&count=${count}`);
            const data = await response.json();
            setTmdbConfig(data.tmdb_config);

            const uniqueResults = [];
            const seen = new Set();
            for (const movie of data.movies) {
                if (movie.imdb && !seen.has(movie.tmdb_id)) {
                    seen.add(movie.tmdb_id);
                    uniqueResults.push(movie);
                }
            }
            setResults(uniqueResults);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
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

            {results.map((movie, index) => (
                <MovieSearchResult key={index} movie={movie} tmdbConfig={tmdbConfig} />
            ))}
        </div>
    );
}

export default Search;
