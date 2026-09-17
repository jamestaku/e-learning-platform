const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// ==========================================
// STUDENT DASHBOARD
// GET /api/dashboard/student
// ==========================================

router.get(
    "/student",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const studentId = req.user.id;


            // ==========================================
            // TOTAL ENROLLED COURSES
            // ==========================================

            const coursesResult = await pool.query(
                `SELECT COUNT(*) AS total
                 FROM enrollments
                 WHERE student_id = $1`,
                [studentId]
            );


            // ==========================================
            // TOTAL ASSIGNMENTS
            // ==========================================

            const assignmentsResult = await pool.query(
                `SELECT COUNT(*) AS total
                 FROM assignments a
                 INNER JOIN enrollments e
                    ON a.course_id = e.course_id
                 WHERE e.student_id = $1`,
                [studentId]
            );


            // ==========================================
            // AVERAGE GRADE
            // ==========================================

            const gradeResult = await pool.query(
                `SELECT COALESCE(AVG(s.marks), 0) AS average
                 FROM assignment_submissions s
                 INNER JOIN assignments a
                    ON s.assignment_id = a.id
                 INNER JOIN enrollments e
                    ON a.course_id = e.course_id
                 WHERE s.student_id = $1
                 AND e.student_id = $1
                 AND s.marks IS NOT NULL`,
                [studentId]
            );


            // ==========================================
            // COMPLETED COURSES
            // A COURSE IS COMPLETED WHEN ALL ITS
            // LESSONS HAVE BEEN COMPLETED
            // ==========================================

            const completedCoursesResult = await pool.query(
                `SELECT COUNT(*) AS total
                 FROM (
                     SELECT
                         e.course_id
                     FROM enrollments e

                     INNER JOIN lessons l
                         ON l.course_id = e.course_id

                     LEFT JOIN lesson_progress lp
                         ON lp.lesson_id = l.id
                         AND lp.student_id = e.student_id

                     WHERE e.student_id = $1

                     GROUP BY e.course_id

                     HAVING COUNT(DISTINCT l.id) > 0
                     AND COUNT(DISTINCT l.id) =
                         COUNT(DISTINCT lp.lesson_id)
                 ) completed_courses`,
                [studentId]
            );


            // ==========================================
            // RECENT COURSES + LEARNING PROGRESS
            // ==========================================

            const recentCoursesResult = await pool.query(
                `SELECT
                    c.id,
                    c.title,
                    c.description,
                    e.enrolled_at,

                    COUNT(DISTINCT l.id) AS total_lessons,

                    COUNT(
                        DISTINCT CASE
                            WHEN lp.id IS NOT NULL
                            THEN l.id
                        END
                    ) AS completed_lessons

                 FROM enrollments e

                 INNER JOIN courses c
                    ON e.course_id = c.id

                 LEFT JOIN lessons l
                    ON l.course_id = c.id

                 LEFT JOIN lesson_progress lp
                    ON lp.lesson_id = l.id
                    AND lp.student_id = e.student_id

                 WHERE e.student_id = $1

                 GROUP BY
                    c.id,
                    c.title,
                    c.description,
                    e.enrolled_at

                 ORDER BY e.enrolled_at DESC

                 LIMIT 5`,
                [studentId]
            );


            // ==========================================
            // CALCULATE COURSE PROGRESS
            // ==========================================

            const recentCourses =
                recentCoursesResult.rows.map(
                    (course) => {

                        const totalLessons =
                            Number(course.total_lessons);

                        const completedLessons =
                            Number(course.completed_lessons);

                        const remainingLessons =
                            Math.max(
                                totalLessons -
                                completedLessons,
                                0
                            );

                        const progressPercentage =
                            totalLessons > 0
                                ? Math.min(
                                    Math.round(
                                        (
                                            completedLessons /
                                            totalLessons
                                        ) * 100
                                    ),
                                    100
                                )
                                : 0;

                        return {

                            ...course,

                            total_lessons:
                                totalLessons,

                            completed_lessons:
                                completedLessons,

                            remaining_lessons:
                                remainingLessons,

                            progress_percentage:
                                progressPercentage

                        };

                    }
                );


            // ==========================================
            // RECENT ASSIGNMENT SUBMISSIONS
            // ==========================================

            const recentSubmissionsResult = await pool.query(
                `SELECT
                    s.id,
                    s.submitted_at,
                    s.marks,
                    a.title AS assignment_title,
                    c.title AS course_title
                 FROM assignment_submissions s

                 INNER JOIN assignments a
                    ON s.assignment_id = a.id

                 INNER JOIN courses c
                    ON a.course_id = c.id

                 WHERE s.student_id = $1

                 ORDER BY s.submitted_at DESC

                 LIMIT 5`,
                [studentId]
            );


            // ==========================================
            // SEND DASHBOARD DATA
            // ==========================================

            res.json({

                stats: {

                    courses:
                        Number(
                            coursesResult.rows[0].total
                        ),

                    assignments:
                        Number(
                            assignmentsResult.rows[0].total
                        ),

                    averageGrade:
                        Number(
                            Number(
                                gradeResult.rows[0].average
                            ).toFixed(1)
                        ),

                    completedCourses:
                        Number(
                            completedCoursesResult.rows[0].total
                        )

                },

                recentCourses:
                    recentCourses,

                recentSubmissions:
                    recentSubmissionsResult.rows

            });


        } catch (error) {

            console.error(
                "Student dashboard error:",
                error
            );

            res.status(500).json({

                message:
                    "Unable to load student dashboard"

            });

        }

    }
);


module.exports = router;