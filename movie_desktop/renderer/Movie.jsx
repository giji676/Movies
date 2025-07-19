import { useLocation, useNavigate } from 'react-router-dom';

function Movie() {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie } = location.state || {};

    if (!movie) {
        return (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p>No movie data found.</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const { original_title, release_date, overview, poster_path } = movie.tmdb;

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
            <h1>{original_title}</h1>
            {poster_path && (
                <img
                    src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                    alt={original_title}
                    style={{ borderRadius: '8px', marginBottom: '1rem' }}
                />
            )}
            <p><strong>Release Date:</strong> {release_date}</p>
            <p style={{ marginTop: '1rem' }}>{overview}</p>
            <button onClick={() => navigate(-1)} style={{ marginTop: '2rem' }}>Back to Search</button>
        </div>
    );
}

export default Movie;
