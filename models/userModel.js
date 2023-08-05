const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    instaId: {
      type: String,
    },
    password: {
      type: String,
    },
    OTP: {
      type: Number,
      default: undefined
    },
    OTPCodeExpiration: {
      type: Date,
      default: undefined
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);