const { sendTransactionalEmail } = require('../config/email');
const db = require('../config/db');

/**
 * Builds a branded HTML email wrapper around body content.
 */
const buildEmailHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #059669, #047857); padding: 28px 32px; }
    .header-logo { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header-logo span { color: #6ee7b7; }
    .body { padding: 32px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 12px; }
    .highlight-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .highlight-box p { font-size: 14px; color: #334155; line-height: 1.6; }
    .highlight-box strong { color: #0f172a; }
    .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 20px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">D<span>Kart</span> &mdash; Medical Equipment Marketplace</div>
    </div>
    <div class="body">
      <div class="title">${title}</div>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>You are receiving this because you are registered on DKart. &copy; ${new Date().getFullYear()} DKart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Notify ALL admin users by email about an event.
 * @param {string} type - Event type label (e.g. 'New Registration')
 * @param {string} subject - Email subject
 * @param {string} bodyHtml - Body HTML content (injected inside branded template)
 */
const emailAdmins = async (type, subject, bodyHtml) => {
    try {
        const adminsResult = await db.query("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL");
        if (adminsResult.rows.length === 0) return;

        const html = buildEmailHtml(subject, bodyHtml);
        const adminEmails = adminsResult.rows.map(r => r.email).filter(Boolean);

        for (const email of adminEmails) {
            sendTransactionalEmail(email, `[DKart Admin] ${subject}`, subject, html)
                .catch(err => console.error(`Failed to email admin ${email}:`, err));
        }
    } catch (err) {
        console.error('emailAdmins error:', err);
    }
};

/**
 * Send an email to a specific user by their userId.
 */
const emailUser = async (userId, subject, bodyHtml) => {
    try {
        const result = await db.query("SELECT email FROM users WHERE id = $1 AND email IS NOT NULL", [userId]);
        if (result.rows.length === 0 || !result.rows[0].email) return;
        const html = buildEmailHtml(subject, bodyHtml);
        sendTransactionalEmail(result.rows[0].email, subject, subject, html)
            .catch(err => console.error(`Failed to email user ${userId}:`, err));
    } catch (err) {
        console.error('emailUser error:', err);
    }
};

// ─── Pre-built Event Emails ─────────────────────────────────────────────────

const emailNewRegistration = (userEmail, userId) => {
    emailAdmins('NEW_USER', 'New User Registration', `
        <span class="badge">🎉 New Registration</span>
        <p class="text">A new user has just registered and verified their account on DKart.</p>
        <div class="highlight-box">
            <p><strong>Contact:</strong> ${userEmail}</p>
            <p><strong>User ID:</strong> #${userId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">You can view and manage this user in the Admin Panel.</p>
    `);
};

const emailNewEquipmentListing = (sellerEmail, sellerId, equipmentTitle, equipmentId) => {
    emailAdmins('NEW_LISTING', 'New Equipment Listed', `
        <span class="badge">📦 New Listing</span>
        <p class="text">A new equipment item has been listed on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
            <p><strong>Seller:</strong> ${sellerEmail || `User #${sellerId}`}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Review this listing in the Admin Panel.</p>
    `);
};

const emailNewInquiry = (sellerUserId, buyerEmail, equipmentTitle) => {
    emailUser(sellerUserId, `New Inquiry on Your Listing: ${equipmentTitle}`, `
        <span class="badge">💬 New Inquiry</span>
        <p class="text">Someone is interested in your equipment listing!</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Buyer Contact:</strong> ${buyerEmail || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Log in to your DKart dashboard to respond to this inquiry and start chatting.</p>
    `);
    // Also notify admins
    emailAdmins('NEW_INQUIRY', 'New Inquiry Received', `
        <span class="badge">💬 New Inquiry</span>
        <p class="text">A new inquiry has been submitted on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Buyer:</strong> ${buyerEmail || 'N/A'}</p>
        </div>
    `);
};

const emailNewMessage = (recipientUserId, senderName, messagePreview, equipmentTitle) => {
    emailUser(recipientUserId, `New message from ${senderName} — DKart`, `
        <span class="badge">✉️ New Message</span>
        <p class="text">You have received a new message on DKart.</p>
        <div class="highlight-box">
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>Regarding:</strong> ${equipmentTitle || 'Equipment inquiry'}</p>
            <p><strong>Message preview:</strong><br/><em>"${String(messagePreview).substring(0, 120)}${messagePreview.length > 120 ? '...' : ''}"</em></p>
        </div>
        <p class="text">Log in to DKart to read the full message and reply.</p>
    `);
};

const emailNewChatRoom = (equipmentTitle, inquiryId) => {
    emailAdmins('NEW_CHAT_ROOM', 'New Chat Room Opened', `
        <span class="badge">🗨️ Chat Started</span>
        <p class="text">A new chat room has been opened for an inquiry.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle || 'N/A'}</p>
            <p><strong>Inquiry ID:</strong> #${inquiryId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
    `);
};

const emailDealLocked = (sellerUserId, buyerUserId, equipmentTitle, equipmentId) => {
    // Email both parties
    emailUser(buyerUserId, `🔒 Deal Locked: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">Great news! The seller has locked the deal on the following equipment.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Please coordinate with the seller via DKart chat to finalize the transaction.</p>
    `);
    emailUser(sellerUserId, `Deal Locked Confirmation: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">You have successfully locked the deal on your equipment listing.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
        </div>
    `);
    // Admin notification
    emailAdmins('DEAL_LOCKED', `Deal Locked: ${equipmentTitle}`, `
        <span class="badge">🔒 Deal Locked</span>
        <p class="text">A deal has been locked on the platform.</p>
        <div class="highlight-box">
            <p><strong>Equipment:</strong> ${equipmentTitle}</p>
            <p><strong>Equipment ID:</strong> #${equipmentId}</p>
        </div>
    `);
};

const emailKycSubmission = (userId, userEmail) => {
    emailAdmins('KYC_SUBMITTED', 'New KYC Submission', `
        <span class="badge">📋 KYC Submitted</span>
        <p class="text">A user has submitted a KYC application for seller verification.</p>
        <div class="highlight-box">
            <p><strong>User:</strong> ${userEmail || `User #${userId}`}</p>
            <p><strong>User ID:</strong> #${userId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">Review and approve/reject this KYC in the Admin Panel.</p>
    `);
};

const emailNewLoginAlert = async (userEmail, ipAddress, userAgent) => {
    if (!userEmail) return;
    
    const subject = 'Security Alert: New Login Detected';
    const html = buildEmailHtml(
        subject,
        `
        <p class="text">We detected a new login to your DKart account from an IP address you haven't used before.</p>
        <div class="stats-box">
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Device/Browser:</strong> ${userAgent || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <p class="text">If this was you, you can safely ignore this email.</p>
        <p class="text" style="color: #ef4444; font-weight: bold;">If you did not authorize this login, please contact support immediately.</p>
        `
    );

    await sendTransactionalEmail(userEmail, subject, subject, html)
        .catch(err => console.error(`Failed to send new login alert to ${userEmail}:`, err));
};

module.exports = {
    emailAdmins,
    emailUser,
    emailNewRegistration,
    emailNewEquipmentListing,
    emailNewInquiry,
    emailNewMessage,
    emailNewChatRoom,
    emailDealLocked,
    emailKycSubmission,
    emailNewLoginAlert,
};
