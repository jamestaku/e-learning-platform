import { useEffect, useState } from "react";

function Dashboard() {

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const token = localStorage.getItem("token");

    const [stats, setStats] = useState({
        courses: 0,
        assignments: 0,
        averageGrade: 0,
        completedCourses: 0
    });

    const [recentCourses, setRecentCourses] = useState([]);
    const [recentSubmissions, setRecentSubmissions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const response = await fetch(
                    "http://localhost:5000/api/dashboard/student",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );


                if (!response.ok) {

                    throw new Error(
                        "Failed to load dashboard"
                    );

                }


                const data =
                    await response.json();


                setStats(data.stats);

                setRecentCourses(
                    data.recentCourses || []
                );

                setRecentSubmissions(
                    data.recentSubmissions || []
                );


            } catch (error) {

                console.error(
                    "Student dashboard error:",
                    error
                );

                setError(
                    "Unable to load dashboard data."
                );


            } finally {

                setLoading(false);

            }

        };


        fetchDashboard();

    }, [token]);


    return (

        <div>

            <h1>
                Welcome, {user?.full_name || "Student"} 👋
            </h1>

            <p className="dashboard-subtitle">
                Here's an overview of your learning progress.
            </p>


            {loading && (
                <p>
                    Loading dashboard...
                </p>
            )}


            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}


            {!loading && !error && (

                <>

                    {/* ================================= */}
                    {/* STATISTICS */}
                    {/* ================================= */}

                    <div className="stats-grid">

                        <div className="stat-card">

                            <span>📚</span>

                            <h3>
                                {stats.courses}
                            </h3>

                            <p>
                                My Courses
                            </p>

                        </div>


                        <div className="stat-card">

                            <span>📝</span>

                            <h3>
                                {stats.assignments}
                            </h3>

                            <p>
                                Assignments
                            </p>

                        </div>


                        <div className="stat-card">

                            <span>📊</span>

                            <h3>
                                {stats.averageGrade}%
                            </h3>

                            <p>
                                Average Grade
                            </p>

                        </div>


                        <div className="stat-card">

                            <span>🏆</span>

                            <h3>
                                {stats.completedCourses}
                            </h3>

                            <p>
                                Completed Courses
                            </p>

                        </div>

                    </div>


                    {/* ================================= */}
                    {/* MY LEARNING */}
                    {/* ================================= */}

                    <div className="dashboard-card">

                        <h2>
                            My Learning
                        </h2>


                        {recentCourses.length === 0 ? (

                            <p>
                                You are not enrolled in any courses yet.
                            </p>

                        ) : (

                            <div>

                                {recentCourses.map(
                                    (course) => (

                                        <div
                                            key={course.id}
                                            style={{
                                                padding: "18px 0",
                                                borderBottom:
                                                    "1px solid #eee"
                                            }}
                                        >

                                            {/* COURSE TITLE */}

                                            <h3>
                                                {course.title}
                                            </h3>


                                            {/* DESCRIPTION */}

                                            {course.description && (

                                                <p>
                                                    {course.description}
                                                </p>

                                            )}


                                            {/* PROGRESS INFORMATION */}

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: "6px"
                                                }}
                                            >

                                                <span>
                                                    Progress
                                                </span>

                                                <strong>
                                                    {
                                                        course.progress_percentage
                                                    }%
                                                </strong>

                                            </div>


                                            {/* PROGRESS BAR */}

                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "10px",
                                                    background:
                                                        "#e9ecef",
                                                    borderRadius:
                                                        "10px",
                                                    overflow: "hidden"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        width:
                                                            `${course.progress_percentage}%`,
                                                        height: "100%",
                                                        background:
                                                            "#0d6efd",
                                                        borderRadius:
                                                            "10px",
                                                        transition:
                                                            "width 0.4s ease"
                                                    }}
                                                />

                                            </div>


                                            {/* LESSON COUNT */}

                                            <p
                                                style={{
                                                    marginTop: "8px",
                                                    fontSize: "14px"
                                                }}
                                            >

                                                {course.completed_lessons} of{" "}
                                                {course.total_lessons} lessons
                                                completed

                                                {" • "}

                                                {course.remaining_lessons}{" "}
                                                remaining

                                            </p>


                                            {/* COMPLETION MESSAGE */}

                                            {course.progress_percentage === 100 && (

                                                <p
                                                    style={{
                                                        fontWeight: "600",
                                                        marginTop: "8px"
                                                    }}
                                                >
                                                    🎉 Course Completed!
                                                </p>

                                            )}

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>


                    {/* ================================= */}
                    {/* RECENT SUBMISSIONS */}
                    {/* ================================= */}

                    <div className="dashboard-card">

                        <h2>
                            Recent Submissions
                        </h2>


                        {recentSubmissions.length === 0 ? (

                            <p>
                                You have not submitted any assignments yet.
                            </p>

                        ) : (

                            <div>

                                {recentSubmissions.map(
                                    (submission) => (

                                        <div
                                            key={submission.id}
                                            style={{
                                                padding: "12px 0",
                                                borderBottom:
                                                    "1px solid #eee"
                                            }}
                                        >

                                            <h3>
                                                {
                                                    submission.assignment_title
                                                }
                                            </h3>

                                            <p>
                                                Course:{" "}
                                                {
                                                    submission.course_title
                                                }
                                            </p>

                                            <p>

                                                {submission.marks !== null
                                                    ? `Mark: ${submission.marks}%`
                                                    : "Not graded yet"
                                                }

                                            </p>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </>

            )}

        </div>

    );
}

export default Dashboard;