import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models';
import jwt from 'jsonwebtoken';
import { clearAuthCookies, generateTokens, setAuthCookies } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';
import config from '../config/env';
import { sendEmail } from '../services/emailService';
import { emailLayout, esc } from '../emails/templates/layout';

const formatUser = (user: any) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const createOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (email: string, otpCode: string, subject: string) => {
    const safeCode = esc(otpCode);

    return sendEmail({
        to: email,
        subject,
        html: emailLayout({
            title: 'Verify your email',
            preheader: `Your Rebalance verification code is ${otpCode}`,
            body: `
              <h1 class="h1">Confirm your email</h1>
              <p class="p">Use the 6-digit code below to finish setting up your Rebalance account.</p>
              <div class="code" style="font-size:28px;letter-spacing:0.35em;text-align:center">${safeCode}</div>
              <p class="p muted" style="margin-top:12px">This code expires in 10 minutes.</p>
            `,
        }),
    });
};

const buildPasswordResetUrl = (token: string) => {
    const resetUrl = new URL('/reset-password', config.frontendUrl);
    resetUrl.searchParams.set('token', token);
    return resetUrl.toString();
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const trimmedName = String(name).trim();
        const trimmedEmail = String(email).trim();
        const userExists = await User.findOne({ email: trimmedEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ error: 'User already exists' });
            }

            userExists.name = trimmedName;
            userExists.password = hashedPassword;
            userExists.otpCode = createOtpCode();
            userExists.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
            await userExists.save();

            const emailSent = await sendOtpEmail(userExists.email, userExists.otpCode, 'Verify your Rebalance account');
            if (!emailSent) {
                return res.status(502).json({ error: 'Unable to send the verification code right now. Please try again shortly.' });
            }

            return res.status(200).json({
                message: 'Your account already exists but is not verified. We sent a fresh verification code.',
                email: userExists.email,
            });
        }

        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            otpCode: createOtpCode(),
            otpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
        });

        const emailSent = await sendOtpEmail(user.email, user.otpCode ?? '', 'Verify your Rebalance account');
        if (!emailSent) {
            return res.status(502).json({ error: 'Unable to send the verification code right now. Please try again shortly.' });
        }

        res.status(201).json({ message: 'User registered. Please verify OTP.', email: user.email });
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

        const user = await User.findOne({ email: String(email).trim() });
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
        user.set({
            otpCode: undefined,
            otpExpiry: undefined,
        });

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

        const user = await User.findOne({ email: String(email).trim() });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

        const otpCode = createOtpCode();
        user.otpCode = otpCode;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
        await user.save();

        const emailSent = await sendOtpEmail(user.email, otpCode, 'Your new verification code');
        if (!emailSent) {
            return res.status(502).json({ error: 'Unable to resend the verification code right now. Please try again shortly.' });
        }

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

        const user = await User.findOne({ email: String(email).trim() });

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

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const trimmedEmail = String(email).trim();
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(200).json({ message: 'If an account exists for that email, a reset link has been sent.' });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), purpose: 'password-reset' },
            config.jwtRefreshSecret,
            { expiresIn: '1h' }
        );

        const resetUrl = buildPasswordResetUrl(token);
        const emailSent = await sendEmail({
            to: user.email,
            subject: 'Reset your Rebalance password',
            html: emailLayout({
                title: 'Reset your password',
                preheader: 'Use this secure link to set a new Rebalance password',
                body: `
                  <h1 class="h1">Reset your password</h1>
                  <p class="p">We received a request to reset your Rebalance password.</p>
                  <p class="p"><a class="btn" href="${esc(resetUrl)}">Create a new password</a></p>
                  <p class="p muted">This secure link expires in 1 hour.</p>
                  <p class="p muted">If the button doesn't work, copy this URL into your browser:</p>
                  <p class="p"><a href="${esc(resetUrl)}">${esc(resetUrl)}</a></p>
                `,
            }),
        });

        if (!emailSent) {
            return res.status(502).json({ error: 'Unable to send the reset email right now. Please try again shortly.' });
        }

        return res.status(200).json({ message: 'If an account exists for that email, a reset link has been sent.' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Reset token and new password are required' });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        let decoded: { userId: string; purpose?: string };
        try {
            decoded = jwt.verify(String(token), config.jwtRefreshSecret) as { userId: string; purpose?: string };
        } catch {
            return res.status(400).json({ error: 'Reset link is invalid or has expired' });
        }

        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({ error: 'Reset link is invalid or has expired' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.set('refreshToken', undefined);
        await user.save();

        clearAuthCookies(res);
        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
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

        const trimmedEmail = email ? String(email).trim() : undefined;

        if (trimmedEmail && trimmedEmail !== user.email) {
            const userExists = await User.findOne({ email: trimmedEmail });
            if (userExists) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
            user.email = trimmedEmail;
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
        if (String(newPassword).length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
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
