
import API_URL from "../../api";
import { useEffect, useState } from "react";

function Courses() {

    const [courses, setCourses] = useState([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [editingCourse, setEditingCourse] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const token = localStorage.getItem("token");


    // ==========================================
    // FETCH TEACHER COURSES
    // ==========================================

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

                setMessage(
                    data.message || "Unable to load courses"
                );

                return;
            }

            setCourses(data.courses);

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchCourses();

    }, []);


    // ==========================================
    // CREATE COURSE
    // ==========================================

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

                setMessage(
                    data.message || "Failed to create course"
                );

                return;
            }

            setMessage(
                "Course created successfully!"
            );

            setTitle("");
            setDescription("");

            fetchCourses();

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );

        }
    };


    // ==========================================
    // START EDITING
    // ==========================================

    const handleEdit = (course) => {

        setEditingCourse(course);

        setEditTitle(course.title);
        setEditDescription(course.description || "");

        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // ==========================================
    // CANCEL EDIT
    // ==========================================

    const handleCancelEdit = () => {

        setEditingCourse(null);

        setEditTitle("");
        setEditDescription("");

        setMessage("");
    };


    // ==========================================
    // UPDATE COURSE
    // ==========================================

    const handleUpdate = async (e) => {

        e.preventDefault();

        if (!editingCourse) {
            return;
        }

        setSaving(true);
        setMessage("");

        try {

            const response = await fetch(
                `${API_URL}/api/courses/${editingCourse.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        title: editTitle,
                        description: editDescription
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message || "Failed to update course"
                );

                return;
            }

            setMessage(
                "Course updated successfully!"
            );

            setEditingCourse(null);

            setEditTitle("");
            setEditDescription("");

            fetchCourses();

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );

        } finally {

            setSaving(false);

        }
    };


    // ==========================================
    // DELETE COURSE
    // ==========================================

    const handleDelete = async (course) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${course.title}"?`
        );

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setMessage("");

        try {

            const response = await fetch(
                `${API_URL}/api/courses/${course.id}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message || "Failed to delete course"
                );

                return;
            }

            setMessage(
                "Course deleted successfully!"
            );

            if (
                editingCourse &&
                editingCourse.id === course.id
            ) {
                handleCancelEdit();
            }

            fetchCourses();

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );

        } finally {

            setDeleting(false);

        }
    };


    return (

        <div className="courses-page">


            {/* ======================================
                PAGE HEADER
            ====================================== */}

            <div className="courses-header">

                <div>

                    <h1>My Courses</h1>

                    <p>
                        Create and manage the courses you teach.
                    </p>

                </div>


                <div className="course-count">

                    <strong>
                        {courses.length}
                    </strong>

                    <span>
                        {courses.length === 1
                            ? "Course"
                            : "Courses"}
                    </span>

                </div>

            </div>


            {/* ======================================
                EDIT COURSE
            ====================================== */}

            {editingCourse && (

                <div className="create-course-card">

                    <div className="section-heading">

                        <div className="section-icon">
                            ✏️
                        </div>

                        <div>

                            <h2>
                                Edit Course
                            </h2>

                            <p>
                                Update the information for this course.
                            </p>

                        </div>

                    </div>


                    <form
                        className="course-form"
                        onSubmit={handleUpdate}
                    >

                        <div className="form-group">

                            <label>
                                Course Title
                            </label>

                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) =>
                                    setEditTitle(e.target.value)
                                }
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Course Description
                            </label>

                            <textarea
                                value={editDescription}
                                onChange={(e) =>
                                    setEditDescription(e.target.value)
                                }
                                rows="5"
                            />

                        </div>


                        <div className="form-actions">

                            <button
                                type="submit"
                                className="create-course-btn"
                                disabled={saving}
                            >

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>


                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="btn btn-secondary ms-2"
                            >

                                Cancel

                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* ======================================
                CREATE COURSE
            ====================================== */}

            {!editingCourse && (

                <div className="create-course-card">

                    <div className="section-heading">

                        <div className="section-icon">
                            +
                        </div>

                        <div>

                            <h2>
                                Create New Course
                            </h2>

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

                </div>

            )}


            {/* ======================================
                MESSAGE
            ====================================== */}

            {message && (

                <div className="course-message">

                    {message}

                </div>

            )}


            {/* ======================================
                COURSE LIST
            ====================================== */}

            <div className="courses-section">

                <div className="courses-section-header">

                    <div>

                        <h2>
                            Your Courses
                        </h2>

                        <p>
                            Courses you have created on EduLearn.
                        </p>

                    </div>

                </div>


                {loading ? (

                    <div className="empty-courses">

                        <p>
                            Loading courses...
                        </p>

                    </div>

                ) : courses.length === 0 ? (

                    <div className="empty-courses">

                        <div className="empty-icon">
                            📚
                        </div>

                        <h3>
                            No courses yet
                        </h3>

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


                                    <div className="course-actions">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(course)
                                            }
                                            className="btn btn-primary"
                                        >
                                            Edit
                                        </button>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(course)
                                            }
                                            disabled={deleting}
                                            className="btn btn-danger ms-2"
                                        >
                                            {deleting
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>

                                    </div>

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

