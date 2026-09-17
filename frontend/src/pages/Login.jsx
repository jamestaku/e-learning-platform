import API_URL from "../api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("Logging in...");

        try {

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Login failed");
                return;
            }

            console.log("Login response:", data);

            setMessage("Login successful!");

            // We will use this user information later
           localStorage.setItem(
    "token",
    data.token
);

localStorage.setItem(
    "user",
    JSON.stringify(data.user)
);

            // Temporary redirect
            if (data.user.role === "teacher") {
                navigate("/teacher");
            } else {
                navigate("/student");
            }

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                <h1>Welcome Back</h1>

                <p>Login to your E-Learning account</p>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

                {message && (
                    <p>{message}</p>
                )}

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">
                        Register
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;