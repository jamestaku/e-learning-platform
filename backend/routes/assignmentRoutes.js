
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ==========================================
// PDF UPLOAD CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/");

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});


const upload = multer({

    storage: storage,

    fileFilter: (req, file, cb) => {

        if (file.mimetype === "application/pdf") {

            cb(null, true);

        } else {

            cb(
                new Error("Only PDF files are allowed"),
                false
            );

        }

    },

    limits: {
        fileSize: 10 * 1024 * 1024
    }

});


// ==========================================
// CREATE ASSIGNMENT
// POST /api/assignments
// ==========================================

router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    upload.single("pdf"),
    async (req, res) => {

        try {

            const {
                course_id,
                title,
                description,
                due_date
            } = req.body;


            // Validate required fields
            if (!course_id || !title) {

                return res.status(400).json({
                    message:
                        "Course and assignment title are required"
                });

            }


            // Check that the course belongs to this teacher
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
                    message:
                        "You can only create assignments for your own courses"
                });

            }


            // Get uploaded PDF filename
            const pdfFile = req.file
                ? req.file.filename
                : null;


            // ==========================================
            // CREATE ASSIGNMENT
            // ==========================================

            const result = await pool.query(
                `INSERT INTO assignments
                    (
                        course_id,
                        title,
                        description,
                        due_date,
                        pdf_file
                    )
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [
                    course_id,
                    title,
                    description || null,
                    due_date || null,
                    pdfFile
                ]
            );


            // ==========================================
            // CREATE NOTIFICATIONS FOR ENROLLED STUDENTS
            // ==========================================

            const enrolledStudents = await pool.query(
                `SELECT student_id
                 FROM enrollments
                 WHERE course_id = $1`,
                [course_id]
            );


            for (const student of enrolledStudents.rows) {

                await pool.query(
                    `INSERT INTO notifications
                    (
                        user_id,
                        title,
                        message,
                        type
                    )
                    VALUES ($1, $2, $3, $4)`,
                    [
                        student.student_id,
                        "New Assignment",
                        `A new assignment "${title}" has been posted for your course.`,
                        "assignment"
                    ]
                );

            }


            // ==========================================
            // SUCCESS RESPONSE
            // ==========================================

            res.status(201).json({

                message:
                    "Assignment created successfully",

                assignment:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "Create assignment error:",
                error
            );


            // Remove uploaded file if database
            // operation fails

            if (req.file) {

                const fs = require("fs");

                const filePath =
                    path.join(
                        "uploads",
                        req.file.filename
                    );

                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);

                }

            }


            res.status(500).json({
                message:
                    error.message ||
                    "Internal server error"
            });

        }

    }
);


// ==========================================
// GET TEACHER ASSIGNMENTS
// GET /api/assignments/my
// ==========================================

router.get(
    "/my",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    assignments.id,
                    assignments.course_id,
                    assignments.title,
                    assignments.description,
                    assignments.due_date,
                    assignments.created_at,
                    courses.title AS course_title
                 FROM assignments
                 INNER JOIN courses
                    ON assignments.course_id = courses.id
                 WHERE courses.teacher_id = $1
                 ORDER BY assignments.created_at DESC`,
                [
                    req.user.id
                ]
            );


            res.json({
                assignments: result.rows
            });


        } catch (error) {

            console.error(
                "Get teacher assignments error:",
                error
            );


            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET ASSIGNMENTS FOR A COURSE
// GET /api/assignments/course/:courseId
// ==========================================

router.get(
    "/course/:courseId",
    authenticateToken,
    async (req, res) => {

        try {

            const { courseId } = req.params;


            // If teacher, make sure it is their course

            if (req.user.role === "teacher") {

                const course = await pool.query(
                    `SELECT id
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
                        message:
                            "You can only view assignments for your own courses"
                    });

                }

            }


            // If student, make sure they are enrolled

            if (req.user.role === "student") {

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

            }


            // Get assignments

            const result = await pool.query(
                `SELECT
                    id,
                    course_id,
                    title,
                    description,
                    due_date,
                    pdf_file,
                    created_at
                 FROM assignments
                 WHERE course_id = $1
                 ORDER BY due_date ASC NULLS LAST, created_at DESC`,
                [
                    courseId
                ]
            );


            res.json({
                assignments: result.rows
            });


        } catch (error) {

            console.error(
                "Get course assignments error:",
                error
            );


            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET SINGLE ASSIGNMENT
// GET /api/assignments/:id
// ==========================================

router.get(
    "/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const { id } = req.params;


            const result = await pool.query(
                `SELECT
                    assignments.id,
                    assignments.course_id,
                    assignments.title,
                    assignments.description,
                    assignments.due_date,
                    assignments.created_at,
                    courses.title AS course_title
                 FROM assignments
                 INNER JOIN courses
                    ON assignments.course_id = courses.id
                 WHERE assignments.id = $1`,
                [
                    id
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    message: "Assignment not found"
                });

            }


            const assignment =
                result.rows[0];


            // Teacher access

            if (req.user.role === "teacher") {

                const course = await pool.query(
                    `SELECT id
                     FROM courses
                     WHERE id = $1
                     AND teacher_id = $2`,
                    [
                        assignment.course_id,
                        req.user.id
                    ]
                );


                if (course.rows.length === 0) {

                    return res.status(403).json({
                        message: "Access denied"
                    });

                }

            }


            // Student access

            if (req.user.role === "student") {

                const enrollment = await pool.query(
                    `SELECT id
                     FROM enrollments
                     WHERE student_id = $1
                     AND course_id = $2`,
                    [
                        req.user.id,
                        assignment.course_id
                    ]
                );


                if (enrollment.rows.length === 0) {

                    return res.status(403).json({
                        message:
                            "You must be enrolled in this course"
                    });

                }

            }


            res.json({
                assignment
            });


        } catch (error) {

            console.error(
                "Get assignment error:",
                error
            );


            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


module.exports = router;

