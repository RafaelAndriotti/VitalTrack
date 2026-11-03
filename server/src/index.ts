import "dotenv/config";
import app from "./app.js";

// Fail fast if the JWT secret is missing or weak. A short/absent secret makes
// HS256 tokens brute-forceable — abort rather than boot insecurely.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be set and at least 32 characters. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
  );
}

const PORT = parseInt(process.env.PORT || "3001", 10);

// Start server
app.listen(PORT, () => {
  console.log(`VitalTrack server running on http://localhost:${PORT}`);
});

export default app;
