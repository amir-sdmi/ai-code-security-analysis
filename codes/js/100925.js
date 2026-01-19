// This code was assisted by ChatGPT, OpenAI.

const bcrypt = require("bcryptjs");
const { generateToken, setTokenCookie } = require("../utils/token");

// email format checker: user@domain.tld (no spaces, must contain @ and .)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthService {

    constructor(database) {
        this.db = database;
    }

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) throw new Error("Email and password are required");
            if (!emailRegex.test(email)) throw new Error("Invalid email format");

            const user = await this.db.getUser(email);
            if (!user) throw new Error("User not found");

            const match = await bcrypt.compare(password, user.password); // compares this password to hashed password
            if (!match) throw new Error("Invalid credentials");

            const token = generateToken(user);
            setTokenCookie(res, token);

            res.status(200).json({ message: "Login successful" });
        } catch (error) {
            next(error);
        }
    };

    signup = async (req, res, next) => {
        try {
            const { email, password, user_name } = req.body;

            if (!email || !password) throw new Error("Email and password are required");
            if (!emailRegex.test(email)) throw new Error("Invalid email format");

            const existingUser = await this.db.getUser(email);
            if (existingUser) throw new Error("User already exists");

            const saltRounds = Math.floor(Math.random() * 3) + 12; // randomized salt rounds
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);

            const role = "user";
            const apiCallsLeft = 20;

            const created = await this.db.writeUser(email, hashedPassword, role, apiCallsLeft, user_name);
            if (!created) throw new Error("Error creating user");

            const token = generateToken({ email, role });
            setTokenCookie(res, token);

            res.status(200).json({ message: "User created successfully" });
        } catch (error) {
            next(error);
        }
    };

    logout = (req, res) => {
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    };
}

module.exports = AuthService;
