import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import {
  contactValidationRules,
  validateContact,
} from "./middleware/contactValidation.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Middleware

app.use(cors());

app.use(express.json());
app.use(helmet());
app.use(compression());

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many requests, please send us an Email",
});

// Zoho SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
  connectionTimeout: 30000,
});

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Contact form endpoint
app.post(
  "/api/contact",
  contactLimiter,
  contactValidationRules,
  validateContact,
  async (req, res) => {
    const { name, email, phone, business, services, message } = req.body;

    try {
      await transporter.sendMail({
        from: `"Website Form" <${process.env.ZOHO_EMAIL}>`,
        to: process.env.ZOHO_EMAIL,
        replyTo: email,
        subject: "New Website Form Submission",
        html: `
          <h3>New Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Business:</strong> ${business}</p>
          <p><strong>Services:</strong> ${Array.isArray(services) ? services.join(", ") : services}
</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });

      res.status(200).json({
        success: true,
        message: "Message sent successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to send message",
      });
    }
  },
);

const PORT = process.env.PORT || 5000;

if (!PORT) {
  console.error("PORT not defined!");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
