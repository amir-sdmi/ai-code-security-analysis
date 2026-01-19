// This code was assisted by ChatGPT, OpenAI.

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /api/v1/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               user_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created
 */

/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

/**
 * @swagger
 * /api/v1/forgot-password:
 *   post:
 *     summary: Send reset link to user's email
 *     tags: [Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generates a temporary reset token and sends an email with the reset link. No authentication required.
 *       404:
 *         description: Account with provided email does not exist
 *       500:
 *         description: Server error while sending the reset email
 */

/**
 * @swagger
 * /api/v1/reset:
 *   post:
 *     summary: Reset user password using token
 *     tags: [Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input or token
 *       401:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Server error while resetting the password
 */

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: Send a message to the chatbot
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chatbot response and audio
 */

/**
 * @swagger
 * /api/v1/me:
 *   get:
 *     summary: Get current user details
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns user info
 */

/**
 * @swagger
 * /api/v1/get-all-users:
 *   get:
 *     summary: Get list of all users
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */

/**
 * @swagger
 * /api/v1/api-stats:
 *   get:
 *     summary: Get per-user API usage statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Per-user API usage
 */

/**
 * @swagger
 * /api/v1/endpoint-stats:
 *   get:
 *     summary: Get endpoint usage statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Per-endpoint usage
 */

/**
 * @swagger
 * /api/v1/update-api-calls:
 *   put:
 *     summary: Update API call limit for a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, api_calls_left]
 *             properties:
 *               email:
 *                 type: string
 *               api_calls_left:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated successfully
 */

/**
 * @swagger
 * /api/v1/update-role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Role updated
 */

/**
 * @swagger
 * /api/v1/delete-user:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
