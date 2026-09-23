
const express = require("express");

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// CREATE COURSE - TEACHER ONLY
// POST /api/courses
// ==========================================

router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const { title, description } = req.body;

            if (!title || !title.trim()) {
                return res.status(400).json({
                    message: "Course title is required"
                });
            }

            const result = await pool.query(
                `INSERT INTO courses
                (title, description, teacher_id)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [
                    title.trim(),
                    description || null,
                    req.user.id
                ]
            );

            res.status(201).json({
                message: "Course created successfully",
                course: result.rows[0]
            });

        } catch (error) {

            console.error("Create course error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET MY COURSES - TEACHER ONLY
// GET /api/courses/my
// ==========================================

router.get(
    "/my",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT *
                 FROM courses
                 WHERE teacher_id = $1
                 ORDER BY created_at DESC`,
                [req.user.id]
            );

            res.json({
                courses: result.rows
            });

        } catch (error) {

            console.error("Get teacher courses error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// UPDATE COURSE - TEACHER ONLY
// PUT /api/courses/:id
// ==========================================

router.put(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const courseId = req.params.id;
            const { title, description } = req.body;

            if (!title || !title.trim()) {
                return res.status(400).json({
                    message: "Course title is required"
                });
            }

            const result = await pool.query(
                `UPDATE courses
                 SET title = $1,
                     description = $2
                 WHERE id = $3
                 AND teacher_id = $4
                 RETURNING *`,
                [
                    title.trim(),
                    description || null,
                    courseId,
                    req.user.id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Course not found or you do not have permission to edit it"
                });
            }

            res.json({
                message: "Course updated successfully",
                course: result.rows[0]
            });

        } catch (error) {

            console.error("Update course error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// DELETE COURSE - TEACHER ONLY
// DELETE /api/courses/:id
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    requireRole("teacher"),
    async (req, res) => {

        try {

            const courseId = req.params.id;

            const result = await pool.query(
                `DELETE FROM courses
                 WHERE id = $1
                 AND teacher_id = $2
                 RETURNING id`,
                [
                    courseId,
                    req.user.id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Course not found or you do not have permission to delete it"
                });
            }

            res.json({
                message: "Course deleted successfully"
            });

        } catch (error) {

            console.error("Delete course error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


// ==========================================
// GET ALL COURSES
// GET /api/courses
// ==========================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    courses.id,
                    courses.title,
                    courses.description,
                    courses.teacher_id,
                    courses.created_at,
                    users.full_name AS teacher_name
                 FROM courses
                 INNER JOIN users
                 ON courses.teacher_id = users.id
                 ORDER BY courses.created_at DESC`
            );

            res.json({
                courses: result.rows
            });

        } catch (error) {

            console.error("Get courses error:", error);

            res.status(500).json({
                message: "Internal server error"
            });

        }

    }
);


module.exports = router;

