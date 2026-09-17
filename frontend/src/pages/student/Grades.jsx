import API_URL from "../../api";
import { useEffect, useState } from "react";

function Grades() {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const fetchGrades = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/submissions/grades`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + localStorage.getItem("token"),
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setGrades(data.grades);
            } else {
                setMessage(
                    data.message || "Failed to load grades"
                );
            }
        } catch (error) {
            console.error(error);
            setMessage("Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    // Only graded assignments
    const gradedAssignments = grades.filter(
        (grade) => grade.marks !== null
    );

    // Calculate average
    const average =
        gradedAssignments.length > 0
            ? (
                  gradedAssignments.reduce(
                      (total, grade) =>
                          total + Number(grade.marks),
                      0
                  ) / gradedAssignments.length
              ).toFixed(2)
            : "0.00";

    if (loading) {
        return (
            <div className="page-container">
                <h2>My Grades</h2>
                <p>Loading grades...</p>
            </div>
        );
    }

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h2>My Grades</h2>
                    <p>
                        View your assignment marks and teacher
                        feedback.
                    </p>
                </div>
            </div>

            {message && (
                <div className="submission-message">
                    {message}
                </div>
            )}

            {/* Grade Summary */}
            <div className="grades-summary">

                <div className="grade-summary-card">
                    <span className="grade-summary-label">
                        Overall Average
                    </span>

                    <strong>
                        {average}%
                    </strong>

                    <span className="grade-summary-description">
                        Based on graded assignments
                    </span>
                </div>

                <div className="grade-summary-card">
                    <span className="grade-summary-label">
                        Graded Assignments
                    </span>

                    <strong>
                        {gradedAssignments.length}
                    </strong>

                    <span className="grade-summary-description">
                        Assignments marked
                    </span>
                </div>

                <div className="grade-summary-card">
                    <span className="grade-summary-label">
                        Total Submissions
                    </span>

                    <strong>
                        {grades.length}
                    </strong>

                    <span className="grade-summary-description">
                        Submitted assignments
                    </span>
                </div>

            </div>

            {/* Grades */}
            {grades.length === 0 ? (
                <div className="empty-state">
                    <h3>No grades yet</h3>
                    <p>
                        Your assignment submissions and grades
                        will appear here.
                    </p>
                </div>
            ) : (
                <div className="grades-list">

                    {grades.map((grade) => (

                        <div
                            className="grade-card"
                            key={grade.id}
                        >

                            <div className="grade-card-header">

                                <div>
                                    <h3>
                                        {grade.assignment_title}
                                    </h3>

                                    <p>
                                        {grade.course_title}
                                    </p>
                                </div>

                                {grade.marks !== null ? (
                                    <div className="grade-score">
                                        <strong>
                                            {Number(
                                                grade.marks
                                            ).toFixed(0)}
                                        </strong>

                                        <span>/ 100</span>
                                    </div>
                                ) : (
                                    <div className="grade-pending">
                                        Not Graded
                                    </div>
                                )}

                            </div>

                            <div className="grade-details">

                                <div>
                                    <strong>
                                        Teacher:
                                    </strong>{" "}
                                    {grade.teacher_name}
                                </div>

                                <div>
                                    <strong>
                                        Submitted:
                                    </strong>{" "}
                                    {new Date(
                                        grade.submitted_at
                                    ).toLocaleString()}
                                </div>

                            </div>

                            {grade.marks !== null && (
                                <div className="feedback-box">

                                    <h4>
                                        Teacher Feedback
                                    </h4>

                                    {grade.feedback ? (
                                        <p>
                                            {grade.feedback}
                                        </p>
                                    ) : (
                                        <p className="no-feedback">
                                            No feedback was provided.
                                        </p>
                                    )}

                                </div>
                            )}

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
}

export default Grades;