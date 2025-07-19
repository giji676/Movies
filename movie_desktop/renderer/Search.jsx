import { useState } from 'react';
import MovieSearchResult from './MovieSearchResult';

function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            const cat = 207;
            const count = 5;
            const response = await fetch(`http://127.0.0.1:8000/movie/search/?query=${encodeURIComponent(query)}&cat=${cat}&count=${count}`);
            const data = await response.json();
            setResults(data);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
            <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search movie..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: '0.5rem', width: '70%' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {results.map((movie, index) => (
                <MovieSearchResult key={index} movie={movie} />
            ))}
        </div>
    );
}

export default Search;
