import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  TAILOR_APPROVAL_NOTIFICATION_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];

  try {
    console.log("Preparing to send email to:", email);
    const mailOptions = {
      from: sender,
      to: recipient,
      subject: "Please verify your email address",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    };

    console.log("Mail options:", JSON.stringify(mailOptions, null, 2));
    const response = await mailtrapClient.send(mailOptions);

    console.log("Email sent successfully. Server response:", {
      id: response.id,
      status: response.status,
      server_response: response.server_response,
    });

    return response;
  } catch (error) {
    console.error("Complete email error details:", {
      timestamp: new Date().toISOString(),
      recipient: email,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
            }
          : undefined,
      },
    });
    throw error;
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

export const sendTailorApprovalNotification = async (
  tailorDetails,
  approvalLink
) => {
  const recipient = [{ email: "needle360.online@gmail.com" }];

  try {
    const mailOptions = {
      from: sender,
      to: recipient,
      subject: "New Tailor Registration - Approval Required",
      html: TAILOR_APPROVAL_NOTIFICATION_TEMPLATE.replace(
        "{name}",
        tailorDetails.name
      )
        .replace("{email}", tailorDetails.email)
        .replace(
          "{contactNumber}",
          tailorDetails.contactNumber || "Not provided"
        )
        .replace("{shopName}", tailorDetails.shopName || "Not provided")
        .replace("{shopAddress}", tailorDetails.shopAddress || "Not provided")
        .replace("{registrationNumber}", tailorDetails.registrationNumber)
        .replace("{approvalLink}", approvalLink),
      category: "Tailor Approval",
    };

    const response = await mailtrapClient.send(mailOptions);
    console.log(
      "Tailor approval notification sent successfully. Response ID:",
      response.id
    );
    return response;
  } catch (error) {
    console.error("Error sending tailor approval notification:", error);
    throw error;
  }
};
