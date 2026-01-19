// This code was assisted by ChatGPT, OpenAI.

const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

class ResetService {
    #tokenStorage = new Map(); // storage for tokens

    constructor(db) {
        this.db = db;
    }

    forgotPassword = async (req, res, next) => {
        try {
            const email = req.body.email;
            if (!email) throw new Error("Email is required");

            const user = await this.db.getUser(email);
            if (!user) throw new Error("User not found");

            const token = uuidv4();

            this.#tokenStorage.set(token, {
                email,
                expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 minutes
            });

            setTimeout(() => {
                this.#tokenStorage.delete(token);
            }, 5 * 60 * 1000); // deleted in 5 minutes

            await this.sendEmail(email, token);
            res.json({ message: "Password reset email sent" });
        } catch (err) {
            next(err);
        }
    };

    resetPassword = async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) throw new Error("Token and new password are required");

            // checks if token is expired or exists
            const stored = this.#tokenStorage.get(token);
            if (!stored || stored.expiresAt < Date.now()) {
                throw new Error("Invalid or expired token");
            }

            const user = await this.db.getUser(stored.email);
            if (!user) throw new Error("User not found");

            const saltRounds = Math.floor(Math.random() * 3) + 12;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashed = await bcrypt.hash(newPassword, salt);

            await this.db.updatePassword(stored.email, hashed);

            this.#tokenStorage.delete(token); // One-time use

            res.json({ message: "Password reset successful" });
        } catch (err) {
            next(err);
        }
    };

    sendEmail = async (email, token) => {
        const frontend = "https://comp-4537-term-project-frontend-three.vercel.app";
        const resetLink = `${frontend}/reset-password.html?token=${token}`;

        // email that sends users the link
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // email contents
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Password",
            text: `Reset your password using this link: ${resetLink}\n\nThis link will expire in 5 minutes.`,
        });
    }
}

module.exports = ResetService;
