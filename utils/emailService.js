import nodemailer from 'nodemailer';

const createTransporter = () => {
  const user = process.env.EMAIL_USER || 'ankurpatel926091@gmail.com';
  const pass = process.env.EMAIL_PASS || 'wqnriebjoefalymu';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, '')
    }
  });
};

// Helper to extract email if embedded in message
export const extractAppointmentEmail = (appointment) => {
  if (!appointment) return '';
  if (appointment.email && appointment.email.trim()) {
    return appointment.email.trim();
  }
  const msg = appointment.message || '';
  const match = msg.match(/Email:\s*([^\s|]+)/i);
  if (match && match[1] && match[1] !== 'N/A') {
    return match[1].trim();
  }
  return '';
};

// 1. Send Appointment Confirmation Email
export const sendAppointmentConfirmationEmail = async (appointment) => {
  try {
    const transporter = createTransporter();
    const recipientEmail = extractAppointmentEmail(appointment);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`No valid email found for appointment. Email notification skipped.`);
      return { success: false, reason: 'No valid recipient email' };
    }

    const doctorName = "Dr. Vinish Kumar Singh";
    const doctorTitle = "Senior Consultant Urologist & Laser Surgeon";

    const mailOptions = {
      from: `"Dr. Vinish Kumar Singh Clinic" <${process.env.EMAIL_USER || 'ankurpatel926091@gmail.com'}>`,
      to: recipientEmail,
      subject: `✅ Appointment Confirmed - Dr. Vinish Kumar Singh Clinic`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #103F7C 0%, #0D264E 100%); padding: 25px 15px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${doctorName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; font-weight: 500;">${doctorTitle}</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 20px 15px; background-color: #ffffff;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 12px 15px; margin-bottom: 20px; text-align: center;">
              <span style="font-size: 26px; display: block; margin-bottom: 4px;">🎉</span>
              <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #166534;">Your Appointment is Confirmed!</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">We look forward to seeing you at your scheduled consultation time.</p>
            </div>

            <p style="font-size: 14px; margin-bottom: 15px; color: #334155;">
              Dear <strong>${appointment.name}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 20px;">
              Your appointment request at <strong>Dr. Vinish Kumar Singh's Clinic</strong> has been officially confirmed by our medical team. Below are your consultation details:
            </p>

            <!-- Appointment Details Box -->
            <div style="background-color: #f8fafc; border-radius: 14px; padding: 12px 10px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; line-height: 1.5;">
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Patient Name:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.name}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Phone Number:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Centre / Hospital:</td>
                  <td style="padding: 9px 6px; color: #103F7C; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; word-wrap: break-word; overflow-wrap: anywhere;">${appointment.centre || appointment.hospital}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Confirmed Date:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.date}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Confirmed Time:</td>
                  <td style="padding: 9px 6px; color: #ea580c; font-weight: 800; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.time}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Treatment / Reason:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; word-wrap: break-word; overflow-wrap: anywhere;">${appointment.problem || appointment.service || 'General Urology Consultation'}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">Status:</td>
                  <td style="padding: 9px 6px; color: #166534; font-weight: 800; width: 62%; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">Confirmed</td>
                </tr>
              </table>
            </div>

            <!-- Important Instructions -->
            <div style="background-color: #fffbeeb0; border: 1px solid #fef08a; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #854d0e;">📋 Patient Guidelines:</h4>
              <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #713f12; line-height: 1.5;">
                <li>Please arrive at the clinic 10 minutes prior to your confirmed time slot.</li>
                <li>Bring any prior medical records, ultrasound scans, or lab reports with you.</li>
                <li>If you need to reschedule, please call our helpline in advance.</li>
              </ul>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
              Need help or directions? Call us at <strong>+91 89600 68307</strong> / <strong>+91 86048 91955</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 15px 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0;">Dr. Vinish Kumar Singh • Senior Urologist & Andrologist • Lucknow</p>
            <p style="margin: 0;">This is an automated notification email regarding your clinic appointment.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent successfully to ${recipientEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email via nodemailer:', error.message);
    return { success: false, error: error.message };
  }
};

// 2. Send Appointment Cancellation Email
export const sendAppointmentCancellationEmail = async (appointment) => {
  try {
    const transporter = createTransporter();
    const recipientEmail = extractAppointmentEmail(appointment);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`No valid email found for appointment. Email notification skipped.`);
      return { success: false, reason: 'No valid recipient email' };
    }

    const doctorName = "Dr. Vinish Kumar Singh";

    const mailOptions = {
      from: `"Dr. Vinish Kumar Singh Clinic" <${process.env.EMAIL_USER || 'ankurpatel926091@gmail.com'}>`,
      to: recipientEmail,
      subject: `❌ Appointment Status Update: Cancelled - Dr. Vinish Kumar Singh Clinic`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #103F7C 0%, #0D264E 100%); padding: 25px 15px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${doctorName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; font-weight: 500;">Clinic Appointment Notification</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 20px 15px; background-color: #ffffff;">
            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 12px 15px; margin-bottom: 20px; text-align: center;">
              <span style="font-size: 26px; display: block; margin-bottom: 4px;">⚠️</span>
              <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #9f1239;">Your Appointment Has Been Cancelled</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #be123c;">Your scheduled consultation request could not be processed.</p>
            </div>

            <p style="font-size: 14px; margin-bottom: 15px; color: #334155;">
              Dear <strong>${appointment.name}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 20px;">
              This email is to inform you that your appointment request for <strong>${appointment.date}</strong> at <strong>${appointment.time}</strong> at <strong>${appointment.centre || appointment.hospital}</strong> has been <strong>Cancelled</strong>.
            </p>

            <!-- Details Box -->
            <div style="background-color: #f8fafc; border-radius: 14px; padding: 12px 10px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; line-height: 1.5;">
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Patient Name:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.name}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Centre / Hospital:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; word-wrap: break-word; overflow-wrap: anywhere;">${appointment.centre || appointment.hospital}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Date & Time:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.date} (${appointment.time})</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">Status:</td>
                  <td style="padding: 9px 6px; color: #e11d48; font-weight: 800; width: 62%; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">Cancelled</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 20px;">
              If you would like to pick another time slot or reschedule your consultation, please visit our website or call our clinic desk directly.
            </p>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
              Need help? Call us at <strong>+91 89600 68307</strong> / <strong>+91 86048 91955</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 15px 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0;">Dr. Vinish Kumar Singh • Senior Urologist & Andrologist • Lucknow</p>
            <p style="margin: 0;">This is an automated notification email regarding your clinic appointment status.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent successfully to ${recipientEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending cancellation email via nodemailer:', error.message);
    return { success: false, error: error.message };
  }
};

// 3. Send Appointment Submission Received Email (Instant notification upon booking)
export const sendAppointmentSubmissionEmail = async (appointment) => {
  try {
    const transporter = createTransporter();
    const recipientEmail = extractAppointmentEmail(appointment);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`No valid email found for appointment submission. Email notification skipped.`);
      return { success: false, reason: 'No valid recipient email' };
    }

    const doctorName = "Dr. Vinish Kumar Singh";
    const doctorTitle = "Senior Consultant Urologist & Laser Surgeon";

    const mailOptions = {
      from: `"Dr. Vinish Kumar Singh Clinic" <${process.env.EMAIL_USER || 'ankurpatel926091@gmail.com'}>`,
      to: recipientEmail,
      subject: `📩 Appointment Request Submitted Successfully - Dr. Vinish Kumar Singh Clinic`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #103F7C 0%, #0D264E 100%); padding: 25px 15px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${doctorName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; font-weight: 500;">${doctorTitle}</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 20px 15px; background-color: #ffffff;">
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 12px 15px; margin-bottom: 20px; text-align: center;">
              <span style="font-size: 26px; display: block; margin-bottom: 4px;">🎉</span>
              <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #1e40af;">Appointment Request Submitted Successfully!</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #2563eb;">We have received your request and our clinic team will contact you shortly.</p>
            </div>

            <p style="font-size: 14px; margin-bottom: 15px; color: #334155;">
              Dear <strong>${appointment.name}</strong>,
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 20px;">
              Thank you for booking an appointment with <strong>Dr. Vinish Kumar Singh's Clinic</strong>. Below are your submitted consultation details:
            </p>

            <!-- Appointment Details Box -->
            <div style="background-color: #f8fafc; border-radius: 14px; padding: 12px 10px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; line-height: 1.5;">
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Patient Name:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.name}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Registered Email:</td>
                  <td style="padding: 9px 6px; color: #103F7C; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-all; word-wrap: break-word; overflow-wrap: anywhere;">${recipientEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Phone Number:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Centre / Hospital:</td>
                  <td style="padding: 9px 6px; color: #103F7C; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; word-wrap: break-word; overflow-wrap: anywhere;">${appointment.centre || appointment.hospital}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Requested Date:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.date}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Time Slot:</td>
                  <td style="padding: 9px 6px; color: #ea580c; font-weight: 800; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: anywhere;">${appointment.time}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">Treatment / Reason:</td>
                  <td style="padding: 9px 6px; color: #0f172a; font-weight: 700; width: 62%; vertical-align: top; border-bottom: 1px solid #e2e8f0; word-break: break-word; word-wrap: break-word; overflow-wrap: anywhere;">${appointment.problem || appointment.service || 'General Urology Consultation'}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 6px; color: #64748b; font-weight: 600; width: 38%; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">Status:</td>
                  <td style="padding: 9px 6px; color: #d97706; font-weight: 800; width: 62%; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">Pending Confirmation</td>
                </tr>
              </table>
            </div>

            <!-- What Happens Next -->
            <div style="background-color: #fffbeeb0; border: 1px solid #fef08a; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #854d0e;">📋 What Happens Next?</h4>
              <p style="margin: 0; font-size: 11px; color: #713f12; line-height: 1.5;">
                Our clinic receptionist will review your requested time slot and contact you at <strong>${appointment.phone}</strong> within 30 minutes to confirm your OPD appointment.
              </p>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
              Need help? Call us at <strong>+91 89600 68307</strong> / <strong>+91 86048 91955</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 15px 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0;">Dr. Vinish Kumar Singh • Senior Urologist & Andrologist • Lucknow</p>
            <p style="margin: 0;">This is an automated appointment request submission acknowledgement email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Submission confirmation email sent successfully to ${recipientEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending submission email via nodemailer:', error.message);
    return { success: false, error: error.message };
  }
};
