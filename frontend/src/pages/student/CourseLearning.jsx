
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function CourseLearning() {

    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);

    const [completedLessons, setCompletedLessons] = useState([]);

    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");


    // ==========================================
    // LOAD COURSE
    // ==========================================

    useEffect(() => {

        const fetchCourse = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/lessons/student/course/${courseId}`,
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
                        "Unable to load course"
                    );

                    return;
                }

                setCourse(data.course);
                setLessons(data.lessons);

                if (data.lessons.length > 0) {

                    setSelectedLesson(
                        data.lessons[0]
                    );

                }

            } catch (error) {

                console.error(error);

                setMessage(
                    "Unable to connect to the server"
                );

            } finally {

                setLoading(false);

            }

        };

        fetchCourse();

    }, [courseId, token]);


    // ==========================================
    // LOAD COURSE MATERIALS
    // ==========================================

    useEffect(() => {

        const fetchMaterials = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/materials/course/${courseId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    console.error(
                        data.message ||
                        "Unable to load course materials"
                    );

                    return;
                }

                setMaterials(
                    data.materials || []
                );

            } catch (error) {

                console.error(
                    "Materials error:",
                    error
                );

            }

        };

        fetchMaterials();

    }, [courseId, token]);


    // ==========================================
    // LOAD COMPLETED LESSONS
    // ==========================================

    useEffect(() => {

        const fetchProgress = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/progress/course/${courseId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {

                    setCompletedLessons(
                        data.completedLessons || []
                    );

                }

            } catch (error) {

                console.error(
                    "Progress error:",
                    error
                );

            }

        };

        fetchProgress();

    }, [courseId, token]);


    // ==========================================
    // MARK LESSON AS COMPLETED
    // ==========================================

    const handleCompleteLesson = async () => {

        if (!selectedLesson) {
            return;
        }

        setCompleting(true);
        setMessage("");

        try {

            const response = await fetch(
                "http://localhost:5000/api/progress/complete",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        lesson_id: selectedLesson.id
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to mark lesson as completed"
                );

                return;
            }

            setCompletedLessons((previous) => {

                if (
                    previous.includes(
                        selectedLesson.id
                    )
                ) {

                    return previous;

                }

                return [
                    ...previous,
                    selectedLesson.id
                ];

            });

            setMessage(
                "Lesson marked as completed!"
            );

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server"
            );

        } finally {

            setCompleting(false);

        }

    };


    // ==========================================
    // GO TO LESSON
    // ==========================================

    const goToLesson = (lesson) => {

        setSelectedLesson(lesson);

        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    // ==========================================
    // PREVIOUS LESSON
    // ==========================================

    const goToPreviousLesson = () => {

        if (!selectedLesson) {
            return;
        }

        const currentIndex =
            lessons.findIndex(
                (lesson) =>
                    lesson.id === selectedLesson.id
            );

        if (currentIndex > 0) {

            goToLesson(
                lessons[currentIndex - 1]
            );

        }

    };


    // ==========================================
    // NEXT LESSON
    // ==========================================

    const goToNextLesson = () => {

        if (!selectedLesson) {
            return;
        }

        const currentIndex =
            lessons.findIndex(
                (lesson) =>
                    lesson.id === selectedLesson.id
            );

        if (
            currentIndex !== -1 &&
            currentIndex < lessons.length - 1
        ) {

            goToLesson(
                lessons[currentIndex + 1]
            );

        }

    };


    // ==========================================
    // GET CURRENT LESSON INDEX
    // ==========================================

    const currentLessonIndex =
        selectedLesson
            ? lessons.findIndex(
                (lesson) =>
                    lesson.id === selectedLesson.id
            )
            : -1;


    const isFirstLesson =
        currentLessonIndex <= 0;


    const isLastLesson =
        currentLessonIndex === lessons.length - 1;


    // ==========================================
    // GET FILE ICON
    // ==========================================

    const getFileIcon = (fileName) => {

        if (!fileName) {
            return "📄";
        }

        const extension = fileName
            .split(".")
            .pop()
            .toLowerCase();

        switch (extension) {

            case "pdf":
                return "📕";

            case "doc":
            case "docx":
                return "📘";

            case "ppt":
            case "pptx":
                return "📙";

            default:
                return "📄";
        }

    };


    // ==========================================
    // GET FILE TYPE
    // ==========================================

    const getFileType = (fileName) => {

        if (!fileName) {
            return "FILE";
        }

        const extension = fileName
            .split(".")
            .pop()
            .toUpperCase();

        return extension;

    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="course-learning-page">

                <div className="lesson-content-area">

                    <div className="empty-lesson-content">

                        <h2>
                            Loading course...
                        </h2>

                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (message && !course) {

        return (

            <div className="course-learning-page">

                <div className="lesson-content-area">

                    <div className="empty-lesson-content">

                        <h2>
                            Unable to open course
                        </h2>

                        <p>
                            {message}
                        </p>

                        <button
                            className="create-course-btn"
                            onClick={() =>
                                navigate(
                                    "/student/courses"
                                )
                            }
                        >
                            Back to Courses
                        </button>

                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // COURSE PROGRESS
    // ==========================================

    const completedCount =
        completedLessons.length;

    const totalLessons =
        lessons.length;

    const remainingLessons =
        Math.max(
            totalLessons - completedCount,
            0
        );

    const progressPercentage =
        totalLessons > 0
            ? Math.min(
                Math.round(
                    (completedCount / totalLessons) * 100
                ),
                100
            )
            : 0;

    const courseCompleted =
        totalLessons > 0 &&
        completedCount >= totalLessons;


    // ==========================================
    // MATERIALS
    // ==========================================

    const selectedLessonMaterials =
        selectedLesson
            ? materials.filter(
                (material) =>
                    Number(material.lesson_id) ===
                    Number(selectedLesson.id)
            )
            : [];


    const generalMaterials =
        materials.filter(
            (material) =>
                !material.lesson_id
        );


    return (

        <div className="course-learning-page">


            {/* ==========================================
                COURSE HEADER
            ========================================== */}

            <div className="learning-header">

                <button
                    className="back-course-btn"
                    onClick={() =>
                        navigate(
                            "/student/courses"
                        )
                    }
                >
                    ← Back to Courses
                </button>


                <h1>
                    {course.title}
                </h1>


                <p>
                    Instructor: {course.teacher_name}
                </p>


                {course.description && (

                    <p className="course-description">
                        {course.description}
                    </p>

                )}


                {/* ==========================================
                    COURSE PROGRESS SUMMARY
                ========================================== */}

                <div
                    className="course-progress"
                    style={{
                        marginTop: "25px",
                        padding: "20px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb"
                    }}
                >

                    <div
                        className="progress-header"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px"
                        }}
                    >

                        <strong>
                            Course Progress
                        </strong>

                        <strong>
                            {progressPercentage}%
                        </strong>

                    </div>


                    {/* Progress Bar */}

                    <div
                        className="progress-bar"
                        style={{
                            width: "100%",
                            height: "12px",
                            background: "#e5e7eb",
                            borderRadius: "10px",
                            overflow: "hidden"
                        }}
                    >

                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${progressPercentage}%`,
                                height: "100%",
                                background: "#0d6efd",
                                borderRadius: "10px",
                                transition:
                                    "width 0.4s ease"
                            }}
                        ></div>

                    </div>


                    {/* Progress Statistics */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, 1fr)",
                            gap: "12px",
                            marginTop: "18px"
                        }}
                    >

                        <div
                            style={{
                                padding: "14px",
                                borderRadius: "8px",
                                background: "#f8f9fa",
                                textAlign: "center"
                            }}
                        >

                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "22px"
                                }}
                            >
                                {totalLessons}
                            </strong>

                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "#666"
                                }}
                            >
                                Total Lessons
                            </span>

                        </div>


                        <div
                            style={{
                                padding: "14px",
                                borderRadius: "8px",
                                background: "#f8f9fa",
                                textAlign: "center"
                            }}
                        >

                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "22px"
                                }}
                            >
                                {completedCount}
                            </strong>

                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "#666"
                                }}
                            >
                                Completed
                            </span>

                        </div>


                        <div
                            style={{
                                padding: "14px",
                                borderRadius: "8px",
                                background: "#f8f9fa",
                                textAlign: "center"
                            }}
                        >

                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "22px"
                                }}
                            >
                                {remainingLessons}
                            </strong>

                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "#666"
                                }}
                            >
                                Remaining
                            </span>

                        </div>

                    </div>


                    {/* Course Completed */}

                    {courseCompleted && (

                        <div
                            style={{
                                marginTop: "18px",
                                padding: "15px",
                                borderRadius: "8px",
                                background: "#e8f5e9",
                                border: "1px solid #c8e6c9",
                                textAlign: "center",
                                color: "#2e7d32",
                                fontWeight: "600"
                            }}
                        >
                            🎉 Course Completed!
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: "normal",
                                    marginTop: "5px"
                                }}
                            >
                                Congratulations! You have
                                completed all the lessons
                                in this course.
                            </div>
                        </div>

                    )}

                </div>

            </div>


            {/* ==========================================
                MESSAGE
            ========================================== */}

            {message && (

                <div className="course-message">
                    {message}
                </div>

            )}


            {/* ==========================================
                GENERAL COURSE MATERIALS
            ========================================== */}

            {generalMaterials.length > 0 && (

                <div
                    className="course-materials-section"
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <div
                        className="course-materials-header"
                        style={{
                            marginBottom: "15px"
                        }}
                    >

                        <h2>
                            📚 Course Materials
                        </h2>

                        <p>
                            General learning materials
                            for this course.
                        </p>

                    </div>


                    <div
                        style={{
                            display: "grid",
                            gap: "12px"
                        }}
                    >

                        {generalMaterials.map(
                            (material) => (

                                <div
                                    key={material.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "15px",
                                        padding: "16px",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        background: "#ffffff"
                                    }}
                                >

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            minWidth: 0
                                        }}
                                    >

                                        <span
                                            style={{
                                                fontSize: "30px"
                                            }}
                                        >
                                            {getFileIcon(
                                                material.original_name
                                            )}
                                        </span>


                                        <div
                                            style={{
                                                minWidth: 0
                                            }}
                                        >

                                            <h3
                                                style={{
                                                    margin: 0,
                                                    wordBreak:
                                                        "break-word"
                                                }}
                                            >
                                                {material.title}
                                            </h3>

                                            <p
                                                style={{
                                                    margin:
                                                        "5px 0 0",
                                                    fontSize:
                                                        "13px"
                                                }}
                                            >
                                                {material.original_name}
                                                {" • "}
                                                {getFileType(
                                                    material.original_name
                                                )}
                                            </p>

                                        </div>

                                    </div>


                                    <a
                                        href={`http://localhost:5000/uploads/${material.file_name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="create-course-btn"
                                        style={{
                                            textDecoration:
                                                "none",
                                            whiteSpace:
                                                "nowrap"
                                        }}
                                    >
                                        ⬇ Download
                                    </a>

                                </div>

                            )
                        )}

                    </div>

                </div>

            )}


            {/* ==========================================
                LEARNING LAYOUT
            ========================================== */}

            <div className="learning-layout">


                {/* ==========================================
                    LESSONS SIDEBAR
                ========================================== */}

                <div className="lessons-sidebar">

                    <div className="lessons-sidebar-header">

                        <h2>
                            Course Lessons
                        </h2>

                        <span>
                            {totalLessons} Lessons
                        </span>

                    </div>


                    {lessons.length === 0 ? (

                        <p className="no-lessons">
                            No lessons available yet.
                        </p>

                    ) : (

                        <div className="student-lesson-list">

                            {lessons.map(
                                (lesson, index) => {

                                    const completed =
                                        completedLessons.includes(
                                            lesson.id
                                        );

                                    return (

                                        <button
                                            key={lesson.id}
                                            className={`student-lesson-item ${
                                                selectedLesson?.id === lesson.id
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                goToLesson(
                                                    lesson
                                                )
                                            }
                                        >

                                            <span
                                                className={`student-lesson-number ${
                                                    completed
                                                        ? "completed"
                                                        : ""
                                                }`}
                                            >
                                                {completed
                                                    ? "✓"
                                                    : index + 1}
                                            </span>


                                            <span className="student-lesson-title">

                                                {lesson.title}

                                            </span>


                                            {completed && (

                                                <span className="lesson-completed-label">
                                                    Completed
                                                </span>

                                            )}

                                        </button>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* ==========================================
                    LESSON CONTENT
                ========================================== */}

                <div className="lesson-content-area">

                    {selectedLesson ? (

                        <>

                            <div className="lesson-content-header">

                                <span>
                                    Lesson{" "}
                                    {selectedLesson.lesson_order}
                                </span>


                                <h2>
                                    {selectedLesson.title}
                                </h2>

                            </div>


                            <div className="lesson-content">

                                <p>
                                    {selectedLesson.content}
                                </p>


                                {/* =================================
                                    LESSON MATERIALS
                                ================================= */}

                                {selectedLessonMaterials.length > 0 && (

                                    <div
                                        className="lesson-materials"
                                        style={{
                                            marginTop: "30px"
                                        }}
                                    >

                                        <h3>
                                            📎 Learning Materials
                                        </h3>

                                        <p>
                                            Materials provided
                                            for this lesson.
                                        </p>


                                        <div
                                            style={{
                                                display: "grid",
                                                gap: "12px",
                                                marginTop:
                                                    "15px"
                                            }}
                                        >

                                            {selectedLessonMaterials.map(
                                                (material) => (

                                                    <div
                                                        key={
                                                            material.id
                                                        }
                                                        style={{
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: "15px",
                                                            padding:
                                                                "16px",
                                                            border:
                                                                "1px solid #e5e7eb",
                                                            borderRadius:
                                                                "10px",
                                                            background:
                                                                "#ffffff"
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap:
                                                                    "12px",
                                                                minWidth:
                                                                    0
                                                            }}
                                                        >

                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "28px"
                                                                }}
                                                            >
                                                                {getFileIcon(
                                                                    material.original_name
                                                                )}
                                                            </span>


                                                            <div
                                                                style={{
                                                                    minWidth:
                                                                        0
                                                                }}
                                                            >

                                                                <strong>
                                                                    {
                                                                        material.title
                                                                    }
                                                                </strong>


                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "4px 0 0",
                                                                        fontSize:
                                                                            "13px"
                                                                    }}
                                                                >
                                                                    {
                                                                        material.original_name
                                                                    }
                                                                    {" • "}
                                                                    {
                                                                        getFileType(
                                                                            material.original_name
                                                                        )
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>


                                                        <a
                                                            href={`http://localhost:5000/uploads/${material.file_name}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="create-course-btn"
                                                            style={{
                                                                textDecoration:
                                                                    "none",
                                                                whiteSpace:
                                                                    "nowrap"
                                                            }}
                                                        >
                                                            ⬇ Download
                                                        </a>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                )}


                                {/* =================================
                                    NO MATERIALS
                                ================================= */}

                                {selectedLessonMaterials.length === 0 && (

                                    <div
                                        style={{
                                            marginTop:
                                                "25px",
                                            padding:
                                                "15px",
                                            borderRadius:
                                                "8px",
                                            background:
                                                "#f8f9fa",
                                            color:
                                                "#666"
                                        }}
                                    >
                                        📎 No materials have been
                                        attached to this lesson.
                                    </div>

                                )}


                                {/* =================================
                                    COMPLETION
                                ================================= */}

                                <div
                                    className="lesson-completion"
                                    style={{
                                        marginTop:
                                            "30px"
                                    }}
                                >

                                    {completedLessons.includes(
                                        selectedLesson.id
                                    ) ? (

                                        <div className="lesson-completed-message">

                                            ✓ Lesson Completed

                                        </div>

                                    ) : (

                                        <button
                                            className="complete-lesson-btn"
                                            onClick={
                                                handleCompleteLesson
                                            }
                                            disabled={
                                                completing
                                            }
                                        >

                                            {completing
                                                ? "Saving..."
                                                : "✓ Mark as Completed"}

                                        </button>

                                    )}

                                </div>


                                {/* =================================
                                    PREVIOUS / NEXT NAVIGATION
                                ================================= */}

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems:
                                            "center",
                                        gap:
                                            "15px",
                                        marginTop:
                                            "30px",
                                        paddingTop:
                                            "20px",
                                        borderTop:
                                            "1px solid #e5e7eb"
                                    }}
                                >

                                    <button
                                        type="button"
                                        onClick={
                                            goToPreviousLesson
                                        }
                                        disabled={
                                            isFirstLesson
                                        }
                                        style={{
                                            padding:
                                                "10px 18px",
                                            border:
                                                "1px solid #ddd",
                                            borderRadius:
                                                "8px",
                                            background:
                                                isFirstLesson
                                                    ? "#f1f1f1"
                                                    : "#ffffff",
                                            color:
                                                isFirstLesson
                                                    ? "#999"
                                                    : "#333",
                                            cursor:
                                                isFirstLesson
                                                    ? "not-allowed"
                                                    : "pointer"
                                        }}
                                    >
                                        ← Previous Lesson
                                    </button>


                                    <span
                                        style={{
                                            fontSize:
                                                "14px",
                                            color:
                                                "#666"
                                        }}
                                    >
                                        Lesson{" "}
                                        {currentLessonIndex + 1}
                                        {" "}
                                        of{" "}
                                        {totalLessons}
                                    </span>


                                    <button
                                        type="button"
                                        onClick={
                                            goToNextLesson
                                        }
                                        disabled={
                                            isLastLesson
                                        }
                                        style={{
                                            padding:
                                                "10px 18px",
                                            border:
                                                "none",
                                            borderRadius:
                                                "8px",
                                            background:
                                                isLastLesson
                                                    ? "#e9ecef"
                                                    : "#0d6efd",
                                            color:
                                                isLastLesson
                                                    ? "#999"
                                                    : "#ffffff",
                                            cursor:
                                                isLastLesson
                                                    ? "not-allowed"
                                                    : "pointer"
                                        }}
                                    >
                                        Next Lesson →
                                    </button>

                                </div>

                            </div>

                        </>

                    ) : (

                        <div className="empty-lesson-content">

                            <h2>
                                Select a lesson
                            </h2>

                            <p>
                                Choose a lesson from the list
                                to start learning.
                            </p>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}

export default CourseLearning;
