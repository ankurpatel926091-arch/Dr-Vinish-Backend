import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: [true, 'Bill ID is required'],
    unique: true,
    trim: true
  },
  visitId: {
    type: String,
    trim: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  patientId: {
    type: String,
    trim: true,
    default: 'UHID-10001'
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  doctor: {
    type: String,
    default: 'Dr. Vinish Kumar Singh',
    trim: true
  },
  department: {
    type: String,
    default: 'Urology',
    trim: true
  },
  hospital: {
    type: String,
    default: 'Rudraksh IVF & Urology Centre (Sharda Nagar)',
    trim: true
  },
  visitDate: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  },
  diagnosis: {
    type: String,
    default: 'General Urology Consultation',
    trim: true
  },
  consultationFee: {
    type: Number,
    default: 1000
  },
  services: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true, default: 0 }
    }
  ],
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 1000
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 1000
  },
  paymentMode: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  invoiceStatus: {
    type: String,
    default: 'Pending'
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

const Bill = mongoose.model('Bill', billSchema);
export default Bill;

