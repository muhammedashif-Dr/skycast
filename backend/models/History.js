import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  country: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('History', HistorySchema);
