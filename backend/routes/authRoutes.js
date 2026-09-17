
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const router = express.Router();


// ========================================
// REGISTER USER
// ========================================

router.post("/register", async (req, res) => {

    try {

        const {
            full_name,
            email,
            password,
            role
        } = req.body;


        // Check required fields
        if (!full_name || !email || !password) {

            return res.status(400).json({
                message:
                    "Full name, email and password are required"
            });
        }


        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );


        if (existingUser.rows.length > 0) {

            return res.status(400).json({
                message:
                    "Email already registered"
            });
        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user
        // status automatically becomes "active"
        // because of the database DEFAULT value

        const result = await pool.query(
            `INSERT INTO users
            (
                full_name,
                email,
                password,
                role
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                full_name,
                email,
                role,
                status,
                created_at`,
            [
                full_name,
                email,
                hashedPassword,
                role || "student"
            ]
        );


        res.status(201).json({

            message:
                "Registration successful",

            user:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            message:
                "Internal server error"
        });
    }
});


// ========================================
// LOGIN USER
// ========================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Check required fields
        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required"
            });
        }


        // Find user
        // status is included because we need
        // to check whether a student is active

        const result = await pool.query(
            `SELECT
                id,
                full_name,
                email,
                password,
                role,
                status,
                created_at
             FROM users
             WHERE email = $1`,
            [email]
        );


        if (result.rows.length === 0) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }


        const user = result.rows[0];


        // ========================================
        // CHECK PASSWORD
        // ========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }


        // ========================================
        // CHECK STUDENT ACCOUNT STATUS
        // ========================================

      // CHECK IF USER ACCOUNT IS DEACTIVATED
if (user.status === "inactive") {
    return res.status(403).json({
        message:
            "Your account has been deactivated. Please contact the administrator."
    });
}


        // ========================================
        // CREATE JWT
        // ========================================

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "2h"
            }
        );


        // ========================================
        // LOGIN RESPONSE
        // ========================================

        res.json({

            message:
                "Login successful",

            token,

            user: {

                id:
                    user.id,

                full_name:
                    user.full_name,

                email:
                    user.email,

                role:
                    user.role,

                status:
                    user.status
            }
        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message:
                "Internal server error"
        });
    }
});


module.exports = router;

