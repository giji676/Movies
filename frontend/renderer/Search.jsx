import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaCircleNotch  } from  "react-icons/fa";
import { toast } from 'react-toastify';
import styles from './Search.module.css';
import api from "../main/api";

function Search({ onResults, resetMovieListData, showSearchInput, setShowSearchInput }) {
    const [query, setQuery] = useState('');
    const [suggestedMovies, setSuggestedMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        if (!query) {
            setSuggestedMovies([]);
            return;
        }

        const handler = setTimeout(() => {
            api
                .get(`/movie/search-suggest/?query=${encodeURIComponent(query)}`)
                .then((res) => res.data)
                .then((data) => {
                    setSuggestedMovies(data);
                })
                .catch((err) => {
                    // toast.error('Search suggest error:', err);
                });
        }, 200); // debounce

        return () => clearTimeout(handler);
    }, [query]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) {
            resetMovieListData();
            return;
        }

        if (query && !showSearchInput) {
            setShowSearchInput(true);
        }

        setLoading(true);
        api
            .get(`/movie/search/?query=${encodeURIComponent(query)}`)
            .then((res) => res.data)
            .then((data) => onResults(data.movies, data.tmdb_config))
            .catch((err) => {
                toast.error('Search error:', err);
                onResults([], {});
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && window.innerWidth <= 600) {
                setShowSearchInput(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                formRef.current &&
                    !formRef.current.contains(event.target) &&
                    window.innerWidth <= 600
            ) {
                setShowSearchInput(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.searchContainer}>
            <form
                ref={formRef}
                onSubmit={(e) => {
                    if (window.innerWidth <= 600 && !showSearchInput) {
                        e.preventDefault();
                        setShowSearchInput(true);
                    } else {
                        handleSearch(e);
                    }
                }}
                className={`${styles.form} ${showSearchInput ? styles.expanded : ""}`}
            >
                <input
                    type="text"
                    placeholder="Search movie..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={`${styles.input} ${showSearchInput ? styles.expanded : ""}`}
                />
                <button type="submit" className={styles.button} disabled={loading}>
                    <FaSearch className={styles.searchIcon} />
                </button>
            </form>

            {suggestedMovies.length > 0 && showSearchInput && (
                <div className={styles.suggestions}>
                    {suggestedMovies.map((movie) => (
                        <div key={movie.tmdb_id} className={styles.suggestionItem}>
                            <span className={styles.movieTitle}>{movie.title}</span>
                            {movie.release_date && (
                                <span className={styles.movieDate}>{movie.release_date.slice(0, 4)}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className={styles.spinnerWrapper}>
                    <FaCircleNotch className={styles.spinner} />
                </div>
            )}
        </div>
    );
}

export default Search;
