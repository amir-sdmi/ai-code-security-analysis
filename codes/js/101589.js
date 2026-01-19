// Developed with ChatGPT

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; 
import { verifyToken } from '@/utils/jwt';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method === 'PUT') {
        const { authorization } = req.headers;

        let userId;
        try {
            if (!authorization) {
                throw new Error('Token is missing');
            }

            const token = authorization.split(" ")[1]; // Get token from "Bearer <token>"
            const decodedToken = verifyToken(token); // Verify token
            
            if (!decodedToken) {
                throw new Error('Invalid token');
            }

            userId = decodedToken.userId; // Extract userId from the decoded token
        } catch (error) {
            console.error('Authorization error:', error.message);
            return res.status(401).json({ error: 'Unauthorized' }); // Return Unauthorized if no valid token
        }

        const { username, phone_number, password, avatar, first_name, last_name, email } = req.body;

        // General error checking (similar to signup.js)
        if (first_name && !first_name.trim()) {
            return res.status(400).json({ error: 'First name is required' });
        }
        if (last_name && !last_name.trim()) {
            return res.status(400).json({ error: 'Last name is required' });
        }
        if (username && !username.trim()) {
            return res.status(400).json({ error: 'Username is required' });
        }
        if (email && !email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (phone_number && !phone_number.trim()) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Phone number validation (only digits allowed)
        const phoneRegex = /^[0-9]+$/;
        if (phone_number && !phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: 'Phone number must contain only digits' });
        }

        // Avatar validation (similar to signup.js)
        if (avatar && !["/uploads/avatars/avatar1.png", "/uploads/avatars/avatar2.png", "/uploads/avatars/avatar3.png"].includes(avatar)) {
            return res.status(400).json({ error: 'You must select a valid avatar' });
        }

        // Password validation if password is being updated
        if (password && password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        try {
            // Prepare data for update
            const updateData = {};
            if (username) updateData.username = username;
            if (phone_number) updateData.phone_number = phone_number;
            if (avatar) updateData.avatar = avatar;
            if (first_name) updateData.first_name = first_name;
            if (last_name) updateData.last_name = last_name;
            if (email) updateData.email = email;
            if (password) updateData.password = await bcrypt.hash(password, 10); // Hash password if updated

            // Update the user in the database
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });

            // Return updated user data in the response
            const responseUser = {
                username: updatedUser.username,
                phone_number: updatedUser.phone_number,
                avatar: updatedUser.avatar,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
            };

            res.status(200).json({ message: 'User updated successfully', user: responseUser });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({ error: 'Error updating user' }); // Server error if update fails
        }
    } else if (req.method === 'GET') {
        const { authorization } = req.headers;

        let userId;
        try {
            if (!authorization) {
                throw new Error('Token is missing');
            }

            const token = authorization.split(" ")[1]; // Get token from "Bearer <token>"
            const decodedToken = verifyToken(token); // Verify token
            
            if (!decodedToken) {
                throw new Error('Invalid token');
            }

            userId = decodedToken.userId; // Extract userId from the decoded token
        } catch (error) {
            console.error('Authorization error:', error.message);
            return res.status(401).json({ error: 'Unauthorized' }); // Return Unauthorized if no valid token
        }

        try {
            // Fetch user data from the database
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    first_name: true,
                    last_name: true,
                    username: true,
                    email: true,
                    phone_number: true,
                    avatar: true,
                    is_admin: true,
                },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' }); // User not found
            }

            res.status(200).json({ user }); // Return user data
        } catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Error fetching user data' }); // Server error if fetching fails
        }
    } else {
        res.setHeader('Allow', ['PUT', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`); // Return method not allowed for unsupported HTTP methods
    }
}
