import API_URL from "../../api";
import { useEffect, useState } from "react";

function Dashboard() {

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const token = localStorage.getItem("token");

    const [stats, setStats] = useState({
        courses: 0,
        students: 0,
        assignments: 0,
        submissions: 0,
        lessons: 0
    });

    const [recentCourses, setRecentCourses] = useState([]);
    const [recentSubmissions, setRecentSubmissions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==========================================
    // LOAD DASHBOARD DATA
    // ==========================================

    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/dashboard/teacher`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    setError(
                        data.message ||
                        "Unable to load dashboard"
                    );

                    return;
                }

                setStats(
                    data.stats || {
                        courses: 0,
                        students: 0,
                        assignments: 0,
                        submissions: 0,
                        lessons: 0
                    }
                );

                setRecentCourses(
                    data.recentCourses || []
                );

                setRecentSubmissions(
                    data.recentSubmissions || []
                );


            } catch (error) {

                console.error(
                    "Dashboard error:",
                    error
                );

                setError(
                    "Unable to connect to the server"
                );

            } finally {

                setLoading(false);

            }

        };

        fetchDashboard();

    }, [token]);


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div>

                <h1>
                    Welcome, {user?.full_name || "Teacher"} 👋
                </h1>

                <p className="dashboard-subtitle">
                    Loading your dashboard...
                </p>

            </div>

        );

    }


    return (

        <div>

            {/* ==========================================
                HEADER
            ========================================== */}

            <h1>
                Welcome, {user?.full_name || "Teacher"} 👋
            </h1>

            <p className="dashboard-subtitle">
                Here's what's happening with your courses.
            </p>


            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (

                <div
                    className="course-message"
                    style={{
                        marginBottom: "20px"
                    }}
                >
                    {error}
                </div>

            )}


            {/* ==========================================
                STATISTICS
            ========================================== */}

            <div className="stats-grid">


                {/* COURSES */}

                <div className="stat-card">

                    <span>
                        📚
                    </span>

                    <h3>
                        {stats.courses}
                    </h3>

                    <p>
                        My Courses
                    </p>

                </div>


                {/* STUDENTS */}

                <div className="stat-card">

                    <span>
                        👨‍🎓
                    </span>

                    <h3>
                        {stats.students}
                    </h3>

                    <p>
                        Students
                    </p>

                </div>


                {/* ASSIGNMENTS */}

                <div className="stat-card">

                    <span>
                        📝
                    </span>

                    <h3>
                        {stats.assignments}
                    </h3>

                    <p>
                        Assignments
                    </p>

                </div>


                {/* SUBMISSIONS */}

                <div className="stat-card">

                    <span>
                        📥
                    </span>

                    <h3>
                        {stats.submissions}
                    </h3>

                    <p>
                        Submissions
                    </p>

                </div>

            </div>


            {/* ==========================================
                ADDITIONAL STATISTICS
            ========================================== */}

            <div
                className="dashboard-card"
                style={{
                    marginTop: "20px"
                }}
            >

                <h2>
                    Teaching Overview
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "15px",
                        marginTop: "20px"
                    }}
                >

                    <div
                        style={{
                            padding: "15px",
                            background: "#f8f9fa",
                            borderRadius: "8px"
                        }}
                    >

                        <strong>
                            {stats.lessons}
                        </strong>

                        <p
                            style={{
                                margin: "5px 0 0"
                            }}
                        >
                            Total Lessons
                        </p>

                    </div>


                    <div
                        style={{
                            padding: "15px",
                            background: "#f8f9fa",
                            borderRadius: "8px"
                        }}
                    >

                        <strong>
                            {stats.courses}
                        </strong>

                        <p
                            style={{
                                margin: "5px 0 0"
                            }}
                        >
                            Active Courses
                        </p>

                    </div>


                    <div
                        style={{
                            padding: "15px",
                            background: "#f8f9fa",
                            borderRadius: "8px"
                        }}
                    >

                        <strong>
                            {stats.students}
                        </strong>

                        <p
                            style={{
                                margin: "5px 0 0"
                            }}
                        >
                            Enrolled Students
                        </p>

                    </div>

                </div>

            </div>


            {/* ==========================================
                RECENT ACTIVITY
            ========================================== */}

            <div
                className="dashboard-card"
                style={{
                    marginTop: "20px"
                }}
            >

                <h2>
                    Recent Activity
                </h2>


                {/* RECENT SUBMISSIONS */}

                {recentSubmissions.length > 0 ? (

                    <div
                        style={{
                            display: "grid",
                            gap: "12px",
                            marginTop: "15px"
                        }}
                    >

                        {recentSubmissions.map(
                            (submission) => (

                                <div
                                    key={submission.id}
                                    style={{
                                        padding: "14px",
                                        border:
                                            "1px solid #e5e7eb",
                                        borderRadius:
                                            "8px",
                                        background:
                                            "#ffffff"
                                    }}
                                >

                                    <strong>
                                        📥{" "}
                                        {submission.student_name}
                                    </strong>

                                    <p
                                        style={{
                                            margin:
                                                "5px 0"
                                        }}
                                    >
                                        Submitted{" "}
                                        <strong>
                                            {submission.assignment_title}
                                        </strong>
                                    </p>

                                    <small
                                        style={{
                                            color: "#666"
                                        }}
                                    >
                                        Course:{" "}
                                        {submission.course_title}
                                    </small>

                                </div>

                            )
                        )}

                    </div>

                ) : recentCourses.length > 0 ? (

                    <div
                        style={{
                            marginTop: "15px"
                        }}
                    >

                        <p>
                            No student submissions yet.
                        </p>

                        <h3>
                            Recent Courses
                        </h3>

                        {recentCourses.map(
                            (course) => (

                                <div
                                    key={course.id}
                                    style={{
                                        padding:
                                            "12px 0",
                                        borderBottom:
                                            "1px solid #eee"
                                    }}
                                >

                                    📚 {course.title}

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <p>
                        No recent activity yet.
                    </p>

                )}

            </div>

        </div>

    );

}

export default Dashboard;

