
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
// SUBMIT ASSIGNMENT
// POST /api/submissions
// ==========================================

router.post(
    "/",
    authenticateToken,
    requireRole("student"),
    upload.single("submission"),
    async (req, res) => {

        try {

            const {
                assignment_id
            } = req.body;

            // Validate assignment
            if (!assignment_id) {

                return res.status(400).json({
                    message: "Assignment ID is required"
                });

            }

            // Validate uploaded file
            if (!req.file) {

                return res.status(400).json({
                    message: "Please upload a PDF file"
                });

            }

            // Check that assignment exists
            const assignment = await pool.query(
                `SELECT
                    id,
                    course_id
                 FROM assignments
                 WHERE id = $1`,
                [assignment_id]
            );

            if (assignment.rows.length === 0) {

                return res.status(404).json({
                    message: "Assignment not found"
                });

            }

            const courseId =
                assignment.rows[0].course_id;

            // Check that student is enrolled
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

                // Delete uploaded file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(403).json({
                    message:
                        "You must be enrolled in this course"
                });

            }

            // Check if student already submitted
            const existingSubmission = await pool.query(
                `SELECT id
                 FROM assignment_submissions
                 WHERE assignment_id = $1
                 AND student_id = $2`,
                [
                    assignment_id,
                    req.user.id
                ]
            );

            if (existingSubmission.rows.length > 0) {

                // Delete newly uploaded file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message:
                        "You have already submitted this assignment"
                });

            }

            // Save submission
            const result = await pool.query(
                `INSERT INTO assignment_submissions
                    (
                        assignment_id,
                        student_id,
                        submission_file
                    )
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [
                    assignment_id,
                    req.user.id,
                    req.file.filename
                ]
            );

            // ==========================================
            // CREATE TEACHER NOTIFICATION
            // ==========================================

            try {

                // Find the teacher and assignment details
                const assignmentDetails = await pool.query(
                    `SELECT
                        assignments.title AS assignment_title,
                        courses.teacher_id,
                        users.full_name AS student_name
                     FROM assignments

                     INNER JOIN courses
                        ON assignments.course_id = courses.id

                     INNER JOIN users
                        ON users.id = $1

                     WHERE assignments.id = $2`,
                    [
                        req.user.id,
                        assignment_id
                    ]
                );

                if (assignmentDetails.rows.length > 0) {

                    const {
                        assignment_title,
                        teacher_id,
                        student_name
                    } = assignmentDetails.rows[0];

                    // Create notification for teacher
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
                            teacher_id,
                            "New Submission",
                            `${student_name} has submitted the assignment "${assignment_title}".`,
                            "submission"
                        ]
                    );

                    console.log(
                        "Teacher notification created successfully"
                    );

                }

            } catch (notificationError) {

                // Notification failure should NOT
                // prevent the submission from succeeding
                console.error(
                    "Teacher notification error:",
                    notificationError
                );

            }

            // ==========================================
            // SEND SUCCESS RESPONSE
            // ==========================================

            res.status(201).json({

                message:
                    "Assignment submitted successfully",

                submission:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Submit assignment error:",
                error
            );

            // Delete uploaded file if something failed
            if (req.file) {

                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
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
// GET STUDENT SUBMISSIONS
// GET /api/submissions/my
// ==========================================

router.get(
    "/my",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    assignment_submissions.id,
                    assignment_submissions.assignment_id,
                    assignment_submissions.submission_file,
                    assignment_submissions.submitted_at,
                    assignment_submissions.marks,
                    assignment_submissions.feedback,
                    assignments.title AS assignment_title,
                    courses.title AS course_title
                 FROM assignment_submissions

                 INNER JOIN assignments
                    ON assignment_submissions.assignment_id =
                       assignments.id

                 INNER JOIN courses
                    ON assignments.course_id =
                       courses.id

                 WHERE assignment_submissions.student_id = $1

                 ORDER BY assignment_submissions.submitted_at DESC`,
                [req.user.id]
            );

            res.json({
                submissions: result.rows
            });

        } catch (error) {

            console.error(
                "Get student submissions error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET STUDENT GRADES
// GET /api/submissions/grades
// ==========================================

router.get(
    "/grades",
    authenticateToken,
    requireRole("student"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    assignment_submissions.id,
                    assignment_submissions.assignment_id,
                    assignment_submissions.submitted_at,
                    assignment_submissions.marks,
                    assignment_submissions.feedback,

                    assignments.title AS assignment_title,

                    courses.id AS course_id,
                    courses.title AS course_title,

                    users.full_name AS teacher_name

                 FROM assignment_submissions

                 INNER JOIN assignments
                    ON assignment_submissions.assignment_id =
                       assignments.id

                 INNER JOIN courses
                    ON assignments.course_id =
                       courses.id

                 INNER JOIN users
                    ON courses.teacher_id =
                       users.id

                 WHERE assignment_submissions.student_id = $1

                 ORDER BY assignment_submissions.submitted_at DESC`,
                [req.user.id]
            );

            res.json({
                grades: result.rows
            });

        } catch (error) {

            console.error(
                "Get student grades error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET TEACHER SUBMISSIONS
// GET /api/submissions/teacher
// ==========================================

router.get(
    "/teacher",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    assignment_submissions.id,
                    assignment_submissions.assignment_id,
                    assignment_submissions.student_id,
                    assignment_submissions.submission_file,
                    assignment_submissions.submitted_at,
                    assignment_submissions.marks,
                    assignment_submissions.feedback,

                    assignments.title AS assignment_title,

                    courses.id AS course_id,
                    courses.title AS course_title,

                    users.full_name AS student_name,
                    users.email AS student_email

                 FROM assignment_submissions

                 INNER JOIN assignments
                    ON assignment_submissions.assignment_id =
                       assignments.id

                 INNER JOIN courses
                    ON assignments.course_id =
                       courses.id

                 INNER JOIN users
                    ON assignment_submissions.student_id =
                       users.id

                 WHERE courses.teacher_id = $1

                 ORDER BY assignment_submissions.submitted_at DESC`,
                [
                    req.user.id
                ]
            );

            res.json({
                submissions: result.rows
            });

        } catch (error) {

            console.error(
                "Get teacher submissions error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GRADE A STUDENT SUBMISSION
// PUT /api/submissions/:id/grade
// ==========================================

router.put(
    "/:id/grade",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const submissionId = req.params.id;
            const { marks, feedback } = req.body;

            // Validate marks
            if (
                marks === undefined ||
                marks === null ||
                marks === ""
            ) {

                return res.status(400).json({
                    message: "Marks are required"
                });

            }

            const numericMarks = Number(marks);

            if (
                isNaN(numericMarks) ||
                numericMarks < 0 ||
                numericMarks > 100
            ) {

                return res.status(400).json({
                    message:
                        "Marks must be between 0 and 100"
                });

            }

            // Check that the submission belongs
            // to one of the teacher's courses
            const checkResult = await pool.query(
                `SELECT
                    assignment_submissions.id,
                    courses.teacher_id
                 FROM assignment_submissions

                 INNER JOIN assignments
                    ON assignment_submissions.assignment_id =
                       assignments.id

                 INNER JOIN courses
                    ON assignments.course_id =
                       courses.id

                 WHERE assignment_submissions.id = $1`,
                [submissionId]
            );

            if (checkResult.rows.length === 0) {

                return res.status(404).json({
                    message: "Submission not found"
                });

            }

            if (
                checkResult.rows[0].teacher_id !==
                req.user.id
            ) {

                return res.status(403).json({
                    message:
                        "You are not allowed to grade this submission"
                });

            }

            // Update marks and feedback
            const result = await pool.query(
                `UPDATE assignment_submissions
                 SET
                    marks = $1,
                    feedback = $2
                 WHERE id = $3
                 RETURNING *`,
                [
                    numericMarks,
                    feedback || null,
                    submissionId
                ]
            );

            res.json({
                message:
                    "Submission graded successfully",

                submission:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Grade submission error:",
                error
            );

            res.status(500).json({
                message:
                    "Internal server error"
            });

        }

    }
);

module.exports = router;

