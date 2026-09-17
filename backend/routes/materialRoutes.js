const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Storage configuration
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

// Allowed file types
const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx"
];

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF, Word and PowerPoint files are allowed."
            ),
            false
        );
    }
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// ======================================================
// TEACHER - UPLOAD COURSE MATERIAL
// ======================================================

router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    upload.single("file"),
    async (req, res) => {
        try {
            const {
                course_id,
                lesson_id,
                title
            } = req.body;

            if (!course_id || !title) {
                return res.status(400).json({
                    message: "Course and material title are required."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Please select a file to upload."
                });
            }

            // Check that the course belongs to this teacher
            const courseResult = await pool.query(
                `SELECT id
                 FROM courses
                 WHERE id = $1
                 AND teacher_id = $2`,
                [course_id, req.user.id]
            );

            if (courseResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You can only upload materials to your own courses."
                });
            }

            // If a lesson was selected, make sure it belongs to the course
            if (lesson_id) {
                const lessonResult = await pool.query(
                    `SELECT id
                     FROM lessons
                     WHERE id = $1
                     AND course_id = $2`,
                    [lesson_id, course_id]
                );

                if (lessonResult.rows.length === 0) {
                    return res.status(400).json({
                        message: "The selected lesson does not belong to this course."
                    });
                }
            }

            const result = await pool.query(
                `INSERT INTO course_materials
                (
                    course_id,
                    lesson_id,
                    title,
                    file_name,
                    original_name,
                    file_type,
                    uploaded_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    course_id,
                    lesson_id || null,
                    title,
                    req.file.filename,
                    req.file.originalname,
                    req.file.mimetype,
                    req.user.id
                ]
            );

            res.status(201).json({
                message: "Course material uploaded successfully.",
                material: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Upload course material error:",
                error
            );

            res.status(500).json({
                message: "Internal server error."
            });
        }
    }
);


// ======================================================
// GET MATERIALS FOR A COURSE
// ======================================================

router.get(
    "/course/:courseId",
    authenticateToken,
    async (req, res) => {
        try {
            const { courseId } = req.params;

            const result = await pool.query(
                `SELECT
                    cm.id,
                    cm.course_id,
                    cm.lesson_id,
                    cm.title,
                    cm.file_name,
                    cm.original_name,
                    cm.file_type,
                    cm.created_at,
                    l.title AS lesson_title
                 FROM course_materials cm
                 LEFT JOIN lessons l
                    ON cm.lesson_id = l.id
                 WHERE cm.course_id = $1
                 ORDER BY cm.created_at DESC`,
                [courseId]
            );

            res.json({
                materials: result.rows
            });

        } catch (error) {
            console.error(
                "Get course materials error:",
                error
            );

            res.status(500).json({
                message: "Internal server error."
            });
        }
    }
);


// ======================================================
// GET MATERIALS FOR A LESSON
// ======================================================

router.get(
    "/lesson/:lessonId",
    authenticateToken,
    async (req, res) => {
        try {
            const { lessonId } = req.params;

            const result = await pool.query(
                `SELECT
                    id,
                    course_id,
                    lesson_id,
                    title,
                    file_name,
                    original_name,
                    file_type,
                    created_at
                 FROM course_materials
                 WHERE lesson_id = $1
                 ORDER BY created_at DESC`,
                [lessonId]
            );

            res.json({
                materials: result.rows
            });

        } catch (error) {
            console.error(
                "Get lesson materials error:",
                error
            );

            res.status(500).json({
                message: "Internal server error."
            });
        }
    }
);


// ======================================================
// DELETE MATERIAL
// ======================================================

router.delete(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `DELETE FROM course_materials
                 WHERE id = $1
                 AND uploaded_by = $2
                 RETURNING *`,
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Material not found."
                });
            }

            res.json({
                message: "Course material deleted successfully."
            });

        } catch (error) {
            console.error(
                "Delete course material error:",
                error
            );

            res.status(500).json({
                message: "Internal server error."
            });
        }
    }
);


module.exports = router;