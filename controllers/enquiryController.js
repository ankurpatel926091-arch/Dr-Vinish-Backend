import Enquiry from '../models/Enquiry.js';

// @desc    Create new contact enquiry from public website
// @route   POST /api/enquiries
// @access  Public
export const createEnquiry = async (req, res) => {
  try {
    const { name, phone, service, subject, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and phone number'
      });
    }

    const enquirySubject = service || subject || 'General Inquiry';

    const newEnquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      subject: enquirySubject,
      service: enquirySubject,
      message: message ? message.trim() : 'N/A',
      status: 'New'
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: newEnquiry
    });
  } catch (error) {
    console.error('Create Enquiry Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting enquiry: ' + error.message
    });
  }
};

// @desc    Get all enquiries for Admin Panel
// @route   GET /api/enquiries/admin/all
// @access  Private/Admin
export const getAdminEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    console.error('Get Admin Enquiries Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/admin/:id/status
// @access  Private/Admin
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) {
      enquiry.status = status;
      await enquiry.save();
    }

    res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${enquiry.status}`,
      data: enquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/admin/:id
// @access  Private/Admin
export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    await Enquiry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Sample enquiries to seed if DB is empty
export const initialSampleEnquiries = [
  {
    name: 'Rahul Verma',
    phone: '9876543210',
    subject: 'Laser Kidney Stone Consultation',
    service: 'Laser Kidney Stones (RIRS / PCNL)',
    message: 'Looking for consultation regarding 8mm kidney stone laser procedure.',
    status: 'New',
    date: '20 May 2025'
  },
  {
    name: 'Amit Kumar',
    phone: '9765432101',
    subject: 'Enlarged Prostate (HolEP)',
    service: 'Enlarged Prostate Laser Surgery (HolEP)',
    message: 'Want to know timings for OPD consultation with Dr. Vinish.',
    status: 'Read',
    date: '19 May 2025'
  },
  {
    name: 'Neha Singh',
    phone: '9654321098',
    subject: 'UTI & Female Urology',
    service: 'Recurrent Female UTI & Bladder Care',
    message: 'Requesting appointment for recurrent UTI consultation.',
    status: 'New',
    date: '18 May 2025'
  },
  {
    name: 'Priya Sharma',
    phone: '9543210987',
    subject: 'General Consultation',
    service: 'General Urology & OPD Consultation',
    message: 'Need second opinion on ultrasound report.',
    status: 'Replied',
    date: '17 May 2025'
  }
];

// Seed initial enquiries
export const seedInitialEnquiries = async () => {
  try {
    const count = await Enquiry.countDocuments();
    if (count === 0) {
      await Enquiry.insertMany(initialSampleEnquiries);
      console.log('Default Contact Enquiries seeded into MongoDB database.');
    }
  } catch (error) {
    console.error('Error seeding initial enquiries:', error.message);
  }
};
