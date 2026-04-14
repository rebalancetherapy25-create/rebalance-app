import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models';
import jwt from 'jsonwebtoken';
import { clearAuthCookies, generateTokens, setAuthCookies } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';
import config from '../config/env';
import { sendEmail } from '../services/emailService';

const formatUser = (user: any) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otpCode;
            user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            await sendEmail({
                to: email,
                subject: 'Verify your Rebalance account',
                html: `<p>Your verification code is <strong>${otpCode}</strong>. It expires in 10 minutes.</p>`,
            });

            res.status(201).json({ message: 'User registered. Please verify OTP.', email: user.email });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User is already verified' });
        }

        if (user.otpCode !== otp || !user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpiry = undefined;

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        user.refreshToken = refreshToken;
        await user.save();

        setAuthCookies(res, accessToken, refreshToken);
        res.status(200).json(formatUser(user));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: email,
            subject: 'Your new verification code',
            html: `<p>Your verification code is <strong>${otpCode}</strong>. It expires in 10 minutes.</p>`,
        });

        res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            if (!user.isVerified) {
                return res.status(403).json({ error: 'Please verify your email to log in', unverified: true, email: user.email });
            }
            const { accessToken, refreshToken } = generateTokens(user._id, user.role);

            user.refreshToken = refreshToken;
            await user.save();

            setAuthCookies(res, accessToken, refreshToken);
            res.json(formatUser(user));
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            clearAuthCookies(res);
            return res.status(401).json({ error: 'Refresh token missing' });
        }

        const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== token) {
            clearAuthCookies(res);
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        user.refreshToken = refreshToken;
        await user.save();

        setAuthCookies(res, accessToken, refreshToken);
        res.status(200).json(formatUser(user));
    } catch {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Refresh token expired or invalid' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, email } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (email && email !== user.email) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
            user.email = email;
        }
        user.name = name || user.name;
        await user.save();

        res.status(200).json(formatUser(user));
    } catch {
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

export const updateMyPassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const user = await User.findById(userId);
        if (!user || !user.password) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch {
        res.status(500).json({ error: 'Server error updating password' });
    }
};

export const logoutUser = async (req: AuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
                await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshToken: 1 } });
            } catch {
                // Ignore invalid token during logout
            }
        } else if (req.user?.userId) {
            await User.findByIdAndUpdate(req.user.userId, { $unset: { refreshToken: 1 } });
        }

        clearAuthCookies(res);
        res.status(200).json({ message: 'User logged out' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
