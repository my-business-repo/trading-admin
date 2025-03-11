import nodemailer from 'nodemailer';

// Create a test account for development
let transporter: nodemailer.Transporter;

async function createTransporter() {
    // For production, use your actual SMTP settings
    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // For development, create a test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
}

export async function sendVerificationEmail(email: string, token: string) {
    if (!transporter) {
        await createTransporter();
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/customer/verify-email?token=${token}`;

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Trading System" <noreply@trading.com>',
        to: email,
        subject: 'Verify Your Email Address',
        text: `Please verify your email address by clicking on the following link: ${verificationUrl}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Our Trading System!</h2>
                <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 20px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
        `,
    });

    // For development, log the test email URL
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }

    return info;
}
