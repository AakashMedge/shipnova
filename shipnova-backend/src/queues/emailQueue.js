// const Bull = require("bull");
const sendEmail = require("../utils/sendEmail");

// ── REDIS / BULL QUEUE DISABLED FOR LOCAL WINDOWS ENVIRONMENT ──────────────
// The following block is commented out because Redis is not active natively on Windows.
// Emails are sent directly via Node.js async promises instead.

/*
const emailQueue = new Bull("shipnova-emails", {
  redis: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

emailQueue.process(async (job) => {
  const { email, subject, message } = job.data;
  await sendEmail({ email, subject, message });
  console.log(`📧 Email sent to ${email} | Subject: ${subject}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email job failed (attempt ${job.attemptsMade}):`, err.message);
});

emailQueue.on("error", (err) => {
  console.warn(`⚠️  Email queue error: ${err.message}`);
});
*/

/**
 * Add an email job to the queue — fire and forget.
 * Falls back to direct send if queue is unavailable.
 */
const queueEmail = async (emailData) => {
  // Bypassing Redis (Bull Queue) entirely for local Windows development because Redis isn't running.
  // Instead of queueing, we fire the email immediately in the background asynchronously.
  try {
    console.log(`🚀 Attempting to send email directly to ${emailData.email}...`);
    sendEmail(emailData).catch(err => {
      console.error("❌ Background Email Direct Send Failed:", err.message);
    });
  } catch (err) {
    console.error("❌ Email trigger failed:", err.message);
  }
};

const emailQueue = null; // Removed

module.exports = { emailQueue, queueEmail };
