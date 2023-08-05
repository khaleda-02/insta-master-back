const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const insightsSchema = new Schema(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true,
      },
    followers: {
       type: String
    },
    following: {
         type: String
    },
    posts: {
        type: String
    }
},
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Insights', insightsSchema);