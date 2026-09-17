
const express = require("express");

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// CREATE LESSON - TEACHER ONLY
// POST /api/lessons
// ==========================================

router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const {
                course_id,
                title,
                content,
                lesson_order
            } = req.body;

            if (!course_id || !title) {
                return res.status(400).json({
                    message: "Course ID and lesson title are required"
                });
            }

            // Make sure the course belongs to this teacher
            const course = await pool.query(
                `SELECT id
                 FROM courses
                 WHERE id = $1
                 AND teacher_id = $2`,
                [
                    course_id,
                    req.user.id
                ]
            );

            if (course.rows.length === 0) {
                return res.status(403).json({
                    message: "You can only add lessons to your own courses"
                });
            }

            const result = await pool.query(
                `INSERT INTO lessons
                (course_id, title, content, lesson_order)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [
                    course_id,
                    title,
                    content || null,
                    lesson_order || 1
                ]
            );

            res.status(201).json({
                message: "Lesson created successfully",
                lesson: result.rows[0]
            });

        } catch (error) {

            console.error("Create lesson error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET LESSONS FOR TEACHER'S COURSE
// GET /api/lessons/course/:courseId
// ==========================================

router.get(
    "/course/:courseId",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const { courseId } = req.params;

            // Check that the course belongs to the teacher
            const course = await pool.query(
                `SELECT id, title
                 FROM courses
                 WHERE id = $1
                 AND teacher_id = $2`,
                [
                    courseId,
                    req.user.id
                ]
            );

            if (course.rows.length === 0) {
                return res.status(403).json({
                    message: "You do not own this course"
                });
            }

            const result = await pool.query(
                `SELECT *
                 FROM lessons
                 WHERE course_id = $1
                 ORDER BY lesson_order ASC, created_at ASC`,
                [courseId]
            );

            res.json({
                course: course.rows[0],
                lessons: result.rows
            });

        } catch (error) {

            console.error("Get lessons error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET STUDENT COURSE LESSONS
// GET /api/lessons/student/course/:courseId
// ==========================================

router.get(
    "/student/course/:courseId",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { courseId } = req.params;

            // Check if student is enrolled
            const enrollment = await pool.query(
                `SELECT id
                 FROM enrollments
                 WHERE student_id = $1
                 AND course_id = $2`,
                [
                    req.user.id,
                    courseId
                ]
            );

            if (enrollment.rows.length === 0) {

                return res.status(403).json({
                    message: "You must be enrolled in this course"
                });

            }

            // Get course information
            const course = await pool.query(
                `SELECT
                    courses.id,
                    courses.title,
                    courses.description,
                    users.full_name AS teacher_name
                 FROM courses

                 INNER JOIN users
                 ON courses.teacher_id = users.id

                 WHERE courses.id = $1`,
                [courseId]
            );

            if (course.rows.length === 0) {

                return res.status(404).json({
                    message: "Course not found"
                });

            }

            // Get course lessons
            const lessons = await pool.query(
                `SELECT
                    id,
                    title,
                    content,
                    lesson_order,
                    created_at
                 FROM lessons

                 WHERE course_id = $1

                 ORDER BY lesson_order ASC, created_at ASC`,
                [courseId]
            );

            res.json({
                course: course.rows[0],
                lessons: lessons.rows
            });

        } catch (error) {

            console.error(
                "Get student course lessons error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// UPDATE LESSON - TEACHER ONLY
// PUT /api/lessons/:id
// ==========================================

router.put(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                title,
                content,
                lesson_order
            } = req.body;

            // Title is required
            if (!title || !title.trim()) {
                return res.status(400).json({
                    message: "Lesson title is required"
                });
            }

            // Find the lesson and make sure
            // it belongs to one of the teacher's courses
            const lesson = await pool.query(
                `SELECT
                    lessons.id,
                    lessons.course_id,
                    courses.teacher_id
                 FROM lessons

                 INNER JOIN courses
                 ON lessons.course_id = courses.id

                 WHERE lessons.id = $1`,
                [id]
            );

            if (lesson.rows.length === 0) {
                return res.status(404).json({
                    message: "Lesson not found"
                });
            }

            if (lesson.rows[0].teacher_id !== req.user.id) {
                return res.status(403).json({
                    message: "You can only edit lessons from your own courses"
                });
            }

            // Keep the existing lesson order if one
            // was not supplied
            const newLessonOrder =
                lesson_order !== undefined &&
                lesson_order !== null &&
                lesson_order !== ""
                    ? Number(lesson_order)
                    : null;

            if (
                newLessonOrder !== null &&
                (
                    !Number.isInteger(newLessonOrder) ||
                    newLessonOrder < 1
                )
            ) {
                return res.status(400).json({
                    message: "Lesson order must be a positive whole number"
                });
            }

            const result = await pool.query(
                `UPDATE lessons
                 SET
                    title = $1,
                    content = $2,
                    lesson_order = COALESCE($3, lesson_order)
                 WHERE id = $4
                 RETURNING *`,
                [
                    title.trim(),
                    content || null,
                    newLessonOrder,
                    id
                ]
            );

            res.json({
                message: "Lesson updated successfully",
                lesson: result.rows[0]
            });

        } catch (error) {

            console.error("Update lesson error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// DELETE LESSON - TEACHER ONLY
// DELETE /api/lessons/:id
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        const client = await pool.connect();

        try {

            const { id } = req.params;

            await client.query("BEGIN");

            // Find lesson and verify ownership
            const lesson = await client.query(
                `SELECT
                    lessons.id,
                    lessons.course_id,
                    courses.teacher_id
                 FROM lessons

                 INNER JOIN courses
                 ON lessons.course_id = courses.id

                 WHERE lessons.id = $1`,
                [id]
            );

            if (lesson.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "Lesson not found"
                });

            }

            if (lesson.rows[0].teacher_id !== req.user.id) {

                await client.query("ROLLBACK");

                return res.status(403).json({
                    message: "You can only delete lessons from your own courses"
                });

            }

            const courseId = lesson.rows[0].course_id;

            // Delete the lesson
            //
            // lesson_progress records are automatically
            // removed because of ON DELETE CASCADE.
            //
            // course_materials.lesson_id becomes NULL
            // because of ON DELETE SET NULL.
            await client.query(
                `DELETE FROM lessons
                 WHERE id = $1`,
                [id]
            );

            // Re-number the remaining lessons so that
            // their order stays clean: 1, 2, 3, 4...
            const remainingLessons = await client.query(
                `SELECT id
                 FROM lessons
                 WHERE course_id = $1
                 ORDER BY lesson_order ASC, created_at ASC`,
                [courseId]
            );

            for (
                let i = 0;
                i < remainingLessons.rows.length;
                i++
            ) {

                await client.query(
                    `UPDATE lessons
                     SET lesson_order = $1
                     WHERE id = $2`,
                    [
                        i + 1,
                        remainingLessons.rows[i].id
                    ]
                );

            }

            await client.query("COMMIT");

            res.json({
                message: "Lesson deleted successfully"
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error("Delete lesson error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        } finally {

            client.release();

        }

    }
);


// ==========================================
// GET SINGLE LESSON
// GET /api/lessons/:id
// ==========================================

router.get(
    "/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const { id } = req.params;

            const result = await pool.query(
                `SELECT
                    lessons.id,
                    lessons.title,
                    lessons.content,
                    lessons.lesson_order,
                    lessons.created_at,
                    courses.id AS course_id,
                    courses.title AS course_title
                 FROM lessons

                 INNER JOIN courses
                 ON lessons.course_id = courses.id

                 WHERE lessons.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    message: "Lesson not found"
                });

            }

            const lesson = result.rows[0];


            // Teachers can access lessons belonging
            // to their own courses

            if (req.user.role === "teacher") {

                const teacherCourse = await pool.query(
                    `SELECT id
                     FROM courses
                     WHERE id = $1
                     AND teacher_id = $2`,
                    [
                        lesson.course_id,
                        req.user.id
                    ]
                );

                if (teacherCourse.rows.length === 0) {

                    return res.status(403).json({
                        message: "You do not have access to this lesson"
                    });

                }

            }


            // Students can access lessons only if
            // they are enrolled in the course

            if (req.user.role === "student") {

                const enrollment = await pool.query(
                    `SELECT id
                     FROM enrollments
                     WHERE student_id = $1
                     AND course_id = $2`,
                    [
                        req.user.id,
                        lesson.course_id
                    ]
                );

                if (enrollment.rows.length === 0) {

                    return res.status(403).json({
                        message: "You must be enrolled in this course"
                    });

                }

            }


            res.json({
                lesson
            });

        } catch (error) {

            console.error("Get lesson error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


module.exports = router;

