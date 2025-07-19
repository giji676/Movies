function MovieSearchResult({ movie }) {
    const { original_title, release_date, overview, poster_path } = movie.tmdb;

    return (
        <div style={{
            display: 'flex',
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            alignItems: 'center'
        }}>
            {poster_path && (
                <img
                    src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                    alt={original_title}
                    style={{ marginRight: '1rem', borderRadius: '8px' }}
                />
            )}
            <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{original_title}</h3>
                <p style={{ margin: 0, color: '#555' }}>{release_date}</p>
                <p style={{ marginTop: '0.5rem' }}>{overview}</p>
            </div>
        </div>
    );
}

export default MovieSearchResult;
