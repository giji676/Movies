export const setTokens = (access_exp, refresh_exp, type) => {
    localStorage.setItem("access_token", access_exp);
    localStorage.setItem("refresh_token", refresh_exp);
    localStorage.setItem("last_login", type); // guest | registered
};

export const getTokens = () => {
    const access_exp = localStorage.getItem("access_token");
    const refresh_exp = localStorage.getItem("refresh_token");
    const type = localStorage.getItem("last_login");
    return { access_exp, refresh_exp, type };
};

export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("last_login");
    localStorage.removeItem("device_id");
};

export const getDeviceId = () => {
    return localStorage.getItem("device_id");
};

export const setDeviceId = (id) => {
    return localStorage.setItem("device_id", id);
};
