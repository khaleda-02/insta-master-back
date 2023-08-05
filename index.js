const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const {connectDb} = require('./config');
const {errorHandler} = require('./middleware');
const app = express();
const port = process.env.PORT || 3001;

connectDb();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
})

app.use('/api/content/', require('./routes/postRoutes'));
app.use('/api/auth/', require('./routes/authRoutes'));
app.use('/api/insights/', require('./routes/insightsRoutes'));

app.use(errorHandler);

app.listen(port, () => {
  console.log(`server is running on port ${port}`)
});
