const express = require("express");

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// ENROL IN A COURSE - STUDENT ONLY
// POST /api/enrollments
// ==========================================

router.post(
    "/",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { course_id } = req.body;

            if (!course_id) {
                return res.status(400).json({
                    message: "Course ID is required"
                });
            }

            // Check if course exists
            const course = await pool.query(
                "SELECT id FROM courses WHERE id = $1",
                [course_id]
            );

            if (course.rows.length === 0) {
                return res.status(404).json({
                    message: "Course not found"
                });
            }

            // Check if already enrolled
            const existingEnrollment = await pool.query(
                `SELECT id
                 FROM enrollments
                 WHERE student_id = $1
                 AND course_id = $2`,
                [
                    req.user.id,
                    course_id
                ]
            );

            if (existingEnrollment.rows.length > 0) {
                return res.status(400).json({
                    message: "You are already enrolled in this course"
                });
            }

            // Create enrollment
            const result = await pool.query(
                `INSERT INTO enrollments
                (student_id, course_id)
                VALUES ($1, $2)
                RETURNING *`,
                [
                    req.user.id,
                    course_id
                ]
            );

            res.status(201).json({
                message: "Successfully enrolled in course",
                enrollment: result.rows[0]
            });

        } catch (error) {

            console.error("Enrollment error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET MY COURSES - STUDENT ONLY
// GET /api/enrollments/my
// ==========================================

router.get(
    "/my",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    enrollments.id,
                    enrollments.enrolled_at,
                    courses.id AS course_id,
                    courses.title,
                    courses.description,
                    courses.teacher_id,
                    users.full_name AS teacher_name
                 FROM enrollments

                 INNER JOIN courses
                 ON enrollments.course_id = courses.id

                 INNER JOIN users
                 ON courses.teacher_id = users.id

                 WHERE enrollments.student_id = $1

                 ORDER BY enrollments.enrolled_at DESC`,
                [req.user.id]
            );

            res.json({
                courses: result.rows
            });

        } catch (error) {

            console.error("Get enrolled courses error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// CHECK ENROLLMENT
// GET /api/enrollments/check/:courseId
// ==========================================

router.get(
    "/check/:courseId",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { courseId } = req.params;

            const result = await pool.query(
                `SELECT id
                 FROM enrollments
                 WHERE student_id = $1
                 AND course_id = $2`,
                [
                    req.user.id,
                    courseId
                ]
            );

            res.json({
                enrolled: result.rows.length > 0
            });

        } catch (error) {

            console.error("Check enrollment error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// UNENROL FROM A COURSE - STUDENT ONLY
// DELETE /api/enrollments/:courseId
// ==========================================

router.delete(
    "/:courseId",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const { courseId } = req.params;

            // Check if the student is enrolled
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
                return res.status(404).json({
                    message: "You are not enrolled in this course"
                });
            }

            // Remove only this student's enrolment
            await pool.query(
                `DELETE FROM enrollments
                 WHERE student_id = $1
                 AND course_id = $2`,
                [
                    req.user.id,
                    courseId
                ]
            );

            res.json({
                message: "Successfully unenrolled from the course"
            });

        } catch (error) {

            console.error("Unenrol course error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


module.exports = router;