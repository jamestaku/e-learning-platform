import API_URL from "../api";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function StudentLayout() {

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const [unreadCount, setUnreadCount] = useState(0);

    // ==========================================
    // GET UNREAD NOTIFICATION COUNT
    // ==========================================

    const fetchUnreadCount = async () => {

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await fetch(
                `${API_URL}/api/notifications/unread/count`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {

                setUnreadCount(
                    data.unread_count || 0
                );

            }

        } catch (error) {

            console.error(
                "Get unread notification count error:",
                error
            );

        }

    };


    // ==========================================
    // LOAD UNREAD COUNT
    // ==========================================

    useEffect(() => {

        fetchUnreadCount();

        // Check again every 30 seconds
        const interval = setInterval(
            fetchUnreadCount,
            30000
        );

        return () => clearInterval(interval);

    }, []);


    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/login");

    };


    return (

        <div className="dashboard-container">

            <aside className="sidebar">

                <div className="sidebar-logo">

                    <h2>
                        EduLearn
                    </h2>

                    <p>
                        Student Portal
                    </p>

                </div>


                <nav>

                    <Link to="/student">
                        📊 Dashboard
                    </Link>

                    <Link to="/student/courses">
                        📚 My Courses
                    </Link>

                    

                    <Link to="/student/assignments">
                        📝 Assignments
                    </Link>

                    <Link to="/student/grades">
                        <span>📊</span>
                        Grades
                    </Link>

                    <Link to="/student/messages">
                        💬 Messages
                    </Link>


                    {/* NOTIFICATIONS */}

                    <Link
                        to="/student/notifications"
                        className="notification-sidebar-link"
                    >

                        <span>
                            🔔 Notifications
                        </span>

                        {unreadCount > 0 && (

                            <span className="notification-badge">

                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}

                            </span>

                        )}

                    </Link>


                    <Link to="/student/settings">
                        ⚙️ Settings
                    </Link>

                </nav>


                <button
                    className="logout-button"
                    onClick={logout}
                >
                    🚪 Logout
                </button>

            </aside>


            <main className="dashboard-main">

                <header className="dashboard-header">

                    <div>

                        <h2>
                            Student Dashboard
                        </h2>

                    </div>


                    <div className="user-info">

                        <strong>
                            {user?.full_name || "Student"}
                        </strong>

                        <span>
                            Student
                        </span>

                    </div>

                </header>


                <section className="dashboard-content">

                    <Outlet />

                </section>

            </main>

        </div>

    );

}

export default StudentLayout;

