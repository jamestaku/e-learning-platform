import API_URL from "../../api";
import { useEffect, useState } from "react";

function Submissions() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [grades, setGrades] = useState({});
    const [saving, setSaving] = useState({});

    const fetchSubmissions = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/submissions/teacher`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + localStorage.getItem("token"),
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSubmissions(data.submissions);

                // Load existing grades into the form
                const existingGrades = {};

                data.submissions.forEach((submission) => {
                    existingGrades[submission.id] = {
                        marks:
                            submission.marks !== null
                                ? submission.marks
                                : "",
                        feedback:
                            submission.feedback !== null
                                ? submission.feedback
                                : "",
                    };
                });

                setGrades(existingGrades);
            } else {
                setMessage(data.message || "Failed to load submissions");
            }
        } catch (error) {
            console.error(error);
            setMessage("Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleGradeChange = (submissionId, field, value) => {
        setGrades((previous) => ({
            ...previous,
            [submissionId]: {
                ...previous[submissionId],
                [field]: value,
            },
        }));
    };

    const handleSaveGrade = async (submissionId) => {
        const grade = grades[submissionId];

        if (!grade || grade.marks === "") {
            setMessage("Please enter marks before saving.");
            return;
        }

        if (Number(grade.marks) < 0 || Number(grade.marks) > 100) {
            setMessage("Marks must be between 0 and 100.");
            return;
        }

        setSaving((previous) => ({
            ...previous,
            [submissionId]: true,
        }));

        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/submissions/${submissionId}/grade`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            "Bearer " + localStorage.getItem("token"),
                    },
                    body: JSON.stringify({
                        marks: Number(grade.marks),
                        feedback: grade.feedback,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Failed to save grade");
                return;
            }

            setMessage("Grade saved successfully.");

            // Refresh submissions so the displayed grade is updated
            await fetchSubmissions();

        } catch (error) {
            console.error(error);
            setMessage("Unable to save grade");
        } finally {
            setSaving((previous) => ({
                ...previous,
                [submissionId]: false,
            }));
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <h2>Student Submissions</h2>
                <p>Loading submissions...</p>
            </div>
        );
    }

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h2>Student Submissions</h2>
                    <p>
                        Review student submissions and assign marks and
                        feedback.
                    </p>
                </div>
            </div>

            {message && (
                <div className="submission-message">
                    {message}
                </div>
            )}

            {submissions.length === 0 ? (
                <div className="empty-state">
                    <h3>No submissions yet</h3>
                    <p>
                        Student assignment submissions will appear here.
                    </p>
                </div>
            ) : (
                <div className="submissions-grid">

                    {submissions.map((submission) => {

                        const grade = grades[submission.id] || {
                            marks: "",
                            feedback: "",
                        };

                        return (
                            <div
                                className="submission-card"
                                key={submission.id}
                            >

                                <div className="submission-card-header">
                                    <div>
                                        <h3>
                                            {submission.assignment_title}
                                        </h3>

                                        <p className="submission-course">
                                            {submission.course_title}
                                        </p>
                                    </div>

                                    <span className="submission-id">
                                        #{submission.id}
                                    </span>
                                </div>

                                <div className="submission-student">
                                    <strong>
                                        {submission.student_name}
                                    </strong>

                                    <span>
                                        {submission.student_email}
                                    </span>
                                </div>

                                <div className="submission-date">
                                    Submitted:{" "}
                                    {new Date(
                                        submission.submitted_at
                                    ).toLocaleString()}
                                </div>

                                <div className="submission-file">
                                    <a
                                        href={
                                            submission.file_url ||
                                            `${API_URL}/uploads/${submission.submission_file}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="teacher-submission-pdf"
                                    >
                                        📄 Open Student Submission
                                    </a>
                                </div>

                                <div className="grading-section">

                                    <h4>Grade Submission</h4>

                                    <div className="grading-form">

                                        <div className="marks-field">
                                            <label>
                                                Marks
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={grade.marks}
                                                onChange={(e) =>
                                                    handleGradeChange(
                                                        submission.id,
                                                        "marks",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter marks"
                                            />

                                            <span className="marks-limit">
                                                / 100
                                            </span>
                                        </div>

                                        <div className="feedback-field">
                                            <label>
                                                Feedback
                                            </label>

                                            <textarea
                                                value={grade.feedback}
                                                onChange={(e) =>
                                                    handleGradeChange(
                                                        submission.id,
                                                        "feedback",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Write feedback for the student..."
                                                rows="4"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="save-grade-btn"
                                            onClick={() =>
                                                handleSaveGrade(
                                                    submission.id
                                                )
                                            }
                                            disabled={
                                                saving[submission.id]
                                            }
                                        >
                                            {saving[submission.id]
                                                ? "Saving..."
                                                : submission.marks !== null
                                                ? "Update Grade"
                                                : "Save Grade"}
                                        </button>

                                    </div>

                                </div>

                                {submission.marks !== null && (
                                    <div className="current-grade">
                                        <strong>
                                            Current Grade:
                                        </strong>{" "}
                                        {submission.marks}/100
                                    </div>
                                )}

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default Submissions;