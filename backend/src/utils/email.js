const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email notification
const sendEmailNotification = async (to, subject, data) => {
  try {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email notification skipped - Email not configured');
      return;
    }

    const transporter = createTransporter();
    
    let htmlContent = '';
    let textContent = '';

    switch (subject) {
      case 'New Question Created':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">New Question Created</h2>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>Question ID:</strong> ${data.ticketId}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Asked by:</strong> ${data.creator}</p>
                <p><strong>Category:</strong> ${data.category || 'General'}</p>
                <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #64748b;">Please review and respond to this question as soon as possible.</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from QuickDesk.</p>
              </div>
            </div>
          </div>
        `;
        textContent = `New Question Created\nQuestion ID: ${data.ticketId}\nSubject: ${data.subject}\nAsked by: ${data.creator}\nCategory: ${data.category || 'General'}`;
        break;

      case 'Question Status Updated':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Question Status Updated</h2>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>Question ID:</strong> ${data.ticketId}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Status changed from:</strong> <span style="color: #dc2626;">${data.oldStatus}</span> <strong>to:</strong> <span style="color: #059669;">${data.newStatus}</span></p>
                <p><strong>Updated by:</strong> ${data.updatedBy}</p>
              </div>
              <p style="color: #64748b;">The status of your question has been updated.</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from QuickDesk.</p>
              </div>
            </div>
          </div>
        `;
        textContent = `Question Status Updated\nQuestion ID: ${data.ticketId}\nSubject: ${data.subject}\nStatus: ${data.oldStatus} → ${data.newStatus}\nUpdated by: ${data.updatedBy}`;
        break;

      case 'New Reply on Question':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">New Reply on Your Question</h2>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>Question:</strong> ${data.subject}</p>
                <p><strong>Replied by:</strong> ${data.replyAuthor}</p>
                <p><strong>Reply:</strong> ${data.replyContent.substring(0, 100)}${data.replyContent.length > 100 ? '...' : ''}</p>
              </div>
              <p style="color: #64748b;">You have received a new reply to your question. Please log in to view the full response.</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from QuickDesk.</p>
              </div>
            </div>
          </div>
        `;
        textContent = `New Reply on Your Question\nQuestion: ${data.subject}\nReplied by: ${data.replyAuthor}\nReply: ${data.replyContent.substring(0, 100)}...`;
        break;

      case 'Question Assigned':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Question Assigned to You</h2>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p><strong>Question ID:</strong> ${data.ticketId}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Asked by:</strong> ${data.creator}</p>
                <p><strong>Priority:</strong> ${data.priority || 'Medium'}</p>
              </div>
              <p style="color: #64748b;">A new question has been assigned to you. Please review and respond promptly.</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from QuickDesk.</p>
              </div>
            </div>
          </div>
        `;
        textContent = `Question Assigned to You\nQuestion ID: ${data.ticketId}\nSubject: ${data.subject}\nAsked by: ${data.creator}`;
        break;

      default:
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">${subject}</h2>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px;">
                <p>${JSON.stringify(data)}</p>
              </div>
            </div>
          </div>
        `;
        textContent = `${subject}\n${JSON.stringify(data)}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: `QuickDesk - ${subject}`,
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${to}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

module.exports = {
  sendEmailNotification
}; 