// Color variables for consistent styling
const COLORS = {
  primary: "#2825DA",
  accent: "#181683",
  background: "#FFFFFF",
  secondary: "#D4D3F8",
  hoverAccent: "#14126E",
};

// Logo URL variable for easy updating
const LOGO_URL = "logo-short-black.png";

// Common footer with signature that includes the logo
const EMAIL_SIGNATURE = `
  <div style="margin-top: 30px; border-top: 1px solid ${COLORS.secondary}; padding-top: 20px;">
    <table cellpadding="0" cellspacing="0" style="width: 100%;">
      <tr>
        <td style="vertical-align: middle; width: 80px;">
          <img src="${LOGO_URL}" alt="needle360°" style="width: 70px; height: auto;">
        </td>
        <td style="vertical-align: middle; padding-left: 15px;">
          <p style="margin: 0; font-weight: bold; font-size: 16px; color: ${COLORS.accent};">needle360°</p>
          <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Your All-in-One Business Solution</p>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
            <a href="https://www.needle360.online" style="color: ${COLORS.primary}; text-decoration: none;">www.needle360.online</a> | 
            <a href="mailto:needle360.online@gmail.com" style="color: ${COLORS.primary}; text-decoration: none;">support@needle360.com</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

export const VERIFICATION_EMAIL_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email | needle360°</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background-color: ${
        COLORS.background
      }; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, ${
            COLORS.primary
          }, ${
  COLORS.accent
}); padding: 25px; text-align: center; border-radius: 5px 5px 0 0;">
              <img src="${LOGO_URL}" alt="needle360°" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email Address</h1>
          </div>
          <div style="background-color: ${
            COLORS.background
          }; padding: 30px; border-radius: 0 0 5px 5px;">
              <p style="margin-top: 0;">Hello,</p>
              <p>Thank you for choosing needle360°. To complete your account setup, please verify your email address with the code below:</p>
              <div style="text-align: center; margin: 30px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${
                    COLORS.primary
                  }; background-color: ${
  COLORS.secondary
}; padding: 15px 30px; border-radius: 5px; display: inline-block;">{verificationCode}</span>
              </div>
              <p>This verification code will expire in 15 minutes for security purposes.</p>
              <p>If you did not create an account with needle360°, please disregard this email.</p>
              <p>Thank you for joining us!</p>
              <p>Best regards,<br>The needle360° Team</p>
              ${EMAIL_SIGNATURE}
          </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} needle360°. All rights reserved.</p>
      </div>
  </body>
  </html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to needle360°</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background-color: ${
        COLORS.background
      }; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, ${
            COLORS.primary
          }, ${
  COLORS.accent
}); padding: 25px; text-align: center; border-radius: 5px 5px 0 0;">
              <img src="${LOGO_URL}" alt="needle360°" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to needle360°</h1>
          </div>
          <div style="background-color: ${
            COLORS.background
          }; padding: 30px; border-radius: 0 0 5px 5px;">
              <p style="margin-top: 0;">Hello {username},</p>
              <p>Welcome to needle360°! We're thrilled to have you join our community of forward-thinking professionals.</p>
              <p>Here are some quick steps to help you get started:</p>
              <ul style="padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Complete your profile to enhance your experience</li>
                  <li style="margin-bottom: 10px;">Explore our comprehensive suite of business tools</li>
                  <li style="margin-bottom: 10px;">Connect with other professionals in your industry</li>
                  <li style="margin-bottom: 10px;">Check out our knowledge base for helpful tutorials</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{dashboardURL}" style="background-color: ${
                    COLORS.primary
                  }; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
              </div>
              <p>Our customer success team is available to assist you with any questions you may have. Feel free to reach out at <a href="mailto:needle360.online@gmail.com" style="color: ${
                COLORS.primary
              }; text-decoration: none;">support@needle360.com</a>.</p>
              <p>Best regards,<br>The needle360° Team</p>
              ${EMAIL_SIGNATURE}
          </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} needle360°. All rights reserved.</p>
      </div>
  </body>
  </html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful | needle360°</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background-color: ${
        COLORS.background
      }; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, ${
            COLORS.primary
          }, ${
  COLORS.accent
}); padding: 25px; text-align: center; border-radius: 5px 5px 0 0;">
              <img src="${LOGO_URL}" alt="needle360°" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Successful</h1>
          </div>
          <div style="background-color: ${
            COLORS.background
          }; padding: 30px; border-radius: 0 0 5px 5px;">
              <p style="margin-top: 0;">Hello {username},</p>
              <p>We're writing to confirm that your password has been successfully reset.</p>
              <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: ${
                    COLORS.primary
                  }; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; display: inline-block; font-size: 30px;">
                      ✓
                  </div>
              </div>
              <p>For optimal account security, we recommend:</p>
              <ul style="padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Using a strong, unique password that combines letters, numbers, and special characters</li>
                  <li style="margin-bottom: 10px;">Enabling two-factor authentication in your account settings</li>
                  <li style="margin-bottom: 10px;">Reviewing your recent account activity for any unauthorized changes</li>
              </ul>
              <p>If you did not initiate this password reset, please contact our security team immediately at <a href="mailto:security@needle360.com" style="color: ${
                COLORS.primary
              }; text-decoration: none;">security@needle360.com</a>.</p>
              <p>Thank you for helping us keep your account secure.</p>
              <p>Best regards,<br>The needle360° Team</p>
              ${EMAIL_SIGNATURE}
          </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} needle360°. All rights reserved.</p>
      </div>
  </body>
  </html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password | needle360°</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background-color: ${
        COLORS.background
      }; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, ${
            COLORS.primary
          }, ${
  COLORS.accent
}); padding: 25px; text-align: center; border-radius: 5px 5px 0 0;">
              <img src="${LOGO_URL}" alt="needle360°" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          <div style="background-color: ${
            COLORS.background
          }; padding: 30px; border-radius: 0 0 5px 5px;">
              <p style="margin-top: 0;">Hello {username},</p>
              <p>We received a request to reset the password for your needle360° account. To proceed with resetting your password, please click the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{resetURL}" style="background-color: ${
                    COLORS.primary
                  }; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you did not request a password reset, please ignore this email or contact our security team at <a href="mailto:security@needle360.com" style="color: ${
                COLORS.primary
              }; text-decoration: none;">security@needle360.com</a> if you believe your account may have been compromised.</p>
              <p>Best regards,<br>The needle360° Team</p>
              ${EMAIL_SIGNATURE}
          </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} needle360°. All rights reserved.</p>
      </div>
  </body>
  </html>
`;

export const TAILOR_APPROVAL_NOTIFICATION_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Tailor Registration | needle360°</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background-color: ${
        COLORS.background
      }; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, ${
            COLORS.primary
          }, ${
  COLORS.accent
}); padding: 25px; text-align: center; border-radius: 5px 5px 0 0;">
              <img src="${LOGO_URL}" alt="needle360°" style="width: 120px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Tailor Registration</h1>
          </div>
          <div style="background-color: ${
            COLORS.background
          }; padding: 30px; border-radius: 0 0 5px 5px;">
              <p style="margin-top: 0;">Hello Admin,</p>
              <p>A new tailor with role type 4 has registered on the system. Here are the details:</p>
              
              <div style="background-color: ${
                COLORS.secondary
              }; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: ${
                    COLORS.accent
                  };">Tailor Details</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> {name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                  <p style="margin: 5px 0;"><strong>Contact Number:</strong> {contactNumber}</p>
                  <p style="margin: 5px 0;"><strong>Shop Name:</strong> {shopName}</p>
                  <p style="margin: 5px 0;"><strong>Shop Address:</strong> {shopAddress}</p>
                  <p style="margin: 5px 0;"><strong>Registration Number:</strong> {registrationNumber}</p>
              </div>
              
              <p>Please review this registration and approve the tailor if everything looks correct.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{approvalLink}" style="background-color: ${
                    COLORS.primary
                  }; color: white; padding: 12px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Approve Tailor</a>
              </div>
              
              <p>Best regards,<br>The needle360° Team</p>
              ${EMAIL_SIGNATURE}
          </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} needle360°. All rights reserved.</p>
      </div>
  </body>
  </html>
`;
