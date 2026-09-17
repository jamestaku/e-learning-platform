import API_URL from "../api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "student"
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

        setMessage("Creating account...");

        try {

            const response = await fetch(
                `${API_URL}/api/auth/register`,
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
                setMessage(data.message || "Registration failed");
                return;
            }

            setMessage("Registration successful! Redirecting to login...");

            // Redirect to login after successful registration
            setTimeout(() => {
                navigate("/login");
            }, 1000);

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

                <h1>Create Account</h1>

                <p>
                    Join our E-Learning Platform
                </p>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="full_name"
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />

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

                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >

                        <option value="student">
                            Student
                        </option>

                        <option value="teacher">
                            Teacher
                        </option>

                    </select>

                    <button type="submit">
                        Create Account
                    </button>

                </form>

                {message && (
                    <p>{message}</p>
                )}

                <p>
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;

