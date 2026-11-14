import mongoose from 'mongoose';

const doctorQueueSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      trim: true
    },
    patientId: {
      type: String,
      trim: true,
      default: ''
    },
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      default: 35
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    doctorName: {
      type: String,
      trim: true,
      default: 'Dr. Vinish Kumar Singh'
    },
    department: {
      type: String,
      trim: true,
      default: 'Urology'
    },
    clinic: {
      type: String,
      trim: true,
      default: 'Rudraksh IVF & Urology Centre'
    },
    visitId: {
      type: String,
      trim: true,
      default: ''
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      default: null
    },
    checkInTime: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
    },
    startTime: {
      type: String,
      default: null
    },
    endTime: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Waiting', 'Consulting', 'Completed', 'Skipped', 'Cancelled'],
      default: 'Waiting'
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent'],
      default: 'Normal'
    },
    vitals: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    queueDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    }
  },
  {
    timestamps: true
  }
);

// Virtual id field for frontend compatibility
doctorQueueSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

doctorQueueSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  }
});

const DoctorQueue = mongoose.model('DoctorQueue', doctorQueueSchema);

export default DoctorQueue;

