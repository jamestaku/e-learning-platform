import API_URL from "../../api";
import { useEffect, useState } from "react";

function Lessons() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [lessons, setLessons] = useState([]);
    const [materials, setMaterials] = useState([]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [lessonOrder, setLessonOrder] = useState(1);

    // EDIT LESSON STATE
    const [editingLessonId, setEditingLessonId] = useState(null);

    const [materialTitle, setMaterialTitle] = useState("");
    const [selectedLesson, setSelectedLesson] = useState("");
    const [materialFile, setMaterialFile] = useState(null);

    const [message, setMessage] = useState("");
    const [materialMessage, setMaterialMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const token = localStorage.getItem("token");


    // =====================================================
    // GET TEACHER COURSES
    // =====================================================

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

            if (data.courses.length > 0) {
                setSelectedCourse(data.courses[0].id);
            }

        } catch (error) {
            console.error(error);
            setMessage("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // GET LESSONS
    // =====================================================

    const fetchLessons = async (courseId) => {
        if (!courseId) {
            setLessons([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/lessons/course/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to load lessons");
                return;
            }

            setLessons(data.lessons);

        } catch (error) {
            console.error(error);
            setMessage("Unable to load lessons.");
        }
    };


    // =====================================================
    // GET COURSE MATERIALS
    // =====================================================

    const fetchMaterials = async (courseId) => {
        if (!courseId) {
            setMaterials([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/materials/course/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMaterialMessage(
                    data.message || "Unable to load materials"
                );
                return;
            }

            setMaterials(data.materials || []);

        } catch (error) {
            console.error(error);
            setMaterialMessage(
                "Unable to load course materials."
            );
        }
    };


    // =====================================================
    // LOAD COURSES
    // =====================================================

    useEffect(() => {
        fetchCourses();
    }, []);


    // =====================================================
    // LOAD LESSONS AND MATERIALS
    // =====================================================

    useEffect(() => {
        if (selectedCourse) {
            fetchLessons(selectedCourse);
            fetchMaterials(selectedCourse);

            setSelectedLesson("");

            // Cancel editing when changing course
            cancelEdit();
        }
    }, [selectedCourse]);


    // =====================================================
    // RESET LESSON FORM
    // =====================================================

    const resetLessonForm = () => {
        setTitle("");
        setContent("");
        setLessonOrder(lessons.length + 1);
        setEditingLessonId(null);
    };


    // =====================================================
    // START EDITING LESSON
    // =====================================================

    const editLesson = (lesson) => {
        setEditingLessonId(lesson.id);

        setTitle(lesson.title || "");
        setContent(lesson.content || "");
        setLessonOrder(lesson.lesson_order || 1);

        setMessage(
            `Editing Lesson ${lesson.lesson_order}: ${lesson.title}`
        );

        // Scroll back to the lesson form
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const cancelEdit = () => {
        setTitle("");
        setContent("");
        setLessonOrder(lessons.length + 1);
        setEditingLessonId(null);
        setMessage("");
    };


    // =====================================================
    // CREATE / UPDATE LESSON
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCourse) {
            setMessage("Please select a course first.");
            return;
        }

        if (!title.trim()) {
            setMessage("Please enter a lesson title.");
            return;
        }

        // =================================================
        // UPDATE EXISTING LESSON
        // =================================================

        if (editingLessonId) {

            setMessage("Updating lesson...");

            try {
                const response = await fetch(
                    `${API_URL}/api/lessons/${editingLessonId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: title.trim(),
                            content,
                            lesson_order: Number(lessonOrder)
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setMessage(
                        data.message ||
                        "Failed to update lesson"
                    );
                    return;
                }

                setMessage(
                    "Lesson updated successfully!"
                );

                setEditingLessonId(null);
                setTitle("");
                setContent("");
                setLessonOrder(lessons.length + 1);

                await fetchLessons(selectedCourse);

            } catch (error) {
                console.error(error);

                setMessage(
                    "Unable to connect to the server."
                );
            }

            return;
        }


        // =================================================
        // CREATE NEW LESSON
        // =================================================

        setMessage("Creating lesson...");

        try {
            const response = await fetch(
                `${API_URL}/api/lessons`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        course_id: selectedCourse,
                        title: title.trim(),
                        content,
                        lesson_order: Number(lessonOrder)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message ||
                    "Failed to create lesson"
                );
                return;
            }

            setMessage(
                "Lesson created successfully!"
            );

            setTitle("");
            setContent("");
            setLessonOrder(lessons.length + 2);

            fetchLessons(selectedCourse);

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );
        }
    };


    // =====================================================
    // DELETE LESSON
    // =====================================================

    const deleteLesson = async (lesson) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${lesson.title}"?\n\n` +
            "This will remove the lesson from the course."
        );

        if (!confirmed) {
            return;
        }

        try {

            setMessage("Deleting lesson...");

            const response = await fetch(
                `${API_URL}/api/lessons/${lesson.id}`,
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
                    data.message ||
                    "Failed to delete lesson."
                );
                return;
            }

            setMessage(
                "Lesson deleted successfully."
            );

            // If the deleted lesson was being edited,
            // cancel editing.
            if (editingLessonId === lesson.id) {
                cancelEdit();
            }

            await fetchLessons(selectedCourse);

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );
        }
    };


    // =====================================================
    // UPLOAD MATERIAL
    // =====================================================

    const handleMaterialUpload = async (e) => {
        e.preventDefault();

        if (!selectedCourse) {
            setMaterialMessage(
                "Please select a course first."
            );
            return;
        }

        if (!materialTitle.trim()) {
            setMaterialMessage(
                "Please enter a material title."
            );
            return;
        }

        if (!materialFile) {
            setMaterialMessage(
                "Please select a file."
            );
            return;
        }

        setUploading(true);
        setMaterialMessage("Uploading material...");

        try {

            const formData = new FormData();

            formData.append(
                "course_id",
                selectedCourse
            );

            formData.append(
                "title",
                materialTitle
            );

            formData.append(
                "file",
                materialFile
            );

            if (selectedLesson) {
                formData.append(
                    "lesson_id",
                    selectedLesson
                );
            }

            const response = await fetch(
                `${API_URL}/api/materials`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMaterialMessage(
                    data.message ||
                    "Failed to upload material."
                );
                return;
            }

            setMaterialMessage(
                "Material uploaded successfully!"
            );

            setMaterialTitle("");
            setSelectedLesson("");
            setMaterialFile(null);

            document.getElementById(
                "material-file-input"
            ).value = "";

            fetchMaterials(selectedCourse);

        } catch (error) {

            console.error(error);

            setMaterialMessage(
                "Unable to connect to the server."
            );

        } finally {

            setUploading(false);

        }
    };


    // =====================================================
    // DELETE MATERIAL
    // =====================================================

    const deleteMaterial = async (materialId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this material?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/materials/${materialId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMaterialMessage(
                    data.message ||
                    "Failed to delete material."
                );
                return;
            }

            setMaterialMessage(
                "Material deleted successfully."
            );

            fetchMaterials(selectedCourse);

        } catch (error) {

            console.error(error);

            setMaterialMessage(
                "Unable to connect to the server."
            );
        }
    };


    // =====================================================
    // FILE ICON
    // =====================================================

    const getFileIcon = (fileName) => {

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


    return (
        <div className="lessons-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="lessons-header">

                <div>

                    <h1>
                        Lessons & Materials
                    </h1>

                    <p>
                        Create, edit lessons and upload
                        learning materials for your courses.
                    </p>

                </div>

            </div>


            {/* =================================================
                CREATE / EDIT LESSON + UPLOAD MATERIAL
            ================================================= */}

            <div className="lessons-layout">

                {/* CREATE / EDIT LESSON */}

                <div className="create-lesson-card">

                    <div className="lesson-heading">

                        <div className="lesson-icon">
                            {editingLessonId ? "✏️" : "+"}
                        </div>

                        <div>

                            <h2>
                                {editingLessonId
                                    ? "Edit Lesson"
                                    : "Add New Lesson"}
                            </h2>

                            <p>
                                {editingLessonId
                                    ? "Update the lesson information below."
                                    : "Add learning content to your course."}
                            </p>

                        </div>

                    </div>


                    <form
                        className="lesson-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-group">

                            <label>
                                Select Course
                            </label>

                            <select
                                value={selectedCourse}
                                onChange={(e) =>
                                    setSelectedCourse(
                                        e.target.value
                                    )
                                }
                                required
                                disabled={editingLessonId !== null}
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


                        <div className="form-group">

                            <label>
                                Lesson Title
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. Introduction to HTML"
                                value={title}
                                onChange={(e) =>
                                    setTitle(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Lesson Content
                            </label>

                            <textarea
                                placeholder="Write the lesson content here..."
                                value={content}
                                onChange={(e) =>
                                    setContent(
                                        e.target.value
                                    )
                                }
                                rows="8"
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Lesson Order
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={lessonOrder}
                                onChange={(e) =>
                                    setLessonOrder(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap"
                            }}
                        >

                            <button
                                type="submit"
                                className="create-lesson-btn"
                            >
                                {editingLessonId
                                    ? "Update Lesson"
                                    : "Create Lesson"}
                            </button>


                            {editingLessonId && (

                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    style={{
                                        padding: "10px 16px",
                                        border: "none",
                                        borderRadius: "6px",
                                        background: "#6c757d",
                                        color: "white",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel Edit
                                </button>

                            )}

                        </div>

                    </form>


                    {message && (

                        <div className="lesson-message">
                            {message}
                        </div>

                    )}

                </div>


                {/* UPLOAD MATERIAL */}

                <div className="create-lesson-card">

                    <div className="lesson-heading">

                        <div className="lesson-icon">
                            📎
                        </div>

                        <div>

                            <h2>
                                Upload Learning Material
                            </h2>

                            <p>
                                Upload notes for your students.
                            </p>

                        </div>

                    </div>


                    <form
                        className="lesson-form"
                        onSubmit={handleMaterialUpload}
                    >

                        <div className="form-group">

                            <label>
                                Select Course
                            </label>

                            <select
                                value={selectedCourse}
                                onChange={(e) =>
                                    setSelectedCourse(
                                        e.target.value
                                    )
                                }
                                required
                                disabled={editingLessonId !== null}
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


                        <div className="form-group">

                            <label>
                                Material Title
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. Introduction to Computers Notes"
                                value={materialTitle}
                                onChange={(e) =>
                                    setMaterialTitle(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Attach to Lesson
                            </label>

                            <select
                                value={selectedLesson}
                                onChange={(e) =>
                                    setSelectedLesson(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    General course material
                                </option>

                                {lessons.map((lesson) => (

                                    <option
                                        key={lesson.id}
                                        value={lesson.id}
                                    >
                                        Lesson {lesson.lesson_order}:{" "}
                                        {lesson.title}
                                    </option>

                                ))}

                            </select>

                        </div>


                        <div className="form-group">

                            <label>
                                File
                            </label>

                            <input
                                id="material-file-input"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) =>
                                    setMaterialFile(
                                        e.target.files[0]
                                    )
                                }
                                required
                            />

                            <small>
                                Allowed: PDF, DOC, DOCX, PPT,
                                PPTX. Maximum size: 10 MB.
                            </small>

                        </div>


                        <button
                            type="submit"
                            className="create-lesson-btn"
                            disabled={uploading}
                        >
                            {uploading
                                ? "Uploading..."
                                : "Upload Material"}
                        </button>

                    </form>


                    {materialMessage && (

                        <div className="lesson-message">
                            {materialMessage}
                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                LESSONS
            ================================================= */}

            <div className="lessons-list-card">

                <div className="lesson-list-header">

                    <div>

                        <h2>
                            Course Lessons
                        </h2>

                        <p>
                            Lessons in the selected course.
                        </p>

                    </div>

                    <div className="lesson-count">
                        {lessons.length}
                    </div>

                </div>


                {loading ? (

                    <div className="lessons-empty">

                        <p>
                            Loading courses...
                        </p>

                    </div>

                ) : !selectedCourse ? (

                    <div className="lessons-empty">

                        <div>
                            📚
                        </div>

                        <h3>
                            No course selected
                        </h3>

                        <p>
                            Create a course first.
                        </p>

                    </div>

                ) : lessons.length === 0 ? (

                    <div className="lessons-empty">

                        <div>
                            📖
                        </div>

                        <h3>
                            No lessons yet
                        </h3>

                        <p>
                            Add the first lesson using
                            the form.
                        </p>

                    </div>

                ) : (

                    <div className="lesson-list">

                        {lessons.map((lesson, index) => (

                            <div
                                className="lesson-item"
                                key={lesson.id}
                            >

                                <div className="lesson-number">

                                    {lesson.lesson_order ||
                                        index + 1}

                                </div>


                                <div className="lesson-info">

                                    <h3>
                                        {lesson.title}
                                    </h3>

                                    <p>

                                        {lesson.content
                                            ? lesson.content.substring(
                                                0,
                                                120
                                            )
                                            : "No content provided."}

                                        {lesson.content &&
                                        lesson.content.length > 120
                                            ? "..."
                                            : ""}

                                    </p>

                                </div>


                                <div className="lesson-date">

                                    {new Date(
                                        lesson.created_at
                                    ).toLocaleDateString()}

                                </div>


                                {/* LESSON ACTIONS */}

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                        flexWrap: "wrap"
                                    }}
                                >

                                    <button
                                        type="button"
                                        onClick={() =>
                                            editLesson(lesson)
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: "#0d6efd",
                                            color: "white",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteLesson(lesson)
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: "#dc3545",
                                            color: "white",
                                            cursor: "pointer"
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* =================================================
                COURSE MATERIALS
            ================================================= */}

            <div
                className="lessons-list-card"
                style={{
                    marginTop: "25px"
                }}
            >

                <div className="lesson-list-header">

                    <div>

                        <h2>
                            Learning Materials
                        </h2>

                        <p>
                            Notes and files available in
                            the selected course.
                        </p>

                    </div>

                    <div className="lesson-count">
                        {materials.length}
                    </div>

                </div>


                {materials.length === 0 ? (

                    <div className="lessons-empty">

                        <div>
                            📂
                        </div>

                        <h3>
                            No materials uploaded
                        </h3>

                        <p>
                            Upload PDF, Word or PowerPoint
                            notes above.
                        </p>

                    </div>

                ) : (

                    <div className="lesson-list">

                        {materials.map((material) => (

                            <div
                                className="lesson-item"
                                key={material.id}
                            >

                                <div className="lesson-number">

                                    {getFileIcon(
                                        material.original_name
                                    )}

                                </div>


                                <div className="lesson-info">

                                    <h3>
                                        {material.title}
                                    </h3>

                                    <p>

                                        {material.original_name}

                                        {material.lesson_title && (
                                            <>
                                                {" • Lesson: "}
                                                {material.lesson_title}
                                            </>
                                        )}

                                    </p>

                                </div>


                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center"
                                    }}
                                >

                                    <a
                                        href={`${API_URL}/uploads/${material.file_name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="create-lesson-btn"
                                        style={{
                                            textDecoration: "none",
                                            padding: "8px 12px"
                                        }}
                                    >
                                        View
                                    </a>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteMaterial(
                                                material.id
                                            )
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: "#dc3545",
                                            color: "white",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Delete
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

export default Lessons;

