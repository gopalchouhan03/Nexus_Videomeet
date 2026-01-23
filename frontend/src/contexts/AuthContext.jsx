import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Refresh token and retry logic
const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await axios.post(`${server}/api/v1/users/refresh-token`, {
            refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem("token", token);
        return token;
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth";
        throw error;
    }
};

// Create axios client with default headers and interceptors
const createAuthClient = () => {
    const client = axios.create({
        baseURL: `${server}/api/v1/users`,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Add token to headers if it exists
    const token = localStorage.getItem("token");
    if (token) {
        client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Response interceptor for automatic token refresh
    client.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Handle 401 Unauthorized errors (expired token)
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers["Authorization"] = `Bearer ${token}`;
                            return client(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const newToken = await refreshAccessToken();
                    client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    return client(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
};

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
            // Verify token is still valid (optional - can be added)
        }
        setLoading(false);
    }, []);

    const handleRegister = async (name, username, password) => {
        try {
            const client = createAuthClient();
            const request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const client = createAuthClient();
            const request = await client.post("/login", {
                username: username,
                password: password,
            });

            if (request.status === httpStatus.OK) {
                const { token, refreshToken, user } = request.data;
                
                // Store tokens in localStorage
                localStorage.setItem("token", token);
                localStorage.setItem("refreshToken", refreshToken);
                
                // Store user data
                setUserData(user);
                setIsAuthenticated(true);

                // Update default header for future requests
                client.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                router("/home");
                return request.data;
            }
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("User is not authenticated");
            }

            const client = axios.create({
                baseURL: `${server}/api/v1/users`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const request = await client.get("/get_all_activity");
            return request.data.data || request.data;
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            // Create fresh axios client to ensure token is included
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("User is not authenticated");
            }

            const client = axios.create({
                baseURL: `${server}/api/v1/users`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const request = await client.post("/add_to_activity", {
                meeting_code: meetingCode,
            });
            return request;
        } catch (e) {
            throw e;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUserData(null);
        setIsAuthenticated(false);
        router("/auth");
    };

    const data = {
        userData,
        setUserData,
        isAuthenticated,
        loading,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
        handleLogout,
    };

    return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
}
