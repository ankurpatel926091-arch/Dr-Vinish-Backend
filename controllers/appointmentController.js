import Appointment from '../models/Appointment.js';
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
  sendAppointmentSubmissionEmail
} from '../utils/emailService.js';

// @desc    Create new appointment from website
// @route   POST /api/appointments
// @access  Public
export const createAppointment = async (req, res) => {
  try {
    const { name, phone, email, centre, hospital, problem, service, date, time, preferredTime, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and phone number'
      });
    }

    const appointmentCentre = centre || hospital || 'Rudraksh IVF & Urology Centre (Sharda Nagar)';
    const appointmentProblem = problem || service || 'General Urology Consultation';
    const appointmentTime = time || preferredTime || '11:00 AM';

    const newAppointment = await Appointment.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      centre: appointmentCentre,
      problem: appointmentProblem,
      date: date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: appointmentTime,
      message: message ? message.trim() : '',
      status: 'Pending'
    });

    let emailResult = null;
    try {
      emailResult = await sendAppointmentSubmissionEmail(newAppointment);
      console.log('Submission Email Status:', emailResult);
    } catch (err) {
      console.error('Async Submission Email Error:', err.message);
      emailResult = { success: false, error: err.message };
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment,
      emailResult
    });
  } catch (error) {
    console.error('Create Appointment Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment: ' + error.message
    });
  }
};

// @desc    Get all confirmed appointments for public frontend slot disabling
// @route   GET /api/appointments/public/confirmed-slots
// @access  Public
export const getConfirmedAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: { $regex: /^confirmed$/i }
    }).select('centre date time status problem name phone email');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get Confirmed Appointments Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all appointments for Admin Panel
// @route   GET /api/appointments/admin/all
// @access  Private/Admin
export const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get Admin Appointments Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status and send email notification
// @route   PATCH /api/appointments/admin/:id/status
// @access  Private/Admin
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, appointment } = req.body;
    let targetApt = null;

    if (req.params.id && req.params.id.length === 24) {
      targetApt = await Appointment.findById(req.params.id);
    }

    if (!targetApt && appointment) {
      targetApt = appointment;
    }

    if (targetApt && status) {
      if (typeof targetApt.save === 'function') {
        targetApt.status = status;
        await targetApt.save();
      } else {
        targetApt.status = status;
      }

      // Send Email Notification via Nodemailer
      const statusLower = String(status).toLowerCase();
      if (statusLower === 'confirmed') {
        try {
          await sendAppointmentConfirmationEmail(targetApt);
        } catch (err) {
          console.error('Async Confirmation Email Error:', err.message);
        }
      } else if (statusLower === 'cancelled') {
        try {
          await sendAppointmentCancellationEmail(targetApt);
        } catch (err) {
          console.error('Async Cancellation Email Error:', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: targetApt
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Direct endpoint to notify patient email for confirmation/cancellation
// @route   POST /api/appointments/notify-email
// @access  Public
export const notifyAppointmentEmail = async (req, res) => {
  try {
    const { appointment, status } = req.body;
    if (!appointment) {
      return res.status(400).json({ success: false, message: 'Appointment data is required' });
    }

    const targetStatus = status || appointment.status || 'Confirmed';
    const aptObj = { ...appointment, status: targetStatus };
    const statusLower = String(targetStatus).toLowerCase();

    let result = { success: false };
    if (statusLower === 'confirmed') {
      result = await sendAppointmentConfirmationEmail(aptObj);
    } else if (statusLower === 'cancelled') {
      result = await sendAppointmentCancellationEmail(aptObj);
    } else {
      result = await sendAppointmentSubmissionEmail(aptObj);
    }

    res.status(200).json({
      success: true,
      message: `Email notification processed for status: ${targetStatus}`,
      result
    });
  } catch (error) {
    console.error('Notify Email Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/admin/:id
// @access  Private/Admin
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
