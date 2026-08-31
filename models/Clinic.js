import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema(
  {
    clinicId: { type: String, default: '' },
    name: { type: String, required: true },
    tag: { type: String, default: 'Morning OPD' },
    badgeLabel: { type: String, default: 'MORNING CONSULTATION CENTRE' },
    city: { type: String, default: 'Lucknow' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    timings: { type: String, default: '' },
    image: { type: String, default: '' },
    mapUrl: { type: String, default: '' },
    embedUrl: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Clinic = mongoose.model('Clinic', clinicSchema);
export default Clinic;
