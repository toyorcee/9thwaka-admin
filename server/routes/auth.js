import express from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  loginWithPin,
  register,
  removePin,
  resendVerification,
  resetPassword,
  setPin,
  verifyEmail,
  verifyResetCode,
  changePassword,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login-with-pin", loginWithPin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/verify", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgotpassword", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.put("/resetpassword/:resettoken", resetPassword);

// Protected routes (require authentication)
router.get("/me", protect, getCurrentUser);
router.post("/set-pin", protect, setPin);
router.delete("/remove-pin", protect, removePin);
router.put("/change-password", protect, changePassword);

export default router;
