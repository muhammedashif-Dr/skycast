import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema({
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

// Avoid duplicate favorites for the same coordinates
FavoriteSchema.index({ lat: 1, lon: 1 }, { unique: true });

export default mongoose.model('Favorite', FavoriteSchema);
