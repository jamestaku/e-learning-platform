
const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// TEACHER DASHBOARD
// ======================================================

router.get(
    "/teacher",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const teacherId = req.user.id;


            // ==================================================
            // TOTAL COURSES
            // ==================================================

            const coursesResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM courses
                WHERE teacher_id = $1
                `,
                [teacherId]
            );


            // ==================================================
            // TOTAL UNIQUE STUDENTS
            // ==================================================

            const studentsResult = await pool.query(
                `
                SELECT COUNT(DISTINCT e.student_id) AS total
                FROM enrollments e
                INNER JOIN courses c
                    ON e.course_id = c.id
                WHERE c.teacher_id = $1
                `,
                [teacherId]
            );


            // ==================================================
            // TOTAL ASSIGNMENTS
            // ==================================================

            const assignmentsResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM assignments a
                INNER JOIN courses c
                    ON a.course_id = c.id
                WHERE c.teacher_id = $1
                `,
                [teacherId]
            );


            // ==================================================
            // TOTAL SUBMISSIONS
            // ==================================================

            const submissionsResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM assignment_submissions s
                INNER JOIN assignments a
                    ON s.assignment_id = a.id
                INNER JOIN courses c
                    ON a.course_id = c.id
                WHERE c.teacher_id = $1
                `,
                [teacherId]
            );


            // ==================================================
            // TOTAL LESSONS
            // ==================================================

            const lessonsResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM lessons l
                INNER JOIN courses c
                    ON l.course_id = c.id
                WHERE c.teacher_id = $1
                `,
                [teacherId]
            );


            // ==================================================
            // RECENT COURSES
            // ==================================================

            const recentCoursesResult = await pool.query(
                `
                SELECT
                    c.id,
                    c.title,
                    c.created_at
                FROM courses c
                WHERE c.teacher_id = $1
                ORDER BY c.created_at DESC
                LIMIT 5
                `,
                [teacherId]
            );


            // ==================================================
            // RECENT SUBMISSIONS
            // ==================================================

            const recentSubmissionsResult = await pool.query(
                `
                SELECT
                    s.id,
                    s.submitted_at,
                    s.marks,
                    u.full_name AS student_name,
                    a.title AS assignment_title,
                    c.title AS course_title
                FROM assignment_submissions s

                INNER JOIN users u
                    ON s.student_id = u.id

                INNER JOIN assignments a
                    ON s.assignment_id = a.id

                INNER JOIN courses c
                    ON a.course_id = c.id

                WHERE c.teacher_id = $1

                ORDER BY s.submitted_at DESC

                LIMIT 5
                `,
                [teacherId]
            );


            // ==================================================
            // SEND RESPONSE
            // ==================================================

            res.json({

                stats: {

                    courses:
                        Number(
                            coursesResult.rows[0].total
                        ),

                    students:
                        Number(
                            studentsResult.rows[0].total
                        ),

                    assignments:
                        Number(
                            assignmentsResult.rows[0].total
                        ),

                    submissions:
                        Number(
                            submissionsResult.rows[0].total
                        ),

                    lessons:
                        Number(
                            lessonsResult.rows[0].total
                        )

                },

                recentCourses:
                    recentCoursesResult.rows,

                recentSubmissions:
                    recentSubmissionsResult.rows

            });


        } catch (error) {

            console.error(
                "Teacher dashboard error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to load teacher dashboard"
            });

        }

    }
);


module.exports = router;

