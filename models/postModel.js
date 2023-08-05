const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String
    },
    hashTags: {
      type: Array
    },
    timeToShare: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (value) {
          return value >= Date.now();
        },
        message: 'Time to share must be at least now.'
      }
    }
  },
  {
    timestamps: true
  }
)
// input_kewyords: { type: Array, required: true },
module.exports = mongoose.model('Post', postSchema);
