// ─────────────────────────────────────────────────────────────────
// Jeeshu AI — Express Backend (server.js)
//
// This file:
//   1. Serves the frontend HTML/CSS/JS files
//   2. Accepts image generation requests from the browser
//   3. Calls the Reve AI API using the SECRET key (never sent to browser)
//   4. Returns the generated image back to the browser
// ─────────────────────────────────────────────────────────────────

// Load environment variables from .env file FIRST
require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const axios    = require("axios");
const FormData = require("form-data");
const path     = require("path");
const fs       = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());                            // Allow requests from frontend
app.use(express.json());                    // Parse JSON request bodies
app.use(express.static("public"));         // Serve files in /public folder

// ── Multer: handle uploaded images ─────────────────────────────
// Files are stored temporarily in /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Create folder if missing
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Give file a unique name so multiple users don't clash
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ── POST /generate-image ────────────────────────────────────────
// This is the main endpoint the frontend calls.
// It accepts:
//   - prompt        (text, required)
//   - aspectRatio   (text, e.g. "1:1")
//   - count         (number, 1/2/4)
//   - image         (file, optional reference image)
//
// It calls the Reve AI API and returns generated image URLs.

app.post("/generate-image", upload.single("image"), async (req, res) => {
  try {
    // Step 1: Read the API key from environment (NEVER from frontend)
    const apiKey = process.env.REVE_API_KEY;
    if (!apiKey || apiKey === "your_reve_api_key_here") {
      return res.status(500).json({
        error: "API key not configured. Please set REVE_API_KEY in your .env file.",
      });
    }

    // Step 2: Get parameters from the request
    const prompt      = req.body.prompt || "A beautiful image";
    const aspectRatio = req.body.aspectRatio || "1:1";
    const count       = parseInt(req.body.count) || 1;

    // Step 3: Map aspect ratio string to width/height pixels
    const sizeMap = {
      "Auto" : { width: 1024, height: 1024 },
      "1:1"  : { width: 1024, height: 1024 },
      "16:9" : { width: 1344, height: 768  },
      "9:16" : { width: 768,  height: 1344 },
      "4:3"  : { width: 1152, height: 896  },
      "3:2"  : { width: 1216, height: 832  },
      "2:3"  : { width: 832,  height: 1216 },
      "3:4"  : { width: 896,  height: 1152 },
    };
    const size = sizeMap[aspectRatio] || sizeMap["1:1"];

    // Step 4: Build the request payload for Reve AI
    // Reve AI uses a standard image generation API format
    const payload = {
      prompt:           prompt,
      width:            size.width,
      height:           size.height,
      num_images:       count,
      output_format:    "jpeg",
      safety_tolerance: 2,
    };

    // Step 5: If user uploaded a reference image, attach it
    let requestData;
    let headers = {
      "Authorization": `Bearer ${apiKey}`,
    };

    if (req.file) {
      // Use multipart/form-data when there's an image
      const form = new FormData();
      form.append("prompt",        payload.prompt);
      form.append("width",         String(payload.width));
      form.append("height",        String(payload.height));
      form.append("num_images",    String(payload.num_images));
      form.append("output_format", payload.output_format);
      form.append("init_image",    fs.createReadStream(req.file.path), req.file.originalname);

      requestData = form;
      headers = { ...headers, ...form.getHeaders() };
    } else {
      // Use JSON when there's no image
      requestData = payload;
      headers["Content-Type"] = "application/json";
    }

    // Step 6: Call the Reve AI API
    // IMPORTANT: The API key is used HERE on the server — never in the browser
    const response = await axios.post(
      "https://api.reve.art/v1/images/generations",
      requestData,
      { headers, timeout: 120000 } // 2-minute timeout for image generation
    );

    // Step 7: Clean up the uploaded file after use
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Step 8: Extract image URLs from the Reve AI response
    // Reve returns: { data: [ { url: "..." }, { url: "..." } ] }
    const images = response.data.data || response.data.images || [];
    const imageUrls = images.map((img) => img.url || img.b64_json || "");

    // Step 9: Send URLs back to the frontend
    res.json({
      success: true,
      images:  imageUrls,
      prompt:  prompt,
    });

  } catch (error) {
    // Clean up uploaded file even if something went wrong
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Friendly error messages
    if (error.response) {
      // Reve API returned an error
      const status  = error.response.status;
      const message = error.response.data?.error?.message
                   || error.response.data?.message
                   || "API error";

      if (status === 401) return res.status(401).json({ error: "Invalid API key. Check your REVE_API_KEY." });
      if (status === 429) return res.status(429).json({ error: "Rate limit reached. Please wait and try again." });
      if (status === 402) return res.status(402).json({ error: "API credits exhausted. Add credits at reve.art." });

      return res.status(status).json({ error: message });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request timed out. Try again." });
    }

    console.error("Server error:", error.message);
    res.status(500).json({ error: "Something went wrong. Check server logs." });
  }
});

// ── Health check ────────────────────────────────────────────────
// Useful for Vercel and debugging: visit /health in browser
app.get("/health", (req, res) => {
  res.json({
    status:    "OK",
    app:       "Jeeshu AI",
    keyLoaded: !!process.env.REVE_API_KEY,
  });
});

// ── Catch-all: serve index.html for all other routes ────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✦ Jeeshu AI running at http://localhost:${PORT}`);
  console.log(`  API key loaded: ${process.env.REVE_API_KEY ? "✅ Yes" : "❌ No — add to .env"}\n`);
});

// Export for Vercel (Vercel needs the app exported, not started by listen)
module.exports = app;
