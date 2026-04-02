const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Fix for Windows DNS SRV resolution issue with MongoDB Atlas
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Career Skill Gap Analyzer API' });
});

// ── Routes ──────────────────────────────────────────
// Member 01 — Malewana (Auth + Assessment)
app.use('/api/auth',           require('./routes/auth'));
// app.use('/api/assessment',     require('./routes/assessment'));

// Member 02 — Kalendra (Skills + Career Paths)
// app.use('/api/skills',         require('./routes/skills'));
// app.use('/api/careerpaths',    require('./routes/careerPaths'));

// Member 03 — Supeshala (Career Recommendation)
// app.use('/api/recommendation', require('./routes/careerRecommendation'));

// Member 04 — Perera (Skill Gap)
// app.use('/api/skillgap',       require('./routes/skillGap'));

// Member 05 — Wickrama (Learning Resources)
// app.use('/api/resources',      require('./routes/learningResources'));

// Member 06 — Sampath (Progress)
// app.use('/api/progress',       require('./routes/progress'));

// ── Database connection ──────────────────────────────
const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://supeshalamuvi_db_user:MsrMtk%402003@cluster0.qtvoy72.mongodb.net/careergapdb?retryWrites=true&w=majority';
      
      await mongoose.connect(mongoUri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB Connected Successfully');
      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB Connection Error (Attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.warn('⚠️  MongoDB connection failed after retries. Server will run without database.');
        console.warn('📝 Tips: Check MongoDB Atlas cluster status, IP whitelist, and credentials.');
      }
    }
  }
};

connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});