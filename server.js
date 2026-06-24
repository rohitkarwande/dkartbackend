 const express = require('express');
const cors = require('cors');

require('dotenv').config();
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const dealRoutes = require('./routes/dealRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const legalRoutes = require('./routes/legalRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('./cron_jobs'); // Initialize cron jobs

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files including /uploads
app.use(apiLimiter); // Apply global rate limiter

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Note: Should probably be 'users' to match REST conventions, but keeping existing 'user' for now.
app.use('/api/equipment', equipmentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/legal', legalRoutes);
app.use('/health', healthRoutes);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
