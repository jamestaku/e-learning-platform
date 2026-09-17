const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
// ========================================
// ADMIN ACCESS CHECK
// ========================================

const requireAdmin = (req, res, next) => {

    if (req.user.role !== "admin") {

        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
};


// Protected profile
router.get("/profile", authenticateToken, async (req, res) => {

    res.json({
        message: "You accessed a protected endpoint",
        user: req.user
    });

});
// Get all teachers
router.get(
    "/teachers",
    authenticateToken,
    async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
                    id,
                    full_name,
                    email
                 FROM users
                 WHERE role = 'teacher'
                 AND id != $1
                 ORDER BY full_name ASC`,
                [req.user.id]
            );

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
    async (req, res) => {
        try {

            // Only teachers can manage students
            if (req.user.role !== "teacher") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const result = await pool.query(
                `SELECT
                    id,
                    full_name,
                    email,
                    status,
                    created_at
                 FROM users
                 WHERE role = 'student'
                 ORDER BY full_name ASC`
            );

            res.json({
                students: result.rows
            });

        } catch (error) {

            console.error(
                "Get students error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// ACTIVATE / DEACTIVATE STUDENT
// ========================================

router.put(
    "/students/:id/status",
    authenticateToken,
    async (req, res) => {
        try {

            // Only teachers can change student status
            if (req.user.role !== "teacher") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const studentId = req.params.id;
            const { status } = req.body;

            // Only these two statuses are allowed
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    message:
                        "Status must be active or inactive"
                });
            }

            // Make sure the account belongs to a student
            const student = await pool.query(
                `SELECT id, full_name, email, role, status
                 FROM users
                 WHERE id = $1
                 AND role = 'student'`,
                [studentId]
            );

            if (student.rows.length === 0) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            const result = await pool.query(
                `UPDATE users
                 SET status = $1
                 WHERE id = $2
                 AND role = 'student'
                 RETURNING
                    id,
                    full_name,
                    email,
                    role,
                    status`,
                [status, studentId]
            );

            res.json({
                message:
                    `Student ${status === "active"
                        ? "activated"
                        : "deactivated"} successfully`,
                student: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Update student status error:",
                error
            );

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
    async (req, res) => {
        try {

            // Only teachers can delete students
            if (req.user.role !== "teacher") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const studentId = req.params.id;

            // Make sure the account belongs to a student
            const student = await pool.query(
                `SELECT id, full_name, email
                 FROM users
                 WHERE id = $1
                 AND role = 'student'`,
                [studentId]
            );

            if (student.rows.length === 0) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            await pool.query(
                `DELETE FROM users
                 WHERE id = $1
                 AND role = 'student'`,
                [studentId]
            );

            res.json({
                message: "Student deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete student error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);
// ========================================
// CHANGE PASSWORD
// ========================================

router.put(
    "/change-password",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;


            // Check required fields
            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                return res.status(400).json({
                    message:
                        "All password fields are required"
                });
            }


            // Check password confirmation
            if (newPassword !== confirmPassword) {

                return res.status(400).json({
                    message:
                        "New passwords do not match"
                });
            }


            // Password length
            if (newPassword.length < 8) {

                return res.status(400).json({
                    message:
                        "New password must be at least 8 characters long"
                });
            }


            // Get current user's password
            const result = await pool.query(
                `SELECT password
                 FROM users
                 WHERE id = $1`,
                [req.user.id]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    message:
                        "User not found"
                });
            }


            const user = result.rows[0];


            // Verify current password
            const passwordMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (!passwordMatch) {

                return res.status(401).json({
                    message:
                        "Current password is incorrect"
                });
            }


            // Prevent using the same password
            const samePassword =
                await bcrypt.compare(
                    newPassword,
                    user.password
                );


            if (samePassword) {

                return res.status(400).json({
                    message:
                        "New password must be different from your current password"
                });
            }


            // Hash new password
            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            // Update password
            await pool.query(
                `UPDATE users
                 SET password = $1
                 WHERE id = $2`,
                [
                    hashedPassword,
                    req.user.id
                ]
            );


            res.json({
                message:
                    "Password changed successfully"
            });


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );

            res.status(500).json({
                message:
                    "Internal server error"
            });
        }
    }
);
// ========================================
// ADMIN - GET ALL USERS
// ========================================

router.get(
    "/admin/all",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    created_at
                 FROM users
                 WHERE role IN ('teacher', 'student')
                 ORDER BY created_at DESC`
            );

            res.json({
                users: result.rows
            });

        } catch (error) {

            console.error(
                "Admin get users error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);
// ========================================
// ADMIN - UPDATE USER STATUS
// ========================================

router.put(
    "/admin/:id/status",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const userId = req.params.id;
            const { status } = req.body;

            // Only these statuses are allowed
            if (!["active", "inactive"].includes(status)) {

                return res.status(400).json({
                    message:
                        "Status must be active or inactive"
                });
            }

            // Make sure the account is a teacher or student
            const user = await pool.query(
                `SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status
                 FROM users
                 WHERE id = $1
                 AND role IN ('teacher', 'student')`,
                [userId]
            );

            if (user.rows.length === 0) {

                return res.status(404).json({
                    message:
                        "Teacher or student not found"
                });
            }

            const result = await pool.query(
                `UPDATE users
                 SET status = $1
                 WHERE id = $2
                 AND role IN ('teacher', 'student')
                 RETURNING
                    id,
                    full_name,
                    email,
                    role,
                    status`,
                [
                    status,
                    userId
                ]
            );

            res.json({
                message:
                    `User ${status === "active"
                        ? "activated"
                        : "deactivated"} successfully`,

                user: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Admin update user status error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);
// ========================================
// ADMIN - DELETE USER
// ========================================

router.delete(
    "/admin/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {

        try {

            const userId = req.params.id;

            // Make sure the account is a teacher or student
            const user = await pool.query(
                `SELECT
                    id,
                    full_name,
                    email,
                    role
                 FROM users
                 WHERE id = $1
                 AND role IN ('teacher', 'student')`,
                [userId]
            );

            if (user.rows.length === 0) {

                return res.status(404).json({
                    message:
                        "Teacher or student not found"
                });
            }

            await pool.query(
                `DELETE FROM users
                 WHERE id = $1
                 AND role IN ('teacher', 'student')`,
                [userId]
            );

            res.json({
                message:
                    "User deleted successfully"
            });

        } catch (error) {

            console.error(
                "Admin delete user error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);
module.exports = router;