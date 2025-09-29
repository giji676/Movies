import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaCircleNotch  } from  "react-icons/fa";
import { toast } from 'react-toastify';
import styles from './Search.module.css';
import api from "../main/api";

function Search({ onResults, resetMovieListData, showSearchInput, setShowSearchInput }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const formRef = useRef(null);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) {
            resetMovieListData();
            return;
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
        const handleClickOutside = (event) => {
            if (
                formRef.current &&
                    !formRef.current.contains(event.target) &&
                    window.innerWidth <= 430
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
        <div>
            <form
                ref={formRef}
                onSubmit={(e) => {
                    if (window.innerWidth <= 430 && !showSearchInput) {
                        e.preventDefault(); // don't submit if just expanding
                        setShowSearchInput(true);
                    } else {
                        handleSearch(e);
                    }
                }}
                className={`${styles.form} ${showSearchInput ? styles.expanded : styles.collapsed}`}
            >
                <input
                    type="text"
                    placeholder="Search movie..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={`${styles.input} ${styles.mobileOnlyToggle}`}
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
