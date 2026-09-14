import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

// Send OTP
export function requestOtp(req, res) {
  const { employeeId, email } = req.body;

  if (!employeeId && !email) {
    return res.status(400).json({
      success: false,
      error: 'Please provide either your Official Railway Employee ID or Email address.',
    });
  }

  // Find authorized employee
  const user = db.users.find(
    (u) =>
      (employeeId && u.employeeId.toUpperCase() === employeeId.trim().toUpperCase()) ||
      (email && u.email.toLowerCase() === email.trim().toLowerCase())
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Employee credential not found in Railway Personnel Registry. Access is strictly restricted to verified personnel.',
    });
  }

  // Generate 6-digit OTP (Default fixed OTP 849201 available for demo convenience, or random)
  const otp = '849201'; // Predictable demo OTP for seamless evaluation
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  db.otpStore.set(user.employeeId, { otp, expiresAt, user });

  // Record dispatch alert
  db.recordAlertDispatch(
    [user.phone, user.email],
    'SMS_GATEWAY',
    `RailSafe Alert: Your login OTP is ${otp}. Valid for 10 minutes. Do not share with unauthorized persons.`,
    'Normal'
  );

  // Mask sensitive info
  const maskedPhone = user.phone.replace(/(\+91 \d{2})\d{4}(\d{4})/, '$1 **** $2');
  const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return res.json({
    success: true,
    message: `Verification code sent to registered contact ${maskedPhone} and ${maskedEmail}`,
    data: {
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      division: user.division,
      maskedPhone,
      maskedEmail,
      demoOtpCode: otp, // Provided for convenience in demo mode
    },
  });
}

// Verify OTP and issue JWT
export function verifyOtp(req, res) {
  const { employeeId, otp } = req.body;

  if (!employeeId || !otp) {
    return res.status(400).json({ success: false, error: 'Employee ID and OTP are required.' });
  }

  const stored = db.otpStore.get(employeeId.trim().toUpperCase());

  if (!stored) {
    return res.status(400).json({ success: false, error: 'No OTP requested for this Employee ID or it has expired.' });
  }

  if (Date.now() > stored.expiresAt) {
    db.otpStore.delete(employeeId.trim().toUpperCase());
    return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
  }

  if (stored.otp !== otp.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid OTP code. Please check and try again.' });
  }

  const user = stored.user;
  db.otpStore.delete(employeeId.trim().toUpperCase());

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      division: user.division,
      stationCode: user.stationCode,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Record in audit log
  db.addAuditLog(
    user.employeeId,
    user.name,
    'USER_LOGIN_SUCCESS',
    `Authenticated as ${user.role} (${user.division}) via secure OTP verification.`,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    message: 'Authentication successful.',
    data: {
      token,
      user,
    },
  });
}

// Get current user profile
export function getMe(req, res) {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }
  return res.json({ success: true, data: user });
}

// Get demo users list
export function getDemoUsers(req, res) {
  return res.json({
    success: true,
    data: db.users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      division: u.division,
      stationCode: u.stationCode,
      avatar: u.avatar,
    })),
  });
}
