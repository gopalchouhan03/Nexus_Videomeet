import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

// Create axios client with default headers
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
                const { token, user } = request.data;
                
                // Store token in localStorage
                localStorage.setItem("token", token);
                
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
