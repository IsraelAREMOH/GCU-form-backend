import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import {
  contactValidationRules,
  validateContact,
} from "./middleware/contactValidation.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Zoho SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Contact form endpoint
app.post(
  "/api/contact",
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
          <p><strong>Services:</strong> ${services.join(", ")}</p>
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
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
