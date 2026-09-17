const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// ========================================
// ADMIN ACCESS CHECK
// ========================================

function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
}


// ========================================
// GET ALL USERS
// ========================================

router.get(
    "/users",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    created_at
                FROM users
                ORDER BY created_at DESC
            `);

            res.json({
                users: result.rows
            });

        } catch (error) {

            console.error("Get all users error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// GET ALL TEACHERS
// ========================================

router.get(
    "/teachers",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    created_at
                FROM users
                WHERE role = 'teacher'
                ORDER BY full_name ASC
            `);

            res.json({
                teachers: result.rows
            });

        } catch (error) {

            console.error("Get teachers error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// GET ALL STUDENTS
// ========================================

router.get(
    "/students",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    created_at
                FROM users
                WHERE role = 'student'
                ORDER BY full_name ASC
            `);

            res.json({
                students: result.rows
            });

        } catch (error) {

            console.error("Get students error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// ACTIVATE / DEACTIVATE USER
// ========================================

router.put(
    "/users/:id/status",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const userId = req.params.id;
            const { status } = req.body;

            // Only these statuses are allowed
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be active or inactive"
                });
            }

            // Find the user
            const user = await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status
                FROM users
                WHERE id = $1
                `,
                [userId]
            );

            if (user.rows.length === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            // Prevent admin from deactivating themselves
            if (
                Number(userId) === Number(req.user.id) &&
                status === "inactive"
            ) {
                return res.status(400).json({
                    message: "You cannot deactivate your own account"
                });
            }

            const result = await pool.query(
                `
                UPDATE users
                SET status = $1
                WHERE id = $2
                RETURNING
                    id,
                    full_name,
                    email,
                    role,
                    status
                `,
                [status, userId]
            );

            res.json({
                message:
                    `User ${status === "active"
                        ? "activated"
                        : "deactivated"} successfully`,
                user: result.rows[0]
            });

        } catch (error) {

            console.error("Update user status error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// DELETE TEACHER
// ========================================

router.delete(
    "/teachers/:id",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const teacherId = req.params.id;

            // Find teacher
            const teacher = await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    role
                FROM users
                WHERE id = $1
                AND role = 'teacher'
                `,
                [teacherId]
            );

            if (teacher.rows.length === 0) {
                return res.status(404).json({
                    message: "Teacher not found"
                });
            }

            // Delete teacher
            await pool.query(
                `
                DELETE FROM users
                WHERE id = $1
                AND role = 'teacher'
                `,
                [teacherId]
            );

            res.json({
                message: "Teacher deleted successfully"
            });

        } catch (error) {

            console.error("Delete teacher error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// DELETE STUDENT
// ========================================

router.delete(
    "/students/:id",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const studentId = req.params.id;

            const student = await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    email,
                    role
                FROM users
                WHERE id = $1
                AND role = 'student'
                `,
                [studentId]
            );

            if (student.rows.length === 0) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            await pool.query(
                `
                DELETE FROM users
                WHERE id = $1
                AND role = 'student'
                `,
                [studentId]
            );

            res.json({
                message: "Student deleted successfully"
            });

        } catch (error) {

            console.error("Delete student error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);
// ========================================
// ADMIN DASHBOARD STATISTICS
// ========================================

router.get(
    "/stats",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    COUNT(*) AS total_users,

                    COUNT(*) FILTER (
                        WHERE role = 'teacher'
                    ) AS total_teachers,

                    COUNT(*) FILTER (
                        WHERE role = 'student'
                    ) AS total_students,

                    COUNT(*) FILTER (
                        WHERE status = 'active'
                    ) AS active_users,

                    COUNT(*) FILTER (
                        WHERE status = 'inactive'
                    ) AS inactive_users

                FROM users
            `);

            res.json({
                stats: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Get admin statistics error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


module.exports = router;