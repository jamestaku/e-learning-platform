import { useEffect, useState } from "react";

function Assignments() {

    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [courseId, setCourseId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [pdf, setPdf] = useState(null);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");


    const token = localStorage.getItem("token");


    // ==========================================
    // LOAD TEACHER COURSES
    // ==========================================

    const fetchCourses = async () => {

        try {

            const response = await fetch(
                "http://localhost:5000/api/courses/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to load courses"
                );

                return;
            }


            setCourses(
                data.courses || []
            );


        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server"
            );

        }

    };


    // ==========================================
    // LOAD ASSIGNMENTS
    // ==========================================

    const fetchAssignments = async () => {

        try {

            const response = await fetch(
                "http://localhost:5000/api/assignments/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to load assignments"
                );

                return;
            }


            setAssignments(
                data.assignments || []
            );


        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server"
            );


        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchCourses();
        fetchAssignments();

    }, []);


    // ==========================================
    // CREATE ASSIGNMENT
    // ==========================================

    const handleCreateAssignment = async (event) => {

        event.preventDefault();

        setMessage("");


        if (!courseId) {

            setMessage(
                "Please select a course."
            );

            return;

        }


        if (!title.trim()) {

            setMessage(
                "Please enter an assignment title."
            );

            return;

        }


        // Check PDF size
        if (pdf && pdf.size > 10 * 1024 * 1024) {

            setMessage(
                "PDF file must not be larger than 10 MB."
            );

            return;

        }


        setCreating(true);


        try {

            const formData = new FormData();

            formData.append(
                "course_id",
                courseId
            );

            formData.append(
                "title",
                title
            );

            formData.append(
                "description",
                description
            );

            formData.append(
                "due_date",
                dueDate
            );


            if (pdf) {

                formData.append(
                    "pdf",
                    pdf
                );

            }


            const response = await fetch(
                "http://localhost:5000/api/assignments",
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: formData
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to create assignment"
                );

                return;

            }


            setMessage(
                "Assignment created successfully!"
            );


            // Clear form
            setCourseId("");
            setTitle("");
            setDescription("");
            setDueDate("");
            setPdf(null);


            // Reset file input
            document.getElementById(
                "assignment-pdf"
            ).value = "";


            // Reload assignments
            fetchAssignments();


        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server"
            );

        } finally {

            setCreating(false);

        }

    };


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {

        if (!date) {
            return "No due date";
        }


        return new Date(date).toLocaleString();

    };


    return (

        <div className="assignments-page">


            {/* ==================================
                PAGE HEADER
            ================================== */}

            <div className="assignments-header">

                <div>

                    <h1>
                        Assignments
                    </h1>

                    <p>
                        Create and manage assignments for
                        your courses.
                    </p>

                </div>


                <div className="assignment-count">

                    <strong>
                        {assignments.length}
                    </strong>

                    <span>
                        Assignments
                    </span>

                </div>

            </div>


            {/* ==================================
                MESSAGE
            ================================== */}

            {message && (

                <div className="assignment-message">

                    {message}

                </div>

            )}


            {/* ==================================
                CREATE ASSIGNMENT
            ================================== */}

            <div className="assignment-create-card">

                <div className="assignment-section-heading">

                    <div className="assignment-section-icon">
                        📝
                    </div>

                    <div>

                        <h2>
                            Create New Assignment
                        </h2>

                        <p>
                            Add an assignment for one of your courses.
                        </p>

                    </div>

                </div>


                <form
                    className="assignment-form"
                    onSubmit={handleCreateAssignment}
                >


                    {/* Course */}

                    <div className="assignment-form-group">

                        <label>
                            Course
                        </label>

                        <select
                            value={courseId}
                            onChange={(event) =>
                                setCourseId(
                                    event.target.value
                                )
                            }
                            required
                        >

                            <option value="">
                                Select a course
                            </option>

                            {courses.map((course) => (

                                <option
                                    key={course.id}
                                    value={course.id}
                                >
                                    {course.title}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* Title */}

                    <div className="assignment-form-group">

                        <label>
                            Assignment Title
                        </label>

                        <input
                            type="text"
                            placeholder="Enter assignment title"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* Description */}

                    <div className="assignment-form-group">

                        <label>
                            Instructions / Description
                        </label>

                        <textarea
                            placeholder="Enter assignment instructions..."
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            rows="6"
                        ></textarea>

                    </div>


                    <div className="assignment-form-row">


                        {/* Due Date */}

                        <div className="assignment-form-group">

                            <label>
                                Due Date
                            </label>

                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(event) =>
                                    setDueDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        {/* PDF */}

                        <div className="assignment-form-group">

                            <label>
                                Assignment PDF
                            </label>

                            <input
                                id="assignment-pdf"
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(event) =>
                                    setPdf(
                                        event.target.files[0] || null
                                    )
                                }
                            />

                            <small>
                                PDF only • Maximum 10 MB
                            </small>

                        </div>

                    </div>


                    {/* Submit */}

                    <button
                        type="submit"
                        className="create-assignment-btn"
                        disabled={creating}
                    >

                        {creating
                            ? "Creating..."
                            : "Create Assignment"}

                    </button>


                </form>

            </div>


            {/* ==================================
                ASSIGNMENT LIST
            ================================== */}

            <div className="assignments-list-card">

                <div className="assignments-list-header">

                    <div>

                        <h2>
                            My Assignments
                        </h2>

                        <p>
                            Assignments you have created.
                        </p>

                    </div>


                    <span className="assignment-list-count">

                        {assignments.length}

                    </span>

                </div>


                {loading ? (

                    <div className="assignments-empty">

                        <p>
                            Loading assignments...
                        </p>

                    </div>

                ) : assignments.length === 0 ? (

                    <div className="assignments-empty">

                        <div className="assignment-empty-icon">
                            📝
                        </div>

                        <h3>
                            No assignments yet
                        </h3>

                        <p>
                            Create your first assignment above.
                        </p>

                    </div>

                ) : (

                    <div className="assignments-list">

                        {assignments.map((assignment) => (

                            <div
                                className="assignment-item"
                                key={assignment.id}
                            >


                                <div className="assignment-item-icon">
                                    📝
                                </div>


                                <div className="assignment-item-info">

                                    <h3>
                                        {assignment.title}
                                    </h3>

                                    <p className="assignment-course">

                                        <strong>
                                            Course:
                                        </strong>{" "}

                                        {assignment.course_title}

                                    </p>


                                    {assignment.description && (

                                        <p className="assignment-description">

                                            {assignment.description}

                                        </p>

                                    )}


                                    <div className="assignment-meta">

                                        <span>
                                            📅 Due:{" "}
                                            {formatDate(
                                                assignment.due_date
                                            )}
                                        </span>


                                        {assignment.pdf_file && (

                                            <a
                                                href={`http://localhost:5000/uploads/${assignment.pdf_file}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="assignment-pdf-link"
                                            >
                                                📄 View PDF
                                            </a>

                                        )}

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

export default Assignments;