import API_URL from "../../api";
import { useEffect, useState } from "react";

function Courses() {

    const [courses, setCourses] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    const fetchCourses = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/courses/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to load courses");
                return;
            }

            setCourses(data.courses);

        } catch (error) {

            console.error(error);
            setMessage("Unable to connect to the server.");

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");

        try {

            const response = await fetch(
                `${API_URL}/api/courses`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Failed to create course");
                return;
            }

            setMessage("Course created successfully!");

            setTitle("");
            setDescription("");

            fetchCourses();

        } catch (error) {

            console.error(error);
            setMessage("Unable to connect to the server.");

        }
    };

    return (

        <div className="courses-page">

            {/* Page Header */}

            <div className="courses-header">

                <div>
                    <h1>My Courses</h1>

                    <p>
                        Create and manage the courses you teach.
                    </p>
                </div>

                <div className="course-count">

                    <strong>{courses.length}</strong>

                    <span>
                        {courses.length === 1
                            ? "Course"
                            : "Courses"}
                    </span>

                </div>

            </div>


            {/* Create Course */}

            <div className="create-course-card">

                <div className="section-heading">

                    <div className="section-icon">
                        +
                    </div>

                    <div>
                        <h2>Create New Course</h2>

                        <p>
                            Add a new course for your students.
                        </p>
                    </div>

                </div>


                <form
                    className="course-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label>
                            Course Title
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Introduction to Web Development"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Course Description
                        </label>

                        <textarea
                            placeholder="Describe what students will learn in this course..."
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            rows="5"
                        />

                    </div>


                    <div className="form-actions">

                        <button
                            type="submit"
                            className="create-course-btn"
                        >
                            Create Course
                        </button>

                    </div>

                </form>


                {message && (

                    <div className="course-message">
                        {message}
                    </div>

                )}

            </div>


            {/* Course List */}

            <div className="courses-section">

                <div className="courses-section-header">

                    <div>
                        <h2>Your Courses</h2>

                        <p>
                            Courses you have created on EduLearn.
                        </p>
                    </div>

                </div>


                {loading ? (

                    <div className="empty-courses">
                        <p>Loading courses...</p>
                    </div>

                ) : courses.length === 0 ? (

                    <div className="empty-courses">

                        <div className="empty-icon">
                            📚
                        </div>

                        <h3>No courses yet</h3>

                        <p>
                            Create your first course using the
                            form above.
                        </p>

                    </div>

                ) : (

                    <div className="course-grid">

                        {courses.map((course) => (

                            <div
                                className="course-card"
                                key={course.id}
                            >

                                <div className="course-card-top">

                                    <div className="course-icon">
                                        📚
                                    </div>

                                    <span className="course-status">
                                        Active
                                    </span>

                                </div>


                                <div className="course-card-body">

                                    <h3>
                                        {course.title}
                                    </h3>

                                    <p>
                                        {course.description ||
                                            "No description provided."}
                                    </p>

                                </div>


                                <div className="course-card-footer">

                                    <span>
                                        Created{" "}
                                        {new Date(
                                            course.created_at
                                        ).toLocaleDateString()}
                                    </span>

                                    <button>
                                        Manage
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );
}

export default Courses;