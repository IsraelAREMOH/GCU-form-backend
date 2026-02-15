import { body, validationResult } from "express-validator";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const contactValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 6 })
    .withMessage("Full name must be at least 6 characters"),

  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .trim()
    .custom((value) => {
      const phoneNumber = parsePhoneNumberFromString(value);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Please provide a valid phone number");
      }
      return true;
    }),

  body("business").trim().notEmpty().withMessage("Business name is required"),

  body("services")
    .isArray({ min: 1 })
    .withMessage("Please select at least one service"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 40 })
    .withMessage("Message must be at least 40 characters long"),
];

export const validateContact = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        msg: err.msg,
      })),
    });
  }

  next();
};
