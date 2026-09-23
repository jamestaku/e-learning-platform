const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const pool = require("../config/db");
const supabase = require("../config/supabase");

const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ==========================================
// SUPABASE STORAGE
// ==========================================

const BUCKET_NAME = "assignment-pdfs";


// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

const storage = multer.memoryStorage();

const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".mdb",
    ".accdb",
    ".ppt",
    ".pptx"
];

const allowedMimeTypes = [
    // PDF
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // Microsoft Access
    "application/x-msaccess",
    "application/vnd.ms-access",
    "application/msaccess",

    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const upload = multer({

    storage: storage,

    fileFilter: (req, file, cb) => {

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const extensionAllowed =
            allowedExtensions.includes(extension);

        const mimeAllowed =
            allowedMimeTypes.includes(file.mimetype);

        if (extensionAllowed && mimeAllowed) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only PDF, Word, Excel, Access and PowerPoint files are allowed."
                ),
                false
            );

        }

    },

    limits: {
        fileSize: 10 * 1024 * 1024
    }

});


// ==========================================
// CREATE UNIQUE STORAGE FILE NAME
// ==========================================

const createStoragePath = (file) => {

    const extension =
        path.extname(file.originalname).toLowerCase();

    const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1E9) +
        extension;

    return uniqueName;

};


// ==========================================
// CREATE SIGNED URL
// ==========================================

const createSignedUrl = async (fileName) => {

    if (!fileName) {

        return null;

    }

    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(
            fileName,
            60 * 60
        );

    if (error) {

        console.error(
            "Create assignment signed URL error:",
            error
        );

        return null;

    }

    return data.signedUrl;

};


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

        let uploadedStoragePath = null;

        try {

            const {
                course_id,
                title,
                description,
                due_date
            } = req.body;


            // ==========================================
            // VALIDATE REQUIRED FIELDS
            // ==========================================

            if (!course_id || !title) {

                return res.status(400).json({
                    message:
                        "Course and assignment title are required"
                });

            }


            // ==========================================
            // CHECK COURSE OWNERSHIP
            // ==========================================

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


            // ==========================================
            // UPLOAD ASSIGNMENT FILE TO SUPABASE
            // ==========================================

            let pdfFile = null;

            if (req.file) {

                uploadedStoragePath =
                    createStoragePath(req.file);


                const {
                    error: uploadError
                } = await supabase
                    .storage
                    .from(BUCKET_NAME)
                    .upload(
                        uploadedStoragePath,
                        req.file.buffer,
                        {
                            // IMPORTANT:
                            // Use the actual MIME type of the uploaded file
                            contentType:
                                req.file.mimetype,

                            upsert: false
                        }
                    );


                if (uploadError) {

                    console.error(
                        "Supabase assignment file upload error:",
                        uploadError
                    );

                    return res.status(500).json({
                        message:
                            "Failed to upload assignment file."
                    });

                }


                pdfFile =
                    uploadedStoragePath;

            }


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
            // CREATE NOTIFICATIONS
            // ==========================================

            const enrolledStudents = await pool.query(
                `SELECT student_id
                 FROM enrollments
                 WHERE course_id = $1`,
                [
                    course_id
                ]
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
            // ADD SIGNED URL
            // ==========================================

            const assignment =
                result.rows[0];

            assignment.pdf_url =
                await createSignedUrl(
                    assignment.pdf_file
                );


            // ==========================================
            // SUCCESS RESPONSE
            // ==========================================

            res.status(201).json({

                message:
                    "Assignment created successfully",

                assignment

            });


        } catch (error) {

            console.error(
                "Create assignment error:",
                error
            );


            // ==========================================
            // CLEANUP SUPABASE FILE IF DB OPERATION FAILS
            // ==========================================

            if (uploadedStoragePath) {

                try {

                    await supabase
                        .storage
                        .from(BUCKET_NAME)
                        .remove([
                            uploadedStoragePath
                        ]);

                } catch (storageError) {

                    console.error(
                        "Assignment file cleanup error:",
                        storageError
                    );

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
                    assignments.pdf_file,
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


            const assignments =
                await Promise.all(
                    result.rows.map(
                        async (assignment) => {

                            return {
                                ...assignment,

                                pdf_url:
                                    await createSignedUrl(
                                        assignment.pdf_file
                                    )

                            };

                        }
                    )
                );


            res.json({
                assignments
            });


        } catch (error) {

            console.error(
                "Get teacher assignments error:",
                error
            );


            res.status(500).json({
                message:
                    "Internal server error"
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

            const { courseId } =
                req.params;


            // ==========================================
            // TEACHER ACCESS
            // ==========================================

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


            // ==========================================
            // STUDENT ACCESS
            // ==========================================

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


            // ==========================================
            // GET ASSIGNMENTS
            // ==========================================

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
                 ORDER BY due_date ASC NULLS LAST,
                          created_at DESC`,
                [
                    courseId
                ]
            );


            const assignments =
                await Promise.all(
                    result.rows.map(
                        async (assignment) => {

                            return {
                                ...assignment,

                                pdf_url:
                                    await createSignedUrl(
                                        assignment.pdf_file
                                    )

                            };

                        }
                    )
                );


            res.json({
                assignments
            });


        } catch (error) {

            console.error(
                "Get course assignments error:",
                error
            );


            res.status(500).json({
                message:
                    "Internal server error"
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

            const { id } =
                req.params;


            const result = await pool.query(
                `SELECT
                    assignments.id,
                    assignments.course_id,
                    assignments.title,
                    assignments.description,
                    assignments.due_date,
                    assignments.pdf_file,
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
                    message:
                        "Assignment not found"
                });

            }


            const assignment =
                result.rows[0];


            // ==========================================
            // TEACHER ACCESS
            // ==========================================

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
                        message:
                            "Access denied"
                    });

                }

            }


            // ==========================================
            // STUDENT ACCESS
            // ==========================================

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


            // ==========================================
            // SIGNED ASSIGNMENT FILE URL
            // ==========================================

            assignment.pdf_url =
                await createSignedUrl(
                    assignment.pdf_file
                );


            res.json({
                assignment
            });


        } catch (error) {

            console.error(
                "Get assignment error:",
                error
            );


            res.status(500).json({
                message:
                    "Internal server error"
            });

        }

    }
);


// ==========================================
// DELETE ASSIGNMENT - TEACHER ONLY
// DELETE /api/assignments/:id
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        let client;

        try {

            const { id } = req.params;

            // ==========================================
            // GET ASSIGNMENT AND CHECK OWNERSHIP
            // ==========================================

            const assignmentResult = await pool.query(
                `SELECT
                    assignments.id,
                    assignments.pdf_file,
                    assignments.course_id
                 FROM assignments
                 INNER JOIN courses
                    ON assignments.course_id = courses.id
                 WHERE assignments.id = $1
                 AND courses.teacher_id = $2`,
                [
                    id,
                    req.user.id
                ]
            );


            // ==========================================
            // CHECK IF ASSIGNMENT EXISTS
            // ==========================================

            if (assignmentResult.rows.length === 0) {

                return res.status(404).json({
                    message:
                        "Assignment not found or you do not have permission to delete it"
                });

            }


            const assignment =
                assignmentResult.rows[0];


            // ==========================================
            // DELETE SUPABASE FILE
            // ==========================================

            if (assignment.pdf_file) {

                const { error: storageError } =
                    await supabase
                        .storage
                        .from(BUCKET_NAME)
                        .remove([
                            assignment.pdf_file
                        ]);


                if (storageError) {

                    console.error(
                        "Supabase assignment file delete error:",
                        storageError
                    );

                    return res.status(500).json({
                        message:
                            "Failed to delete assignment file"
                    });

                }

            }


            // ==========================================
            // DELETE ASSIGNMENT
            // ==========================================

            const deleteResult = await pool.query(
                `DELETE FROM assignments
                 WHERE id = $1
                 RETURNING id`,
                [
                    id
                ]
            );


            if (deleteResult.rows.length === 0) {

                return res.status(404).json({
                    message: "Assignment not found"
                });

            }


            // ==========================================
            // SUCCESS
            // ==========================================

            res.json({
                message:
                    "Assignment deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete assignment error:",
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