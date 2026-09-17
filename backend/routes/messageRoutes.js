const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");


// ==========================================
// SEND MESSAGE
// ==========================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {
        try {
            const {
                receiver_id,
                subject,
                message
            } = req.body;

            if (!receiver_id || !message) {
                return res.status(400).json({
                    message: "Receiver and message are required"
                });
            }

            // Check that receiver exists
            const receiver = await pool.query(
                `SELECT id, full_name, email, role
                 FROM users
                 WHERE id = $1`,
                [receiver_id]
            );

            if (receiver.rows.length === 0) {
                return res.status(404).json({
                    message: "Receiver not found"
                });
            }

            // Prevent sending message to yourself
            if (Number(receiver_id) === Number(req.user.id)) {
                return res.status(400).json({
                    message: "You cannot send a message to yourself"
                });
            }

            const result = await pool.query(
                `INSERT INTO messages
                (
                    sender_id,
                    receiver_id,
                    subject,
                    message
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [
                    req.user.id,
                    receiver_id,
                    subject || null,
                    message
                ]
            );

            res.status(201).json({
                message: "Message sent successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Send message error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ==========================================
// GET RECEIVED MESSAGES
// ==========================================

router.get(
    "/inbox",
    authenticateToken,
    async (req, res) => {
        try {

            const result = await pool.query(
                `SELECT
                    messages.id,
                    messages.subject,
                    messages.message,
                    messages.is_read,
                    messages.created_at,

                    users.id AS sender_id,
                    users.full_name AS sender_name,
                    users.email AS sender_email,
                    users.role AS sender_role

                 FROM messages

                 INNER JOIN users
                    ON messages.sender_id = users.id

                 WHERE messages.receiver_id = $1

                 ORDER BY messages.created_at DESC`,
                [req.user.id]
            );

            res.json({
                messages: result.rows
            });

        } catch (error) {
            console.error("Get inbox error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ==========================================
// GET SENT MESSAGES
// ==========================================

router.get(
    "/sent",
    authenticateToken,
    async (req, res) => {
        try {

            const result = await pool.query(
                `SELECT
                    messages.id,
                    messages.subject,
                    messages.message,
                    messages.is_read,
                    messages.created_at,

                    users.id AS receiver_id,
                    users.full_name AS receiver_name,
                    users.email AS receiver_email,
                    users.role AS receiver_role

                 FROM messages

                 INNER JOIN users
                    ON messages.receiver_id = users.id

                 WHERE messages.sender_id = $1

                 ORDER BY messages.created_at DESC`,
                [req.user.id]
            );

            res.json({
                messages: result.rows
            });

        } catch (error) {
            console.error("Get sent messages error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ==========================================
// READ / OPEN MESSAGE
// ==========================================

router.get(
    "/:id",
    authenticateToken,
    async (req, res) => {
        try {

            const messageId = req.params.id;

            const result = await pool.query(
                `SELECT
                    messages.id,
                    messages.sender_id,
                    messages.receiver_id,
                    messages.subject,
                    messages.message,
                    messages.is_read,
                    messages.created_at,

                    sender.full_name AS sender_name,
                    sender.email AS sender_email,
                    sender.role AS sender_role,

                    receiver.full_name AS receiver_name,
                    receiver.email AS receiver_email,
                    receiver.role AS receiver_role

                 FROM messages

                 INNER JOIN users AS sender
                    ON messages.sender_id = sender.id

                 INNER JOIN users AS receiver
                    ON messages.receiver_id = receiver.id

                 WHERE messages.id = $1
                 AND (
                    messages.sender_id = $2
                    OR messages.receiver_id = $2
                 )`,
                [messageId, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Message not found"
                });
            }

            const message = result.rows[0];

            // Mark as read when receiver opens it
            if (
                Number(message.receiver_id) ===
                Number(req.user.id)
            ) {
                await pool.query(
                    `UPDATE messages
                     SET is_read = TRUE
                     WHERE id = $1`,
                    [messageId]
                );

                message.is_read = true;
            }

            res.json({
                message
            });

        } catch (error) {
            console.error("Get message error:", error);

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// ==========================================
// UNREAD MESSAGE COUNT
// ==========================================

router.get(
    "/unread/count",
    authenticateToken,
    async (req, res) => {
        try {

            const result = await pool.query(
                `SELECT COUNT(*) AS unread_count
                 FROM messages
                 WHERE receiver_id = $1
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
                "Get unread count error:",
                error
            );

            res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


module.exports = router;