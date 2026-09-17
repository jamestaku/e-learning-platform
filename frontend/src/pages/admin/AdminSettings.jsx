import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

function AdminSettings() {

    // ========================================
    // USER
    // ========================================

    const [user, setUser] = useState(null);

    // ========================================
    // PASSWORD
    // ========================================

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // ========================================
    // THEME
    // ========================================

    const { theme, setTheme } = useOutletContext();


    // ========================================
    // LOAD USER
    // ========================================

    useEffect(() => {

        const savedUser =
            localStorage.getItem("user");

        if (savedUser) {

            try {

                setUser(
                    JSON.parse(savedUser)
                );

            } catch (error) {

                console.error(
                    "Error loading user:",
                    error
                );

            }
        }

    }, []);


    // ========================================
    // APPLY THEME
    // ========================================

  


    // ========================================
    // CHANGE THEME
    // ========================================

    const handleThemeChange = (selectedTheme) => {

        setTheme(selectedTheme);

    };


    // ========================================
    // CHANGE PASSWORD
    // ========================================

    const handleChangePassword = async (e) => {

        e.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            setPasswordError(
                "All password fields are required."
            );

            return;
        }


        if (newPassword !== confirmPassword) {

            setPasswordError(
                "New passwords do not match."
            );

            return;
        }


        if (newPassword.length < 8) {

            setPasswordError(
                "New password must be at least 8 characters long."
            );

            return;
        }


        try {

            setChangingPassword(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/users/change-password",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        currentPassword,
                        newPassword,
                        confirmPassword

                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to change password"
                );
            }


            setPasswordMessage(
                "Password changed successfully."
            );


            // Clear fields
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );

            setPasswordError(
                error.message
            );

        } finally {

            setChangingPassword(false);
        }
    };


    return (

        <div className="container-fluid p-4">

            {/* ========================================
                HEADER
            ======================================== */}

            <div className="mb-4">

                <h2 className="fw-bold mb-1">
                    Settings
                </h2>

                <p className="text-muted mb-0">
                    Manage your account and application preferences
                </p>

            </div>


            <div className="row g-4">


                {/* ========================================
                    ACCOUNT INFORMATION
                ======================================== */}

                <div className="col-lg-4">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="text-center mb-4">

                                <div
                                    className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center mx-auto mb-3"
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        fontSize: "30px"
                                    }}
                                >
                                    <i className="fas fa-user-shield"></i>
                                </div>

                                <h5 className="fw-bold mb-1">
                                    {user?.full_name || "Administrator"}
                                </h5>

                                <span className="badge bg-primary">
                                    Administrator
                                </span>

                            </div>


                            <hr />


                            <div className="mb-3">

                                <small className="text-muted">
                                    Full Name
                                </small>

                                <div className="fw-semibold">
                                    {user?.full_name || "—"}
                                </div>

                            </div>


                            <div className="mb-3">

                                <small className="text-muted">
                                    Email
                                </small>

                                <div className="fw-semibold">
                                    {user?.email || "—"}
                                </div>

                            </div>


                            <div>

                                <small className="text-muted">
                                    Role
                                </small>

                                <div className="fw-semibold text-capitalize">
                                    {user?.role || "admin"}
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-lg-8">


                    {/* ========================================
                        CHANGE PASSWORD
                    ======================================== */}

                    <div className="card border-0 shadow-sm mb-4">

                        <div className="card-header bg-white py-3">

                            <h5 className="mb-0 fw-bold">

                                <i className="fas fa-lock me-2 text-primary"></i>

                                Change Password

                            </h5>

                        </div>


                        <div className="card-body p-4">

                            {passwordMessage && (

                                <div className="alert alert-success">

                                    <i className="fas fa-check-circle me-2"></i>

                                    {passwordMessage}

                                </div>

                            )}


                            {passwordError && (

                                <div className="alert alert-danger">

                                    <i className="fas fa-exclamation-circle me-2"></i>

                                    {passwordError}

                                </div>

                            )}


                            <form
                                onSubmit={handleChangePassword}
                            >

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Current Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter current password"
                                    />

                                </div>


                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        New Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter new password"
                                    />

                                    <small className="text-muted">
                                        Password must be at least 8 characters.
                                    </small>

                                </div>


                                <div className="mb-4">

                                    <label className="form-label fw-semibold">
                                        Confirm New Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                    />

                                </div>


                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={changingPassword}
                                >

                                    {changingPassword ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                            ></span>

                                            Changing Password...
                                        </>

                                    ) : (

                                        <>
                                            <i className="fas fa-key me-2"></i>
                                            Change Password
                                        </>

                                    )}

                                </button>

                            </form>

                        </div>

                    </div>


                    {/* ========================================
                        APPEARANCE
                    ======================================== */}

                    <div className="card border-0 shadow-sm">

                        <div className="card-header bg-white py-3">

                            <h5 className="mb-0 fw-bold">

                                <i className="fas fa-palette me-2 text-primary"></i>

                                Appearance

                            </h5>

                        </div>


                        <div className="card-body p-4">

                            <p className="text-muted">
                                Choose how the admin dashboard should appear.
                            </p>


                            <div className="row g-3">

                                {/* LIGHT */}

                                <div className="col-md-6">

                                    <button
                                        type="button"
                                        className={`btn w-100 p-3 border ${
                                            theme === "light"
                                                ? "border-primary bg-light"
                                                : "bg-white"
                                        }`}
                                        onClick={() =>
                                            handleThemeChange(
                                                "light"
                                            )
                                        }
                                    >

                                        <i className="fas fa-sun fs-3 text-warning d-block mb-2"></i>

                                        <strong>
                                            Light Mode
                                        </strong>

                                        <div className="small text-muted">
                                            Use the light appearance
                                        </div>

                                    </button>

                                </div>


                                {/* DARK */}

                                <div className="col-md-6">

                                    <button
                                        type="button"
                                        className={`btn w-100 p-3 border ${
                                            theme === "dark"
                                                ? "border-primary bg-dark text-white"
                                                : "bg-white"
                                        }`}
                                        onClick={() =>
                                            handleThemeChange(
                                                "dark"
                                            )
                                        }
                                    >

                                        <i className="fas fa-moon fs-3 text-primary d-block mb-2"></i>

                                        <strong>
                                            Dark Mode
                                        </strong>

                                        <div className="small">
                                            Use the dark appearance
                                        </div>

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AdminSettings;