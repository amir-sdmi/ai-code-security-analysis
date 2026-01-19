import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
import { User } from '../models/user.model.js';
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';
import { generateVerificationToken } from '../utils/generateVerificationToken.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from '../mailtrap/emails.js';
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error('All field are required');
    }
    const userAlreadyExist = await User.findOne({ email });
    // console.log('userAlreadyExist', userAlreadyExist);
    if (userAlreadyExist) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 100,
    });
    await user.save();
    // JWT Token
    generateTokenAndSetCookie(res, user._id);
    await sendVerificationEmail(user.email, verificationToken);
    res.status(201).json({
      success: true,
      message: 'User Created SUccessfully',
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
    await sendWelcomeEmail(user.email, user.name);
    res.status(200).json({
      success: true,
      message: 'Email valid successfully',
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {}
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'invalid credentials' });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ Success: false, message: 'Invalid credentials pw' });
    }
    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();
    const userResponse = { ...user._doc };
    delete userResponse.password; //Using ChatGpt to delete password before sending
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        userResponse,
      },
    });
  } catch (error) {
    console.log('Error in Login', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out Successfully' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found' });
    }

    //Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiredAt = resetTokenExpiresAt;

    await user.save();
    //Send Email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URI}/reset-password/${resetToken} `
    );
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.log('Error in forgotPassword', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiredAt: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired reset token' });
    }
    //update Password
    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiredAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);
    res
      .status(200)
      .json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log('Error in resetPassword', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log('Error in checkAuth', error);
    res.status(400).json({ success: false, ressage: error.message });
  }
};
