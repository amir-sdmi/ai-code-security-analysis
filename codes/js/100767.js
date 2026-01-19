// This code was assisted by ChatGPT, OpenAI.

const jwt = require("jsonwebtoken");

const prodCookieOptions = {
    httpOnly: true,   // Prevent JavaScript from accessing the cookie
    secure: true,     // Cookies sent only over https
    sameSite: "None", // Cross-site cookies are allowed
    maxAge: 1000 * 60 * 60  // 1 hour expiration
};

const devCookieOptions = {
    httpOnly: true, // Prevents JS access to the cookie
    secure: false, // Must be false for HTTP (localhost). If true, browser will block the cookie
    sameSite: "Lax", // Allows sending cookies on same-site navigation and Swagger UI form submissions
    maxAge: 1000 * 60 * 60
};

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token; // Token from cookies

        if (!token) {
            const error = new Error("Access denied, no token provided");
            error.status = 403;
            throw error;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to the request object
        next();  // Proceed to the next middleware or route handler
    } catch (err) {
        err.status = 401;
        next(err);
    }
};

const generateToken = (user) => {
    try {
        return jwt.sign(
            { email: user.email, role: user.role }, // signs with email and role
            process.env.JWT_SECRET, // signs with secret
            { expiresIn: "1h" } // Token expiration time (1 hour)
        );
    } catch (err) {
        throw err;
    }
};

const setTokenCookie = (res, token) => {
    try {
        const cookieOption = process.env.MODE === "production" ? prodCookieOptions : devCookieOptions;
        res.cookie("token", token, cookieOption);
    } catch (err) {
        throw err;
    }
};

module.exports = { verifyToken, generateToken, setTokenCookie };
