import nodemailer from 'nodemailer';
import Subscriber from '../models/Subscriber.js';

// Create transporter - configure with your email service
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use App Password for Gmail
        }
    });
};

// Send email to a single recipient
export const sendEmail = async (to, subject, html) => {
    try {
        // Skip if email credentials not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Email not configured - skipping email to:', to);
            return false;
        }
        
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"MyMediTalks" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

// Notify all subscribers about new article
export const notifyNewArticle = async (article) => {
    try {
        const subscribers = await Subscriber.find({ isActive: true, 'preferences.newArticles': true });
        
        const emailPromises = subscribers.map(subscriber => {
            const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${subscriber.unsubscribeToken}`;
            const articleUrl = `${process.env.FRONTEND_URL}/article/${article.slug}`;
            
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Georgia', serif; line-height: 1.8; color: #2c3e50; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { font-size: 24px; color: #1B2C4E; margin-bottom: 10px; }
                        .title { font-size: 28px; color: #1B2C4E; margin: 20px 0; }
                        .excerpt { font-style: italic; color: #666; margin: 20px 0; }
                        .btn { display: inline-block; background: #d4a574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
                        .unsubscribe { color: #999; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🌸 MyMediTalks</div>
                            <p>A new article has been published</p>
                        </div>
                        <h1 class="title">${article.title}</h1>
                        <p class="excerpt">"${article.excerpt}"</p>
                        <p><strong>Category:</strong> ${article.category} &bull; <strong>Read Time:</strong> ${article.readTime}</p>
                        <p style="text-align: center;">
                            <a href="${articleUrl}" class="btn">Read Article</a>
                        </p>
                        <div class="footer">
                            <p>You're receiving this because you subscribed to MyMediTalks.</p>
                            <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe</a></p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            return sendEmail(subscriber.email, `New Article: ${article.title}`, html);
        });
        
        await Promise.all(emailPromises);
        console.log(`Notified ${subscribers.length} subscribers about new article`);
        return true;
    } catch (error) {
        console.error('Failed to notify subscribers:', error);
        return false;
    }
};

// Notify user about admin reply to their comment
export const notifyCommentReply = async (reader, article, replyContent) => {
    try {
        if (!reader.notificationPreferences?.commentReplies) return;
        
        const articleUrl = `${process.env.FRONTEND_URL}/article/${article.slug}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.8; color: #2c3e50; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { font-size: 24px; color: #1B2C4E; margin-bottom: 10px; }
                    .reply-box { background: #f8f6f3; padding: 20px; border-left: 4px solid #d4a574; margin: 20px 0; }
                    .btn { display: inline-block; background: #d4a574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🌸 MyMediTalks</div>
                        <p>Aanchal Attri replied to your comment!</p>
                    </div>
                    <h2>On "${article.title}"</h2>
                    <div class="reply-box">
                        <p>${replyContent}</p>
                    </div>
                    <p style="text-align: center;">
                        <a href="${articleUrl}" class="btn">View Article</a>
                    </p>
                    <div class="footer">
                        <p>You're receiving this because you commented on MyMediTalks.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await sendEmail(reader.email, `Reply to your comment on "${article.title}"`, html);
        return true;
    } catch (error) {
        console.error('Failed to notify about reply:', error);
        return false;
    }
};

// Send welcome email to new subscriber
export const sendWelcomeEmail = async (subscriber) => {
    try {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.8; color: #2c3e50; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { font-size: 28px; color: #1B2C4E; margin-bottom: 10px; }
                    .welcome { font-size: 32px; color: #1B2C4E; margin: 20px 0; }
                    .message { color: #666; margin: 20px 0; }
                    .btn { display: inline-block; background: #d4a574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🌸 MyMediTalks</div>
                    </div>
                    <h1 class="welcome">Welcome to MyMediTalks!</h1>
                    <p class="message">
                        Thank you for subscribing! You'll now receive notifications whenever I publish new articles 
                        about medicine, wellness, and the healing arts.
                    </p>
                    <p class="message">
                        I'm excited to have you as part of this community of curious minds exploring 
                        the intersection of medical science and holistic healing.
                    </p>
                    <p style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}" class="btn">Explore Articles</a>
                    </p>
                    <p style="text-align: center; font-style: italic; color: #d4a574;">— Aanchal Attri</p>
                    <div class="footer">
                        <p>You're receiving this because you subscribed to MyMediTalks.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await sendEmail(subscriber.email, 'Welcome to MyMediTalks! 🌸', html);
        return true;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return false;
    }
};
