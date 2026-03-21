const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect, authorize } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Only .jpeg, .jpg, and .png images are allowed!"));
  },
});

// @desc    Upload Proof of Delivery image
// @route   POST /api/upload/pod
// @access  Private (Agent)
router.post("/pod", protect, authorize("Agent", "Hub Manager", "Company Admin"), upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const mimeType = req.file.mimetype || "image/jpeg";
  const base64Image = req.file.buffer.toString("base64");
  const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

  res.json({
    message: "Image uploaded successfully",
    imageUrl: imageDataUrl,
  });
});

module.exports = router;
