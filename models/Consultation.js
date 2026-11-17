import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    recordKey: { type: String, trim: true, default: '' },
    patientId: { type: String, trim: true, default: '' },
    patientName: { type: String, trim: true, required: true },
    age: { type: Number, default: null },
    gender: { type: String, default: '' },
    mobile: { type: String, trim: true, default: '' },
    visitId: { type: String, trim: true, default: '' },
    tokenNumber: { type: String, trim: true, default: '' },
    appointmentId: { type: String, trim: true, default: '' },
    doctorName: { type: String, trim: true, default: 'Dr. Vinish Kumar Singh' },
    department: { type: String, trim: true, default: 'Urology' },
    clinic: { type: String, trim: true, default: '' },
    vitals: {
      bp: { type: String, default: '' },
      pulse: { type: String, default: '' },
      temperature: { type: String, default: '' },
      spo2: { type: String, default: '' },
      weight: { type: String, default: '' },
      height: { type: String, default: '' },
    },
    chiefComplaint: { type: String, default: '' },
    clinicalNotes: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    investigation: { type: String, default: '' },
    advice: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    followUpInstructions: { type: String, default: '' },
    medicines: [
      {
        name: { type: String, default: '' },
        dosage: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
        route: { type: String, default: '' },
        instructions: { type: String, default: '' },
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'COMPLETED'],
      default: 'COMPLETED'
    },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

consultationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

consultationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  }
});

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
