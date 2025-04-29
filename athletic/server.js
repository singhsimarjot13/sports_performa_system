const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uploadRoutes = require('./routes/uploadRoutes');
const studentRoutes = require('./routes/studentRoutes'); // <-- add this

const app = express();
const PORT = 5000;

// DB connection
mongoose.connect('mongodb+srv://athleticptu:athleticptu123@cluster0.vt7d6or.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Routes
app.use('/', uploadRoutes);
app.use('/api', studentRoutes); // <-- register the student route

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
