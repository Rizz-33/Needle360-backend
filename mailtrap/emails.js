import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [
    {
      email,
    },
  ];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Please verify your email address",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    });

    console.log(
      `Verification email sent successfully to ${email}. Response ID: ${response.id}`
    );
  } catch (error) {
    console.error(
      `Failed to send verification email to ${email}: ${error.message}`
    );

    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const recipient = [
    {
      email,
    },
  ];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Welcome to Needle360!",
      html: WELCOME_EMAIL_TEMPLATE.replace("{username}", name),
      category: "Welcome Email",
    });

    console.log(
      `Welcome email sent successfully to ${email}. Response ID: ${response.id}`
    );
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}: ${error.message}`);

    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [
    {
      email,
    },
  ];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Please reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });

    console.log(
      `Password reset email sent successfully to ${email}. Response ID: ${response.id}`
    );
  } catch (error) {
    console.error(
      `Failed to send password reset email to ${email}: ${error.message}`
    );

    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendResetPasswordConfirmationEmail = async (email) => {
  const recipient = [
    {
      email,
    },
  ];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Your password has been reset",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset Confirmation",
    });

    console.log(
      `Password reset confirmation email sent successfully to ${email}. Response ID: ${response.id}`
    );
  } catch (error) {
    console.error(
      `Failed to send password reset confirmation email to ${email}: ${error.message}`
    );

    throw new Error(
      `Failed to send password reset confirmation email: ${error.message}`
    );
  }
};
