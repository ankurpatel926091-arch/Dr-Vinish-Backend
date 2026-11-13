import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import Appointment from '../models/Appointment.js';

// @desc    Get all bills for admin panel
// @route   GET /api/billing/admin/all
// @access  Private/Admin
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('appointment')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    console.error('Get All Bills Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills: ' + error.message
    });
  }
};

// @desc    Create a new OPD bill
// @route   POST /api/billing/admin
// @access  Private/Admin
export const createBill = async (req, res) => {
  try {
    const {
      billId,
      visitId,
      appointment,
      patientId,
      patientName,
      phone,
      age,
      gender,
      doctor,
      department,
      hospital,
      visitDate,
      diagnosis,
      consultationFee,
      services,
      discount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus,
      invoiceStatus,
      notes
    } = req.body;

    if (!patientName || !String(patientName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient name is required'
      });
    }

    // Generate unique billId if not provided
    let finalBillId = billId;
    if (!finalBillId) {
      const count = await Bill.countDocuments();
      finalBillId = `BILL-${1000 + count + 1}`;
    }

    // Check if bill with this billId already exists (idempotency)
    const existingBill = await Bill.findOne({ billId: finalBillId });
    if (existingBill) {
      return res.status(200).json({
        success: true,
        message: 'Bill already exists',
        data: existingBill
      });
    }

    // Also check if bill for this visitId already exists
    if (visitId) {
      const billByVisit = await Bill.findOne({ visitId });
      if (billByVisit) {
        return res.status(200).json({
          success: true,
          message: 'Bill for this visit already exists',
          data: billByVisit
        });
      }
    }

    let appointmentObjectId = null;
    if (appointment && mongoose.Types.ObjectId.isValid(appointment)) {
      appointmentObjectId = appointment;
    }

    const newBill = await Bill.create({
      billId: finalBillId,
      visitId: visitId || `V-${Math.floor(20000 + Math.random() * 90000)}`,
      appointment: appointmentObjectId,
      patientId: patientId || `UHID-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: String(patientName).trim(),
      phone: phone ? String(phone).trim() : '',
      age: age ? Number(age) : undefined,
      gender: gender || 'Male',
      doctor: doctor || 'Dr. Vinish Kumar Singh',
      department: department || 'Urology',
      hospital: hospital || 'Rudraksh IVF & Urology Centre (Sharda Nagar)',
      visitDate: visitDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      diagnosis: diagnosis || 'General Urology Consultation',
      consultationFee: consultationFee ? Number(consultationFee) : 1000,
      services: Array.isArray(services) && services.length > 0 ? services : [{ name: 'OPD Consultation', amount: 1000 }],
      discount: discount ? Number(discount) : 0,
      totalAmount: totalAmount ? Number(totalAmount) : 1000,
      paidAmount: paidAmount ? Number(paidAmount) : 0,
      dueAmount: dueAmount !== undefined ? Number(dueAmount) : 1000,
      paymentMode: paymentMode || null,
      paymentStatus: paymentStatus || (paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending'),
      invoiceStatus: invoiceStatus || (paidAmount >= totalAmount ? 'Paid' : 'Pending'),
      notes: notes ? String(notes).trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: newBill
    });
  } catch (error) {
    console.error('Create Bill Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bill: ' + error.message
    });
  }
};

// @desc    Update a bill (e.g. collect payment, edit services)
// @route   PUT /api/billing/admin/:id
// @access  Private/Admin
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { billId: id };
    }

    const bill = await Bill.findOne(query);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Apply allowed updates
    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'billId') {
        bill[key] = updates[key];
      }
    });

    // Recompute payment status if paidAmount / totalAmount changed
    if (updates.paidAmount !== undefined || updates.totalAmount !== undefined) {
      const paid = Number(bill.paidAmount) || 0;
      const total = Number(bill.totalAmount) || 0;
      const due = Math.max(0, total - paid);
      bill.dueAmount = due;
      bill.paymentStatus = due === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
      bill.invoiceStatus = bill.paymentStatus;
    }

    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Update Bill Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bill: ' + error.message
    });
  }
};

// @desc    Delete a bill
// @route   DELETE /api/billing/admin/:id
// @access  Private/Admin
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { billId: id };
    }

    const deleted = await Bill.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete Bill Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bill: ' + error.message
    });
  }
};

