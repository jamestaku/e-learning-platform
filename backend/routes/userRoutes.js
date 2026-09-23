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

// ========================================
// TEACHER ACCESS CHECK
// ========================================

const requireTeacher = (req, res, next) => {


if (req.user.role !== "teacher") {

    return res.status(403).json({
        message: "Teacher access required"
    });
}

next();


};

// ========================================
// PROTECTED PROFILE
// ========================================

router.get(
"/profile",
authenticateToken,
async (req, res) => {


    res.json({
        message: "You accessed a protected endpoint",
        user: req.user
    });

}


);

// ========================================
// GET ALL TEACHERS
// ========================================

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

        console.error(
            "Get teachers error:",
            error
        );

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


);

// ========================================
// GET TEACHER'S STUDENTS
// ========================================
//
// A teacher can ONLY see students enrolled
// in courses belonging to that teacher.
//
// ========================================

router.get(
"/students",
authenticateToken,
requireTeacher,
async (req, res) => {


    try {

        const teacherId = req.user.id;

        const result = await pool.query(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.status,
                u.created_at,

                STRING_AGG(
                    DISTINCT c.title,
                    ', '
                    ORDER BY c.title
                ) AS courses

             FROM users u

             INNER JOIN enrollments e
                ON e.student_id = u.id

             INNER JOIN courses c
                ON c.id = e.course_id

             WHERE u.role = 'student'
             AND c.teacher_id = $1

             GROUP BY
                u.id,
                u.full_name,
                u.email,
                u.status,
                u.created_at

             ORDER BY u.full_name ASC`,
            [teacherId]
        );

        res.json({
            students: result.rows
        });

    } catch (error) {

        console.error(
            "Get teacher students error:",
            error
        );

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


);

// ========================================
// CHECK WHETHER STUDENT BELONGS
// TO LOGGED-IN TEACHER
// ========================================

const verifyTeacherStudent = async (
teacherId,
studentId
) => {


const result = await pool.query(
    `SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.status

     FROM users u

     INNER JOIN enrollments e
        ON e.student_id = u.id

     INNER JOIN courses c
        ON c.id = e.course_id

     WHERE u.id = $1
     AND u.role = 'student'
     AND c.teacher_id = $2

     LIMIT 1`,
    [
        studentId,
        teacherId
    ]
);

return result.rows.length > 0;


};

// ========================================
// ACTIVATE / DEACTIVATE STUDENT
// ========================================
//
// Teacher can only change the status of a
// student enrolled in one of their courses.
//
// ========================================

router.put(
"/students/:id/status",
authenticateToken,
requireTeacher,
async (req, res) => {


    try {

        const studentId = req.params.id;
        const teacherId = req.user.id;

        const { status } = req.body;


        // Check allowed statuses

        if (
            !["active", "inactive"].includes(status)
        ) {

            return res.status(400).json({
                message:
                    "Status must be active or inactive"
            });
        }


        // Check whether student belongs
        // to this teacher

        const belongsToTeacher =
            await verifyTeacherStudent(
                teacherId,
                studentId
            );


        if (!belongsToTeacher) {

            return res.status(403).json({
                message:
                    "You can only manage students enrolled in your courses"
            });
        }


        // Update student status

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
            [
                status,
                studentId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Student not found"
            });
        }


        res.json({

            message:
                `Student ${
                    status === "active"
                        ? "activated"
                        : "deactivated"
                } successfully`,

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
//
// Teacher can only delete a student who is
// enrolled in one of their courses.
//
// ========================================

router.delete(
"/students/:id",
authenticateToken,
requireTeacher,
async (req, res) => {


    try {

        const studentId = req.params.id;
        const teacherId = req.user.id;


        // Check whether student belongs
        // to this teacher

        const belongsToTeacher =
            await verifyTeacherStudent(
                teacherId,
                studentId
            );


        if (!belongsToTeacher) {

            return res.status(403).json({
                message:
                    "You can only delete students enrolled in your courses"
            });
        }


        // Make sure student exists

        const student = await pool.query(
            `SELECT
                id,
                full_name,
                email

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


        // Delete student

        await pool.query(
            `DELETE FROM users
             WHERE id = $1
             AND role = 'student'`,
            [studentId]
        );


        res.json({
            message:
                "Student deleted successfully"
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


        if (
            newPassword !== confirmPassword
        ) {

            return res.status(400).json({
                message:
                    "New passwords do not match"
            });
        }


        if (newPassword.length < 8) {

            return res.status(400).json({
                message:
                    "New password must be at least 8 characters long"
            });
        }


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


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


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


        if (
            !["active", "inactive"].includes(status)
        ) {

            return res.status(400).json({
                message:
                    "Status must be active or inactive"
            });
        }


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
                `User ${
                    status === "active"
                        ? "activated"
                        : "deactivated"
                } successfully`,

            user: result.rows[0]

        });

    } catch (error) {

        console.error(
            "Admin update user status error:",
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
// ADMIN - DELETE USER
// ========================================

router.delete(
"/admin/:id",
authenticateToken,
requireAdmin,
async (req, res) => {


    try {

        const userId = req.params.id;


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
            message:
                "Internal server error"
        });
    }
}


);

module.exports = router;
