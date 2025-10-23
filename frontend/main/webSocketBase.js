let wsBase;

// Detect environment
if (import.meta.env.DEV) {
    // In dev mode, connect directly to Django
    wsBase = "ws://localhost:8000";
} else {
    // In production, match the current site protocol and host
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsBase = `${wsProtocol}//${window.location.host}`;
}

/**
 * Returns the full WebSocket URL based on environment.
 * Example:
 *   socketUrl(`/ws/room/${roomHash}/`)
 */
const socketUrl = (path) => {
    // Ensure no accidental double slashes
    if (!path.startsWith("/")) path = `/${path}`;
    return `${wsBase}${path}`;
};

export default socketUrl;
