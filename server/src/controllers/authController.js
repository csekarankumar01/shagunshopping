import crypto from 'node:crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/mailer.js';

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  addresses: u.addresses || [],
  preferredPayment: u.preferredPayment || 'razorpay',
});

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

/** Generate a 6-digit OTP, store its hash on the user and email it. */
const issueOtp = async (user) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.otpHash = hashOtp(otp);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  await user.save();
  sendOtpEmail(user.email, user.name, otp); // fire and forget
};

// POST /api/auth/register — creates the account and emails an OTP
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists && exists.emailVerified) {
      return res.status(409).json({ message: 'That email is already registered' });
    }
    // Unverified leftover from an abandoned signup? Refresh it instead of blocking.
    if (exists) {
      exists.name = name;
      exists.password = password;
      exists.phone = phone || '';
      await issueOtp(exists);
      return res.status(200).json({ needsVerification: true, email: exists.email });
    }
    const user = await User.create({ name, email, password, phone });
    await issueOtp(user);
    res.status(201).json({ needsVerification: true, email: user.email });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp — confirms the code, verifies the email, logs in
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otpHash +otpExpires +otpAttempts');
    if (!user) return res.status(404).json({ message: 'No account found for that email' });
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified — please log in' });
    }
    if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired — tap Resend to get a new one' });
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many wrong attempts — tap Resend to get a new code' });
    }
    if (hashOtp(otp) !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'That code is incorrect — check and try again' });
    }

    user.emailVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    sendWelcomeEmail(user.email, user.name); // fire and forget
    const token = generateToken(user._id);
    res.json({ user: publicUser(user), token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otpHash +otpExpires +otpAttempts');
    if (!user) return res.status(404).json({ message: 'No account found for that email' });
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified — please log in' });
    }
    await issueOtp(user);
    res.json({ message: 'A new code is on its way to your inbox' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login — unverified accounts are sent a fresh OTP instead
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +otpHash +otpExpires +otpAttempts');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    if (!user.emailVerified) {
      await issueOtp(user);
      return res.json({ needsVerification: true, email: user.email });
    }
    const token = generateToken(user._id);
    res.json({ user: publicUser(user), token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
export const me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};

// PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.preferredPayment) user.preferredPayment = req.body.preferredPayment;
    if (req.body.password) {
      // Changing the password requires proving you know the current one
      const ok = await user.matchPassword(req.body.currentPassword || '');
      if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = req.body.password;
    }
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

/* ---------------- Saved addresses ---------------- */

const applyDefault = (user, makeDefaultId = null) => {
  if (makeDefaultId) {
    user.addresses.forEach((a) => { a.isDefault = a._id.toString() === makeDefaultId.toString(); });
  } else if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true; // always keep exactly one default
  }
};

// POST /api/auth/addresses
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { fullName, phone, line1, line2 = '', city, state, pincode, isDefault } = req.body;

    // Same street line + PIN already saved? Update it instead of duplicating.
    const existing = user.addresses.find(
      (a) => a.line1.trim().toLowerCase() === line1.trim().toLowerCase() && a.pincode === pincode
    );
    if (existing) {
      Object.assign(existing, { fullName, phone, line1, line2, city, state });
      if (isDefault) applyDefault(user, existing._id);
    } else {
      user.addresses.push({ fullName, phone, line1, line2, city, state, pincode });
      if (isDefault || user.addresses.length === 1) applyDefault(user, user.addresses[user.addresses.length - 1]._id);
    }
    applyDefault(user);
    await user.save();
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/addresses/:addressId
export const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    const { fullName, phone, line1, line2 = '', city, state, pincode, isDefault } = req.body;
    Object.assign(addr, { fullName, phone, line1, line2, city, state, pincode });
    if (isDefault) applyDefault(user, addr._id);
    applyDefault(user);
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/addresses/:addressId
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    addr.deleteOne();
    applyDefault(user);
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};
