const express = require("express");
const router = express.Router();

const {
  getPropertyReviews,
  getMyReviews,
  createReview
} = require("../controllers/reviewController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

// Public: view approved property's reviews
router.get(
  "/properties/:id/reviews",
  getPropertyReviews
);

// Customer: view reviews they submitted
router.get(
  "/reviews/mine",
  authenticate,
  authorize("customer"),
  getMyReviews
);

// Customer: submit a review for an eligible booking
router.post(
  "/reviews",
  authenticate,
  authorize("customer"),
  createReview
);

module.exports = router;
