export interface BookingConfirmationParams {
    clientName: string;
    therapistName: string;
    date: string; // Already formatted, or ISO
    time: string; // Formatted like 10:00 AM
    sessionType: string;
    meetingLink?: string;
}

export const buildBookingConfirmationEmail = (params: BookingConfirmationParams): string => {
    const { clientName, therapistName, date, time, sessionType, meetingLink } = params;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Confirmed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2d3748; margin: 0; font-size: 24px; }
        .details-box { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #edf2f7; }
        .detail-row { display: flex; margin-bottom: 10px; }
        .detail-label { font-weight: bold; width: 120px; color: #4a5568; }
        .detail-value { color: #2d3748; }
        .button-container { text-align: center; margin-top: 30px; }
        .button { display: inline-block; background-color: #3182ce; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="text-align: center; margin-bottom: 30px;">
            <img src="https://rebalancetherapy.co.in/images/logo.svg" alt="Rebalance Therapy Logo" width="160" style="margin-bottom: 20px;" />
            <h1>Booking Confirmed!</h1>
        </div>
        <p>Hi ${clientName},</p>
        <p>Your appointment with <strong>${therapistName}</strong> has been confirmed. Below are your session details:</p>
        
        <div class="details-box">
            <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${date}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Time:</div>
                <div class="detail-value">${time}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Type:</div>
                <div class="detail-value" style="text-transform: capitalize;">${sessionType}</div>
            </div>
            ${meetingLink ? `
            <div class="detail-row">
                <div class="detail-label">Meeting Link:</div>
                <div class="detail-value"><a href="${meetingLink}">Join Session</a></div>
            </div>
            ` : ''}
        </div>
        
        ${meetingLink ? `
        <div class="button-container">
            <a href="${meetingLink}" class="button">Join Meeting</a>
        </div>
        ` : `
        <p><em>Your meeting link will be updated by your therapist shortly. You can check your dashboard for updates.</em></p>
        `}
        
        <p>If you need to make any changes, please contact support.</p>
        <p>Best regards,<br>Rebalance Therapy Team</p>
        
        <div class="footer">
            &copy; ${new Date().getFullYear()} Rebalance Therapy. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};
