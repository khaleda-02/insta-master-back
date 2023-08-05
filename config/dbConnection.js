const mongoose = require('mongoose');
const errorHandler = require('express-async-handler');
// no need to this line
require('dotenv').config({ path: '.env' });
mongoose.set('debug', true);


const connectDb = errorHandler(async () => {
  const connect = await mongoose.connect(process.env.CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('connectioin done ', connect.connection.name);
  return connect;
})

module.exports = connectDb;