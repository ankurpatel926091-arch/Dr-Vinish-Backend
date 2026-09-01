import Appointment from '../models/Appointment.js';

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

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment
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
    }).select('centre date time status problem name phone');

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

// @desc    Update appointment status
// @route   PATCH /api/appointments/admin/:id/status
// @access  Private/Admin
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) {
      appointment.status = status;
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${appointment.status}`,
      data: appointment
    });
  } catch (error) {
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
