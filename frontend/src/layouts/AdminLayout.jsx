import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function AdminLayout() {
    const navigate = useNavigate();

    // Theme state
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute(
            "data-bs-theme",
            theme
        );

        localStorage.setItem("theme", theme);
    }, [theme]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="d-flex min-vh-100">

            {/* ================= SIDEBAR ================= */}
            <aside
                className="bg-dark text-white p-3"
                style={{ width: "250px" }}
            >
                <h4 className="mb-4">
                    Admin Panel
                </h4>

                <nav className="nav flex-column gap-2">

                    {/* Dashboard */}
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                            `nav-link text-white ${
                                isActive
                                    ? "active bg-primary"
                                    : ""
                            }`
                        }
                    >
                        <i className="bi bi-speedometer2 me-2"></i>
                        Dashboard
                    </NavLink>

                    {/* Users */}
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `nav-link text-white ${
                                isActive
                                    ? "active bg-primary"
                                    : ""
                            }`
                        }
                    >
                        <i className="bi bi-people me-2"></i>
                        Users
                    </NavLink>

                    {/* Settings */}
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) =>
                            `nav-link text-white ${
                                isActive
                                    ? "active bg-primary"
                                    : ""
                            }`
                        }
                    >
                        <i className="bi bi-gear me-2"></i>
                        Settings
                    </NavLink>

                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="btn btn-danger w-100 mt-4"
                >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                </button>
            </aside>


            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-grow-1 bg-body">

                {/* Top Header */}
                <div className="bg-body border-bottom p-3">
                    <h5 className="mb-0">
                        Administration
                    </h5>
                </div>

                {/* Page Content */}
                <div className="p-4">

                    <Outlet
                        context={{
                            theme,
                            setTheme
                        }}
                    />

                </div>

            </main>

        </div>
    );
}

export default AdminLayout;