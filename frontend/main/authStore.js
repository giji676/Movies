let _setUser = null;

export function registerSetUser(fn) {
    _setUser = fn;
}

export function clearUser() {
    if (_setUser) _setUser(null);
}
