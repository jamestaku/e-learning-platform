import API_URL from "../api";
import { useEffect, useState } from "react";

function Settings() {

    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);


    // ========================================
    // DARK MODE
    // ========================================

    useEffect(() => {

        document.documentElement.classList.toggle(
            "dark",
            darkMode
        );

        localStorage.setItem(
            "theme",
            darkMode ? "dark" : "light"
        );

    }, [darkMode]);


    // ========================================
    // PASSWORD INPUT
    // ========================================

    const handlePasswordChange = (e) => {

        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });

    };


    // ========================================
    // CHANGE PASSWORD
    // ========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");
        setChangingPassword(true);

        const token =
            localStorage.getItem("token");


        try {

            const response = await fetch(
                `${API_URL}/api/users/change-password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(
                        passwordData
                    )
                }
            );


            const data = await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to change password"
                );

                return;
            }


            setMessage(
                data.message ||
                "Password changed successfully"
            );


            // Clear form
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });


        } catch (error) {

            console.error(
                "Password change error:",
                error
            );

            setError(
                "Unable to connect to the server"
            );

        } finally {

            setChangingPassword(false);
        }
    };


    return (

        <div className="settings-page">

            {/* ========================================
                HEADER
            ======================================== */}

            <div className="settings-header">

                <div>
                    <h1>Settings</h1>

                    <p>
                        Manage your appearance and account security.
                    </p>
                </div>

            </div>


            {/* ========================================
                APPEARANCE
            ======================================== */}

            <div className="settings-card">

                <div className="settings-section-header">

                    <div className="settings-icon">
                        🎨
                    </div>

                    <div>
                        <h2>Appearance</h2>

                        <p>
                            Choose how the platform looks.
                        </p>
                    </div>

                </div>


                <div className="settings-option">

                    <div className="settings-option-info">

                        <strong>
                            {darkMode
                                ? "Dark Mode"
                                : "Light Mode"}
                        </strong>

                        <span>
                            {darkMode
                                ? "The application is using dark mode."
                                : "The application is using light mode."}
                        </span>

                    </div>


                    {/* SWITCH */}

                    <label className="theme-switch">

                        <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={(e) =>
                                setDarkMode(
                                    e.target.checked
                                )
                            }
                        />

                        <span className="theme-slider"></span>

                    </label>

                </div>

            </div>


            {/* ========================================
                SECURITY
            ======================================== */}

            <div className="settings-card">

                <div className="settings-section-header">

                    <div className="settings-icon">
                        🔐
                    </div>

                    <div>
                        <h2>Security</h2>

                        <p>
                            Change your account password.
                        </p>
                    </div>

                </div>


                {message && (
                    <div className="settings-success">
                        ✓ {message}
                    </div>
                )}


                {error && (
                    <div className="settings-error">
                        ⚠ {error}
                    </div>
                )}


                <form
                    className="settings-password-form"
                    onSubmit={handleSubmit}
                >

                    <div className="settings-form-group">

                        <label>
                            Current Password
                        </label>

                        <input
                            type="password"
                            name="currentPassword"
                            value={
                                passwordData.currentPassword
                            }
                            onChange={
                                handlePasswordChange
                            }
                            placeholder="Enter current password"
                            required
                        />

                    </div>


                    <div className="settings-form-group">

                        <label>
                            New Password
                        </label>

                        <input
                            type="password"
                            name="newPassword"
                            value={
                                passwordData.newPassword
                            }
                            onChange={
                                handlePasswordChange
                            }
                            placeholder="Enter new password"
                            minLength="8"
                            required
                        />

                        <small>
                            Password must be at least 8 characters.
                        </small>

                    </div>


                    <div className="settings-form-group">

                        <label>
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={
                                passwordData.confirmPassword
                            }
                            onChange={
                                handlePasswordChange
                            }
                            placeholder="Confirm new password"
                            minLength="8"
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="change-password-btn"
                        disabled={changingPassword}
                    >

                        {changingPassword
                            ? "Changing Password..."
                            : "Change Password"}

                    </button>

                </form>

            </div>

        </div>
    );
}

export default Settings;