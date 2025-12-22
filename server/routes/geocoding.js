import express from "express";
import {
  calculateAddressDistance,
  geocodeSingleAddress,
  getMapboxToken,
  getSuggestions,
  reverseGeocodeCoordinates,
} from "../controllers/geocodingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/mapbox-token", getMapboxToken);

// All other routes require authentication
router.use(protect);

// Get address suggestions
router.get("/suggestions", getSuggestions);

// Geocode single address
router.post("/geocode", geocodeSingleAddress);

// Reverse geocode coordinates
router.get("/reverse", reverseGeocodeCoordinates);

// Calculate distance
router.post("/distance", calculateAddressDistance);

export default router;
