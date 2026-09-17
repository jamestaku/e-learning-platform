const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
// ==========================================
// GET COURSE PROGRESS
// GET /api/progress/course/:courseId
// ==========================================

router.get(
    "/course/:courseId",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { courseId } = req.params;


            // Check that the student is enrolled
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
                    message:
                        "You must be enrolled in this course"
                });

            }


            // Get completed lessons
            const result = await pool.query(
                `SELECT lesson_progress.lesson_id
                 FROM lesson_progress
                 INNER JOIN lessons
                    ON lesson_progress.lesson_id = lessons.id
                 WHERE lesson_progress.student_id = $1
                 AND lessons.course_id = $2
                 ORDER BY lesson_progress.lesson_id`,
                [
                    req.user.id,
                    courseId
                ]
            );


            const completedLessons =
                result.rows.map(
                    (row) => row.lesson_id
                );


            res.json({
                completedLessons
            });


        } catch (error) {

            console.error(
                "Get course progress error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);

// ==========================================
// MARK LESSON AS COMPLETED
// POST /api/progress/complete
// ==========================================

router.post(
    "/complete",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { lesson_id } = req.body;

            if (!lesson_id) {

                return res.status(400).json({
                    message: "Lesson ID is required"
                });

            }


            // Check that the lesson exists
            const lesson = await pool.query(
                `SELECT
                    lessons.id,
                    lessons.course_id
                 FROM lessons
                 WHERE lessons.id = $1`,
                [lesson_id]
            );


            if (lesson.rows.length === 0) {

                return res.status(404).json({
                    message: "Lesson not found"
                });

            }


            const courseId =
                lesson.rows[0].course_id;


            // Make sure the student is enrolled
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
                    message:
                        "You must be enrolled in this course"
                });

            }


            // Check whether already completed
            const existingProgress = await pool.query(
                `SELECT id
                 FROM lesson_progress
                 WHERE student_id = $1
                 AND lesson_id = $2`,
                [
                    req.user.id,
                    lesson_id
                ]
            );


            if (existingProgress.rows.length > 0) {

                return res.json({
                    message:
                        "Lesson already completed"
                });

            }


            // Save progress
            const result = await pool.query(
                `INSERT INTO lesson_progress
                    (student_id, lesson_id)
                 VALUES ($1, $2)
                 RETURNING *`,
                [
                    req.user.id,
                    lesson_id
                ]
            );


            res.status(201).json({
                message:
                    "Lesson marked as completed",
                progress: result.rows[0]
            });


        } catch (error) {

            console.error(
                "Complete lesson error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


module.exports = router;