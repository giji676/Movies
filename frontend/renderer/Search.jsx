import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaCircleNotch  } from  "react-icons/fa";
import { toast } from 'react-toastify';
import styles from './Search.module.css';
import api from "../main/api";

function Search({ onResults, resetMovieListData, isMobile, showSearchInput, setShowSearchInput }) {
    const [query, setQuery] = useState('');
    const [lastQuery, setLastQuery] = useState('');
    const [suggestedMovies, setSuggestedMovies] = useState([]);
    const [showSuggestedMovies, setShowSuggestedMovies] = useState(null);
    const [loading, setLoading] = useState(false);
    const searchContainerRef = useRef(null);

    useEffect(() => {
        const trimmedQuery = query.trim();
        if (trimmedQuery === lastQuery) return;
        setLastQuery(trimmedQuery);
        if (!trimmedQuery) {
            setSuggestedMovies([]);
            setShowSuggestedMovies(false);
            return;
        }
        setShowSuggestedMovies(true);

        const handler = setTimeout(() => {
            api
                .get(`/movie/search-suggest/?query=${encodeURIComponent(trimmedQuery)}`)
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

    const handleSearch = async (e, explicitQuery) => {
        // If explicitQuery is provided, query with that
        // Otherwise query with the normal (useState) query
        e.preventDefault();
        if (!explicitQuery && !query) {
            resetMovieListData();
            return;
        }
        var chosenQuery; 
        if (explicitQuery) {
            chosenQuery = explicitQuery;
        } else {
            chosenQuery = query;
        }

        if (chosenQuery && !showSearchInput) {
            setShowSearchInput(true);
        }

        setLoading(true);
        api
            .get(`/movie/search/?query=${encodeURIComponent(chosenQuery)}`)
            .then((res) => res.data)
            .then((data) => onResults(data.movies))
            .catch((err) => {
                toast.error('Search error:', err);
                onResults([], {});
            })
            .finally(() => {
                setLoading(false);
            });
        setShowSearchInput(false);
        setShowSuggestedMovies(false);
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && isMobile) {
                setShowSearchInput(false);
                setShowSuggestedMovies(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchContainerRef.current &&
                    !searchContainerRef.current.contains(event.target) &&
                    isMobile
            ) {
                setShowSearchInput(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestedMovies(false);
            }
        };

        const handleClickInside = (event) => {
            if (showSuggestedMovies) return;
            if (searchContainerRef.current && searchContainerRef.current.contains(event.target)) {
                setShowSuggestedMovies(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('mousedown', handleClickInside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('mousedown', handleClickInside);
        };
    }, []);

    return (
        <div className={styles.searchContainer} ref={searchContainerRef}>
            <form
                onSubmit={(e) => {
                    if (isMobile && !showSearchInput) {
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

            {suggestedMovies.length > 0 && 
                (!isMobile || showSearchInput) && 
                showSuggestedMovies &&
                (
                <div className={styles.suggestions}>
                    {suggestedMovies.map((movie) => (
                        <div
                            onClick={(e) => {
                                handleSearch(e, movie.title);
                            }}
                            key={movie.tmdb_id}
                            className={styles.suggestionItem}
                        >
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
