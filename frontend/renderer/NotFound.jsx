import styles from './NotFound.module.css';

function NotFound() {
    return (
        <div className={styles.body}>
            <h1>404 Not Found</h1>
            <p>Page doesn't exist</p>
        </div>
    );
}

export default NotFound;
