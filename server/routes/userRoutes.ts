import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserRole,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from '../controllers/userController';
import { protect, admin } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/', protect, admin, getAllUsers);
router.put('/:id/role', protect, admin, updateUserRole);

// Brand new email validation and passcode recovery routes
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

export default router;
