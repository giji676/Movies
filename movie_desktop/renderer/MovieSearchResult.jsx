import { Link } from 'react-router-dom';
import styles from './MovieSearchResult.module.css';

function MovieSearchResult({ movie }) {
    const { original_title, release_date, overview, poster_path } = movie.tmdb;

    return (
        <Link
            to="/movie"
            state={{ movie }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movieResult}>
                {poster_path && (
                    <img
                        src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                        alt={original_title}
                        className={styles.poster}
                    />
                )}
                <div className={styles.details}>
                    <h3 className={styles.title}>{original_title}</h3>
                    <p className={styles.date}>{release_date}</p>
                    <p className={styles.overview}>{overview}</p>
                </div>
            </div>
        </Link>
    );
}

export default MovieSearchResult;
