import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Wishlist } from '../models/Wishlist';
import { APIError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/sendEmail';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_high_density_token_key';

function generateToken(id: string): string {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
}

// @desc    Register a new boutique user with email verification hook
// @route   POST /api/users/register
// @access  Public
export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { name, email, password, role, adminSecretCode } = req.body;

  try {
    if (role === 'admin') {
      const requiredSecret = process.env.ADMIN_SECRET;
      if (!requiredSecret || adminSecretCode !== requiredSecret) {
        next(new APIError('Invalid admin code', 403));
        return;
      }
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      next(new APIError('User email address is already registered', 400));
      return;
    }

    // Create user
    const user = new User({ name, email: cleanEmail, password, role: role === 'admin' ? 'admin' : 'user' });
    
    // Generate email verification PIN (6 digits)
    const verificationPin = (user as any).getEmailVerificationToken();
    
    await user.save();

    // Pre-create an empty wishlist for the new user
    await Wishlist.create({ user: user._id, products: [] });

    // Send verification email
    const subject = 'Verifying your MORVEX account';
    const message = `Welcome to MORVEX, ${name}!\n\nTo verify your email address, please write down or enter the following 6-digit confirmation code in our application:\n\n👉 ${verificationPin}\n\nThis verification code expires in 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #111; text-align: center;">Welcome to MORVEX</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. You are just one step away from completing your registration.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <small style="color: #666; text-transform: uppercase; letter-spacing: 1px;">Verification Code</small>
          <h1 style="margin: 5px 0 0 0; color: #000; letter-spacing: 5px; font-size: 32px;">${verificationPin}</h1>
        </div>
        <p>Please enter this code on the verification screen to activate your account. This code expires in 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999; text-align: center;">MORVEX Inc. • Architectural Designs & Curated Lifestyle Products</p>
      </div>
    `;

    const realEmailSent = await sendEmail({ email, subject, message, html });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please verify your email with the 6-digit code.',
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Authenticate user & check token / verification state
// @route   POST /api/users/login
// @access  Public
export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email, password } = req.body;

  try {
    const loginIdentifier = String(email).toLowerCase().trim();
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    }).select('+password');
    if (!user) {
      next(new APIError('Invalid credentials or password', 401));
      return;
    }

    const isMatch = await (user as any).matchPassword(password);
    if (!isMatch) {
      next(new APIError('Invalid credentials or password', 401));
      return;
    }

    res.json({
      success: true,
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get user profile data
// @route   GET /api/users/profile
// @access  Private
export async function getUserProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      next(new APIError('User profile details not found', 404));
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Verify user email with active token PIN
// @route   POST /api/users/verify
// @access  Public/Auth
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email, code } = req.body;

  if (!email || !code) {
    next(new APIError('Please provide both email and 6-digit verification code', 400));
    return;
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      verificationToken: code,
      verificationExpire: { $gt: new Date() },
    });

    if (!user) {
      next(new APIError('Invalid or expired email verification code', 400));
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email address verified and activated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Resend registration email verification code
// @route   POST /api/users/resend-verification
// @access  Public
export async function resendVerificationCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    next(new APIError('Please provide an email address', 400));
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      next(new APIError('No user account matches this email', 400));
      return;
    }

    if (user.isVerified) {
      res.json({
        success: true,
        message: 'This email is already verified and active.',
        isVerified: true,
      });
      return;
    }

    const verificationPin = (user as any).getEmailVerificationToken();
    await user.save();

    const subject = 'Your MORVEX email verification pin';
    const message = `Hello ${user.name},\n\nPlease use the following 6-digit confirmation code to verify your email address:\n\n👉 ${verificationPin}\n\nThis verification code expires in 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #111; text-align: center;">Confirm Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a new verification pin for your MORVEX account.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <small style="color: #666; text-transform: uppercase; letter-spacing: 1px;">Verification Code</small>
          <h1 style="margin: 5px 0 0 0; color: #000; letter-spacing: 5px; font-size: 32px;">${verificationPin}</h1>
        </div>
        <p>Enter this code on the verification screen to activate your account. This code expires in 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999; text-align: center;">MORVEX Inc. • Architectural Designs & Curated Lifestyle Products</p>
      </div>
    `;

    await sendEmail({ email: user.email, subject, message, html });

    res.json({
      success: true,
      message: 'New verification PIN code sent, please check your mailbox.',
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Initiate account recovery / Forgot Password password request
// @route   POST /api/users/forgotpassword
// @access  Public
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    next(new APIError('Please provide email address', 400));
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      next(new APIError('No user account matches this email', 404));
      return;
    }

    const resetPin = (user as any).getResetPasswordToken();
    await user.save();

    const subject = 'Your MORVEX password reset pin';
    const message = `Hello ${user.name},\n\nYou requested a password reset. Please enter the following 6-digit reset code inside the application to verify and set a new password:\n\n👉 ${resetPin}\n\nThis reset code expires in 10 minutes. If you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #111; text-align: center;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your MORVEX login password. Use the following security code to perform the recovery action:</p>
        <div style="background-color: #fce8e6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <small style="color: #b71c1c; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Password Reset Security Code</small>
          <h1 style="margin: 5px 0 0 0; color: #b71c1c; letter-spacing: 5px; font-size: 32px;">${resetPin}</h1>
        </div>
        <p>Please enter this code on the reset password screen to update your password. This security pin expires in 10 minutes.</p>
        <p style="color: #cd0000; font-size: 13px;">If you did not initiate this request, you can safely ignore this email. Your pass is protected.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999; text-align: center;">MORVEX Inc. • Architectural Designs & Curated Lifestyle Products</p>
      </div>
    `;

    await sendEmail({ email: user.email, subject, message, html });

    res.json({
      success: true,
      message: 'Password reset instructions have been emailed.',
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Verify pin token and update account password
// @route   POST /api/users/resetpassword
// @access  Public
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    next(new APIError('Missing code, email, or new password parameters', 400));
    return;
  }

  if (newPassword.length < 6) {
    next(new APIError('New password must be at least 6 characters long', 400));
    return;
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: code,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      next(new APIError('Invalid or expired password reset PIN logic', 400));
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Auto-verify if they can prove ownership of their account through forgot password recovery flow
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset completed successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get all users list
// @route   GET /api/users
// @access  Private/Admin
export async function getAllUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update user details / Roles
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export async function updateUserRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    next(new APIError('Invalid role setting value', 400));
    return;
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      next(new APIError('User account not found', 404));
      return;
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role successfully elevated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get Google OAuth URL
// @route   GET /api/users/google/url
// @access  Public
export function getGoogleAuthUrl(req: Request, res: Response) {
  const origin = req.query.origin as string;
  const appUrl = origin || process.env.APP_URL || `https://${req.get('host')}`;
  const redirectUri = `${appUrl}/api/users/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    res.status(500).json({ message: 'Google Client ID is not configured on the server.' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'offline',
    prompt: 'consent',
    state: appUrl // Pass appUrl in state to know where to redirect back
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.json({ url: authUrl });
}

// @desc    Handle Google OAuth callback
// @route   GET /api/users/google/callback
// @access  Public
export async function googleAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query;

  if (!code) {
    res.send(`<html><body><script>window.close();</script></body></html>`);
    return;
  }

  try {
    const appUrl = (state as string) || process.env.APP_URL || `https://${req.get('host')}`;
    const redirectUri = `${appUrl}/api/users/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured on the server.');
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errTxt = await tokenRes.text();
      console.error('Google token exchange error:', errTxt);
      throw new Error('Failed to exchange code for Google token');
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userRes.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const profile = await userRes.json();
    const { id: googleId, email, name, picture: avatar, verified_email } = profile;

    const emailStr = email.toLowerCase().trim();

    // Handle user login / creation
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: emailStr }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        name,
        email: emailStr,
        googleId,
        avatar,
        isVerified: verified_email || true,
        // Using a random long password since it's an OAuth account,
        // model password shouldn't be strictly required but just in case
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
      });
      await user.save();
      await Wishlist.create({ user: user._id, products: [] });
    } else {
      // Update Google ID and Avatar if missing
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = verified_email || true;
        updated = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken(user._id.toString());
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    };

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                payload: { user: ${JSON.stringify(userData)}, token: '${token}' } 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', payload: '${error.message || 'OAuth failure'}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Failed to authenticate with Google. This window will close shortly.</p>
        </body>
      </html>
    `);
  }
}

