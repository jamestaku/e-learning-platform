import API_URL from "../../api";
import { useEffect, useState } from "react";

function Assignments() {


const [courses, setCourses] = useState([]);
const [assignments, setAssignments] = useState([]);
const [submissions, setSubmissions] = useState([]);

const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");

const [selectedFiles, setSelectedFiles] = useState({});
const [submitting, setSubmitting] = useState({});

const token = localStorage.getItem("token");


// ==========================================
// LOAD ENROLLED COURSES
// ==========================================

const fetchCourses = async () => {

    try {

        const response = await fetch(
            `${API_URL}/api/enrollments/my`,
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
                "Unable to load your courses"
            );

            return [];

        }

        return data.courses || [];

    } catch (error) {

        console.error(error);

        setMessage(
            "Unable to connect to the server"
        );

        return [];

    }

};


// ==========================================
// LOAD ASSIGNMENTS
// ==========================================

const fetchAssignments = async (enrolledCourses) => {

    try {

        let allAssignments = [];


        for (const course of enrolledCourses) {

            const response = await fetch(
                `http://localhost:5000/api/assignments/course/${course.course_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (response.ok) {

                const courseAssignments =
                    (data.assignments || []).map(
                        (assignment) => ({
                            ...assignment,
                            course_title: course.title,
                            teacher_name: course.teacher_name
                        })
                    );


                allAssignments = [
                    ...allAssignments,
                    ...courseAssignments
                ];

            }

        }


        // Sort by due date
        allAssignments.sort((a, b) => {

            if (!a.due_date) {
                return 1;
            }

            if (!b.due_date) {
                return -1;
            }

            return new Date(a.due_date) -
                new Date(b.due_date);

        });


        setAssignments(
            allAssignments
        );


    } catch (error) {

        console.error(error);

        setMessage(
            "Unable to load assignments"
        );

    }

};


// ==========================================
// LOAD STUDENT SUBMISSIONS
// ==========================================

const fetchSubmissions = async () => {

    try {

        const response = await fetch(
            `${API_URL}/api/submissions/my`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (response.ok) {

            setSubmissions(
                data.submissions || []
            );

        }

    } catch (error) {

        console.error(
            "Load submissions error:",
            error
        );

    }

};


// ==========================================
// INITIAL LOAD
// ==========================================

useEffect(() => {

    const loadData = async () => {

        const enrolledCourses =
            await fetchCourses();


        setCourses(
            enrolledCourses
        );


        if (enrolledCourses.length > 0) {

            await fetchAssignments(
                enrolledCourses
            );

        }


        await fetchSubmissions();


        setLoading(false);

    };


    loadData();

}, []);


// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date) => {

    if (!date) {

        return "No due date";

    }


    return new Date(
        date
    ).toLocaleString();

};


// ==========================================
// CHECK DEADLINE
// ==========================================

const isOverdue = (date) => {

    if (!date) {
        return false;
    }

    return new Date(date) < new Date();

};


// ==========================================
// CHECK IF SUBMITTED
// ==========================================

const getSubmission = (assignmentId) => {

    return submissions.find(
        (submission) =>
            Number(submission.assignment_id) ===
            Number(assignmentId)
    );

};


// ==========================================
// SELECT FILE
// ==========================================

const handleFileChange = (
    assignmentId,
    file
) => {

    if (!file) {
        return;
    }


    if (file.type !== "application/pdf") {

        setMessage(
            "Only PDF files are allowed."
        );

        return;

    }


    if (file.size > 10 * 1024 * 1024) {

        setMessage(
            "The PDF file must be 10 MB or smaller."
        );

        return;

    }


    setSelectedFiles(
        (previous) => ({
            ...previous,
            [assignmentId]: file
        })
    );


    setMessage("");

};


// ==========================================
// SUBMIT ASSIGNMENT
// ==========================================

const handleSubmit = async (
    assignmentId
) => {

    const file =
        selectedFiles[assignmentId];


    if (!file) {

        setMessage(
            "Please select a PDF file first."
        );

        return;

    }


    setSubmitting(
        (previous) => ({
            ...previous,
            [assignmentId]: true
        })
    );


    setMessage("");


    try {

        const formData =
            new FormData();

        formData.append(
            "assignment_id",
            assignmentId
        );

        formData.append(
            "submission",
            file
        );


        const response = await fetch(
            "http://localhost:5000/api/submissions",
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body: formData
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            setMessage(
                data.message ||
                "Unable to submit assignment"
            );

            return;

        }


        setMessage(
            "Assignment submitted successfully."
        );


        // Remove selected file
        setSelectedFiles(
            (previous) => {

                const updated = {
                    ...previous
                };

                delete updated[assignmentId];

                return updated;

            }
        );


        // Refresh submissions
        await fetchSubmissions();


    } catch (error) {

        console.error(
            "Submit assignment error:",
            error
        );

        setMessage(
            "Unable to connect to the server."
        );

    } finally {

        setSubmitting(
            (previous) => ({
                ...previous,
                [assignmentId]: false
            })
        );

    }

};


return (

    <div className="student-assignments-page">


        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div className="student-assignments-header">

            <div>

                <h1>
                    Assignments
                </h1>

                <p>
                    View and complete assignments
                    from your courses.
                </p>

            </div>


            <div className="student-assignment-count">

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

            <div className="student-assignment-message">

                {message}

            </div>

        )}


        {/* ==================================
            ASSIGNMENTS
        ================================== */}

        {loading ? (

            <div className="student-assignments-empty">

                <p>
                    Loading assignments...
                </p>

            </div>

        ) : courses.length === 0 ? (

            <div className="student-assignments-empty">

                <div className="student-assignment-empty-icon">
                    📚
                </div>

                <h3>
                    No enrolled courses
                </h3>

                <p>
                    Enrol in a course to see its assignments.
                </p>

            </div>

        ) : assignments.length === 0 ? (

            <div className="student-assignments-empty">

                <div className="student-assignment-empty-icon">
                    📝
                </div>

                <h3>
                    No assignments yet
                </h3>

                <p>
                    Your teachers have not posted any
                    assignments yet.
                </p>

            </div>

        ) : (

            <div className="student-assignment-list">

                {assignments.map(
                    (assignment) => {

                        const overdue =
                            isOverdue(
                                assignment.due_date
                            );


                        const submission =
                            getSubmission(
                                assignment.id
                            );


                        const selectedFile =
                            selectedFiles[
                                assignment.id
                            ];


                        return (

                            <div
                                className="student-assignment-card"
                                key={assignment.id}
                            >


                                {/* Top */}

                                <div className="student-assignment-top">

                                    <div className="student-assignment-icon">
                                        📝
                                    </div>


                                    <div className="student-assignment-status">

                                        {submission ? (

                                            <span className="assignment-active">
                                                Submitted
                                            </span>

                                        ) : overdue ? (

                                            <span className="assignment-overdue">
                                                Overdue
                                            </span>

                                        ) : (

                                            <span className="assignment-active">
                                                Active
                                            </span>

                                        )}

                                    </div>

                                </div>


                                {/* Body */}

                                <div className="student-assignment-body">

                                    <h2>
                                        {assignment.title}
                                    </h2>


                                    <p className="student-assignment-course">

                                        <strong>
                                            Course:
                                        </strong>{" "}

                                        {assignment.course_title}

                                    </p>


                                    {assignment.teacher_name && (

                                        <p className="student-assignment-teacher">

                                            <strong>
                                                Teacher:
                                            </strong>{" "}

                                            {assignment.teacher_name}

                                        </p>

                                    )}


                                    {assignment.description && (

                                        <div className="student-assignment-description">

                                            <strong>
                                                Instructions
                                            </strong>

                                            <p>
                                                {assignment.description}
                                            </p>

                                        </div>

                                    )}

                                </div>


                                {/* Footer */}

                                <div className="student-assignment-footer">


                                    <div className="student-assignment-due">

                                        <span>
                                            📅 Due
                                        </span>

                                        <strong
                                            className={
                                                overdue
                                                    ? "due-overdue"
                                                    : ""
                                            }
                                        >
                                            {formatDate(
                                                assignment.due_date
                                            )}
                                        </strong>

                                    </div>


                                    {assignment.pdf_file && (

                                        <a
                                            href={`http://localhost:5000/uploads/${assignment.pdf_file}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="student-assignment-pdf"
                                        >
                                            📄 Open PDF
                                        </a>

                                    )}

                                </div>


                                {/* ==================================
                                    SUBMISSION
                                ================================== */}

                                <div className="student-assignment-submission">

                                    {submission ? (

                                        <div className="submission-success">

                                            <strong>
                                                ✅ Assignment Submitted
                                            </strong>

                                            <span>
                                                Submitted on{" "}
                                                {formatDate(
                                                    submission.submitted_at
                                                )}
                                            </span>

                                        </div>

                                    ) : (

                                        <>

                                            <div className="submission-file-row">

                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={(event) =>
                                                        handleFileChange(
                                                            assignment.id,
                                                            event.target.files[0]
                                                        )
                                                    }
                                                />

                                            </div>


                                            {selectedFile && (

                                                <div className="selected-file-name">

                                                    📄{" "}
                                                    {selectedFile.name}

                                                </div>

                                            )}


                                            <button
                                                type="button"
                                                className="submit-assignment-btn"
                                                onClick={() =>
                                                    handleSubmit(
                                                        assignment.id
                                                    )
                                                }
                                                disabled={
                                                    submitting[
                                                        assignment.id
                                                    ]
                                                }
                                            >

                                                {submitting[
                                                    assignment.id
                                                ]
                                                    ? "Submitting..."
                                                    : "Submit Assignment"}

                                            </button>

                                        </>

                                    )}

                                </div>


                            </div>

                        );

                    }
                )}

            </div>

        )}


    </div>

);


}

export default Assignments;
