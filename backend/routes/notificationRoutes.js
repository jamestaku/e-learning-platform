const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");


// ========================================
// GET MY NOTIFICATIONS
// ========================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    id,
                    title,
                    message,
                    type,
                    is_read,
                    created_at
                 FROM notifications
                 WHERE user_id = $1
                 ORDER BY created_at DESC`,
                [req.user.id]
            );

            res.json({
                notifications: result.rows
            });

        } catch (error) {

            console.error(
                "Get notifications error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// GET UNREAD NOTIFICATION COUNT
// ========================================

router.get(
    "/unread/count",
    authenticateToken,
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT COUNT(*) AS unread_count
                 FROM notifications
                 WHERE user_id = $1
                 AND is_read = FALSE`,
                [req.user.id]
            );

            res.json({
                unread_count: Number(
                    result.rows[0].unread_count
                )
            });

        } catch (error) {

            console.error(
                "Get unread notification count error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// CREATE NOTIFICATION
// ========================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                user_id,
                title,
                message,
                type
            } = req.body;


            if (!user_id || !title || !message) {

                return res.status(400).json({
                    message:
                        "User, title and message are required"
                });
            }


            const result = await pool.query(
                `INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    type
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [
                    user_id,
                    title,
                    message,
                    type || "general"
                ]
            );


            res.status(201).json({
                message:
                    "Notification created successfully",
                notification:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Create notification error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

router.put(
    "/:id/read",
    authenticateToken,
    async (req, res) => {

        try {

            const notificationId =
                req.params.id;


            const result = await pool.query(
                `UPDATE notifications
                 SET is_read = TRUE
                 WHERE id = $1
                 AND user_id = $2
                 RETURNING *`,
                [
                    notificationId,
                    req.user.id
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    message:
                        "Notification not found"
                });
            }


            res.json({
                message:
                    "Notification marked as read",
                notification:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Mark notification read error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

router.put(
    "/read-all",
    authenticateToken,
    async (req, res) => {

        try {

            await pool.query(
                `UPDATE notifications
                 SET is_read = TRUE
                 WHERE user_id = $1
                 AND is_read = FALSE`,
                [req.user.id]
            );


            res.json({
                message:
                    "All notifications marked as read"
            });

        } catch (error) {

            console.error(
                "Mark all notifications read error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


module.exports = router;