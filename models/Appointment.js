import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  centre: {
    type: String,
    default: 'Rudraksh IVF & Urology Centre (Sharda Nagar)',
    trim: true
  },
  problem: {
    type: String,
    default: 'General Urology Consultation',
    trim: true
  },
  date: {
    type: String
  },
  time: {
    type: String,
    default: '11:00 AM'
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Missed', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

appointmentSchema.pre('save', function (next) {
  if (!this.date) {
    const today = new Date();
    this.date = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
