const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const pool = require("../config/db");
const supabase = require("../config/supabase");

const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ======================================================
// SUPABASE STORAGE
// ======================================================

const BUCKET_NAME = "course-materials";


// ======================================================
// MULTER MEMORY STORAGE
// ======================================================

const storage = multer.memoryStorage();


// ======================================================
// ALLOWED FILE TYPES
// ======================================================

const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx"
];

const fileFilter = (req, file, cb) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

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


// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }

});


// ======================================================
// CREATE SUPABASE STORAGE PATH
// ======================================================

const createStoragePath = (file) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1E9) +
        extension;

    return uniqueName;
};


// ======================================================
// CREATE SIGNED URL
// ======================================================

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
            "Create signed URL error:",
            error
        );

        return null;
    }

    return data.signedUrl;
};


// ======================================================
// TEACHER - UPLOAD COURSE MATERIAL
// POST /api/materials
// ======================================================

router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    upload.single("file"),

    async (req, res) => {

        let uploadedStoragePath = null;

        try {

            const {
                course_id,
                lesson_id,
                title
            } = req.body;


            // ==================================================
            // VALIDATE REQUIRED FIELDS
            // ==================================================

            if (!course_id || !title) {

                return res.status(400).json({

                    message:
                        "Course and material title are required."

                });

            }


            // ==================================================
            // VALIDATE FILE
            // ==================================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please select a file to upload."

                });

            }


            // ==================================================
            // CHECK COURSE OWNERSHIP
            // ==================================================

            const courseResult = await pool.query(

                `SELECT id
                 FROM courses
                 WHERE id = $1
                 AND teacher_id = $2`,

                [
                    course_id,
                    req.user.id
                ]

            );


            if (courseResult.rows.length === 0) {

                return res.status(403).json({

                    message:
                        "You can only upload materials to your own courses."

                });

            }


            // ==================================================
            // CHECK LESSON
            // ==================================================

            if (lesson_id) {

                const lessonResult = await pool.query(

                    `SELECT id
                     FROM lessons
                     WHERE id = $1
                     AND course_id = $2`,

                    [
                        lesson_id,
                        course_id
                    ]

                );


                if (lessonResult.rows.length === 0) {

                    return res.status(400).json({

                        message:
                            "The selected lesson does not belong to this course."

                    });

                }

            }


            // ==================================================
            // CREATE STORAGE FILE PATH
            // ==================================================

            uploadedStoragePath =
                createStoragePath(req.file);


            // ==================================================
            // UPLOAD FILE TO SUPABASE STORAGE
            // ==================================================

            const { error: uploadError } = await supabase

                .storage

                .from(BUCKET_NAME)

                .upload(
                    uploadedStoragePath,
                    req.file.buffer,
                    {
                        contentType:
                            req.file.mimetype,

                        upsert: false
                    }
                );


            if (uploadError) {

                console.error(
                    "Supabase storage upload error:",
                    uploadError
                );

                return res.status(500).json({

                    message:
                        "Failed to upload file to storage."

                });

            }


            // ==================================================
            // SAVE FILE INFORMATION TO DATABASE
            // ==================================================

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
                    uploadedStoragePath,
                    req.file.originalname,
                    req.file.mimetype,
                    req.user.id
                ]

            );


            // ==================================================
            // CREATE SIGNED URL
            // ==================================================

            const material =
                result.rows[0];

            material.file_url =
                await createSignedUrl(
                    material.file_name
                );


            // ==================================================
            // SUCCESS
            // ==================================================

            res.status(201).json({

                message:
                    "Course material uploaded successfully.",

                material

            });


        } catch (error) {

            console.error(
                "Upload course material error:",
                error
            );


            // ==================================================
            // CLEAN UP STORAGE IF DATABASE FAILED
            // ==================================================

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
                        "Storage cleanup error:",
                        storageError
                    );

                }

            }


            res.status(500).json({

                message:
                    error.message ||
                    "Internal server error."

            });

        }

    }
);


// ======================================================
// GET MATERIALS FOR A COURSE
// GET /api/materials/course/:courseId
// ======================================================

router.get(
    "/course/:courseId",

    authenticateToken,

    async (req, res) => {

        try {

            const { courseId } =
                req.params;


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


            // ==================================================
            // CREATE SIGNED URL FOR EACH FILE
            // ==================================================

            const materials =
                await Promise.all(

                    result.rows.map(
                        async (material) => {

                            return {

                                ...material,

                                file_url:
                                    await createSignedUrl(
                                        material.file_name
                                    )

                            };

                        }
                    )

                );


            res.json({

                materials

            });


        } catch (error) {

            console.error(
                "Get course materials error:",
                error
            );


            res.status(500).json({

                message:
                    "Internal server error."

            });

        }

    }
);


// ======================================================
// GET MATERIALS FOR A LESSON
// GET /api/materials/lesson/:lessonId
// ======================================================

router.get(
    "/lesson/:lessonId",

    authenticateToken,

    async (req, res) => {

        try {

            const { lessonId } =
                req.params;


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


            const materials =
                await Promise.all(

                    result.rows.map(
                        async (material) => {

                            return {

                                ...material,

                                file_url:
                                    await createSignedUrl(
                                        material.file_name
                                    )

                            };

                        }
                    )

                );


            res.json({

                materials

            });


        } catch (error) {

            console.error(
                "Get lesson materials error:",
                error
            );


            res.status(500).json({

                message:
                    "Internal server error."

            });

        }

    }
);


// ======================================================
// DELETE MATERIAL
// DELETE /api/materials/:id
// ======================================================

router.delete(
    "/:id",

    authenticateToken,
    requireRole("teacher"),

    async (req, res) => {

        try {

            const { id } =
                req.params;


            // ==================================================
            // GET MATERIAL FIRST
            // ==================================================

            const materialResult =
                await pool.query(

                    `SELECT
                        id,
                        file_name

                     FROM course_materials

                     WHERE id = $1
                     AND uploaded_by = $2`,

                    [
                        id,
                        req.user.id
                    ]

                );


            if (
                materialResult.rows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Material not found."

                });

            }


            const material =
                materialResult.rows[0];


            // ==================================================
            // DELETE FROM SUPABASE STORAGE
            // ==================================================

            if (material.file_name) {

                const {
                    error: storageError
                } = await supabase

                    .storage

                    .from(BUCKET_NAME)

                    .remove([
                        material.file_name
                    ]);


                if (storageError) {

                    console.error(
                        "Supabase storage delete error:",
                        storageError
                    );

                    return res.status(500).json({

                        message:
                            "Failed to delete file from storage."

                    });

                }

            }


            // ==================================================
            // DELETE DATABASE RECORD
            // ==================================================

            await pool.query(

                `DELETE FROM course_materials
                 WHERE id = $1
                 AND uploaded_by = $2`,

                [
                    id,
                    req.user.id
                ]

            );


            res.json({

                message:
                    "Course material deleted successfully."

            });


        } catch (error) {

            console.error(
                "Delete course material error:",
                error
            );


            res.status(500).json({

                message:
                    "Internal server error."

            });

        }

    }
);


module.exports = router;