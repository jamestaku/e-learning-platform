import API_URL from "../../api";
import { useEffect, useState } from "react";

function Students() {

    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    // ================================
    // LOAD STUDENTS
    // ================================

    const fetchStudents = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/users/students`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load students"
                );
            }

            setStudents(data.students || []);

        } catch (error) {

            console.error(
                "Load students error:",
                error
            );

            setError(error.message);

        } finally {

            setLoading(false);
        }
    };


    // ================================
    // LOAD ON PAGE OPEN
    // ================================

    useEffect(() => {
        fetchStudents();
    }, []);


    // ================================
    // ACTIVATE / DEACTIVATE STUDENT
    // ================================

    const changeStatus = async (
        studentId,
        currentStatus
    ) => {

        const newStatus =
            currentStatus === "active"
                ? "inactive"
                : "active";

        try {

            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/api/users/students/${studentId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            "Bearer " + token
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update student status"
                );
            }

            setSuccess(data.message);

            // Update the student immediately
            setStudents(prev =>
                prev.map(student =>
                    student.id === studentId
                        ? {
                            ...student,
                            status: newStatus
                        }
                        : student
                )
            );

        } catch (error) {

            console.error(
                "Change student status error:",
                error
            );

            setError(error.message);
        }
    };


    // ================================
    // DELETE STUDENT
    // ================================

    const deleteStudent = async (
        studentId,
        studentName
    ) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete ${studentName}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/api/users/students/${studentId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete student"
                );
            }

            // Remove student from the current list
            setStudents(prev =>
                prev.filter(
                    student =>
                        student.id !== studentId
                )
            );

            setSuccess(data.message);

        } catch (error) {

            console.error(
                "Delete student error:",
                error
            );

            setError(error.message);
        }
    };


    // ================================
    // SEARCH STUDENTS
    // ================================

    const filteredStudents =
        students.filter(student => {

            const searchText =
                search.toLowerCase().trim();

            return (
                student.full_name
                    .toLowerCase()
                    .includes(searchText) ||

                student.email
                    .toLowerCase()
                    .includes(searchText)
            );
        });


    return (

        <div className="page-container">

            {/* ================================
                PAGE HEADER
            ================================= */}

            <div className="page-header">

                <div>

                    <h1>
                        Students
                    </h1>

                    <p>
                        Manage student accounts
                        and their access to the
                        platform.
                    </p>

                </div>

            </div>


            {/* ================================
                SUCCESS MESSAGE
            ================================= */}

            {success && (

                <div className="student-success">

                    {success}

                </div>

            )}


            {/* ================================
                ERROR MESSAGE
            ================================= */}

            {error && (

                <div className="student-error">

                    {error}

                </div>

            )}


            {/* ================================
                STUDENT MANAGEMENT CARD
            ================================= */}

            <div className="students-management-card">


                {/* ================================
                    TOOLBAR
                ================================= */}

                <div className="students-toolbar">

                    <div>

                        <h2>
                            All Students
                        </h2>

                        <p>

                            {students.length} student
                            {students.length !== 1
                                ? "s"
                                : ""}

                        </p>

                    </div>


                    {/* SEARCH */}

                    <div className="student-search">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {/* ================================
                    LOADING
                ================================= */}

                {loading && (

                    <div className="students-loading">

                        Loading students...

                    </div>

                )}


                {/* ================================
                    EMPTY RESULT
                ================================= */}

                {!loading &&
                    filteredStudents.length === 0 && (

                        <div className="students-empty">

                            <div className="students-empty-icon">
                                👥
                            </div>

                            <h3>
                                No students found
                            </h3>

                            <p>
                                {search
                                    ? "No students match your search."
                                    : "There are currently no students registered."}
                            </p>

                        </div>

                    )}


                {/* ================================
                    STUDENT TABLE
                ================================= */}

                {!loading &&
                    filteredStudents.length > 0 && (

                        <div className="students-table-wrapper">

                            <table className="students-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Student
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Joined
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredStudents.map(
                                        student => (

                                            <tr
                                                key={
                                                    student.id
                                                }
                                            >

                                                {/* STUDENT */}

                                                <td>

                                                    <div className="student-table-name">

                                                        <div className="student-table-avatar">

                                                            {student.full_name
                                                                .charAt(0)
                                                                .toUpperCase()}

                                                        </div>


                                                        <div>

                                                            <strong>
                                                                {
                                                                    student.full_name
                                                                }
                                                            </strong>

                                                            <span>
                                                                Student
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* EMAIL */}

                                                <td>

                                                    {student.email}

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={
                                                            student.status ===
                                                            "active"
                                                                ? "student-status active"
                                                                : "student-status inactive"
                                                        }
                                                    >

                                                        <span>
                                                            ●
                                                        </span>

                                                        {student.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            student.status.slice(1)}

                                                    </span>

                                                </td>


                                                {/* JOINED */}

                                                <td>

                                                    {new Date(
                                                        student.created_at
                                                    ).toLocaleDateString()}

                                                </td>


                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="student-actions">

                                                        {/* ACTIVATE / DEACTIVATE */}

                                                        <button
                                                            className={
                                                                student.status ===
                                                                "active"
                                                                    ? "student-action deactivate"
                                                                    : "student-action activate"
                                                            }
                                                            onClick={() =>
                                                                changeStatus(
                                                                    student.id,
                                                                    student.status
                                                                )
                                                            }
                                                        >

                                                            {student.status ===
                                                            "active"
                                                                ? "Deactivate"
                                                                : "Activate"}

                                                        </button>


                                                        {/* DELETE */}

                                                        <button
                                                            className="student-action delete"
                                                            onClick={() =>
                                                                deleteStudent(
                                                                    student.id,
                                                                    student.full_name
                                                                )
                                                            }
                                                        >

                                                            Delete

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

            </div>

        </div>
    );
}

export default Students;

