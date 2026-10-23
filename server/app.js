const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Trust proxy headers from Render/cloud load balancers

// Middleware
/* Content-Security-Policy is set by nginx on the page itself (see
 * sites-available/precision-erp) rather than here: helmet only decorates API
 * responses, and a policy on JSON protects nothing. */
app.use(helmet({ contentSecurityPolicy: false }));

/* Who may call this API from a browser.
 *
 * This used to mirror whatever Origin the caller sent and pair it with
 * Access-Control-Allow-Credentials: true — which tells a browser that any
 * website may make credentialed requests here and read the replies. It has
 * been survivable only because the session cookie is SameSite=Lax over plain
 * HTTP, so the browser withholds it cross-site anyway. The moment this moves
 * behind TLS — which is the plan — sessionCookieOptions() switches to
 * SameSite=None, the cookie starts travelling, and any page the user visits
 * while signed in could read every invoice, customer and credit limit in the
 * system.
 *
 * The client is served from the same origin as the API, so same-origin calls
 * carry no Origin header and never reach this list. Non-browser callers
 * (curl, the audit scripts, a future integration) send no Origin either and
 * are unaffected: CORS constrains browsers, not clients.
 */
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:8080',
  'http://localhost:8083'
];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',').map((o) => o.trim()).filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);          // same-origin or non-browser
    if (
      process.env.NODE_ENV !== 'production' ||
      ALLOWED_ORIGINS.includes(origin) ||
      /^https?:\/\/.*\.onrender\.com$/.test(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    // Refuse by withholding the header rather than erroring: the browser
    // blocks the read, and a non-browser caller is untouched either way.
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// Express 5 compatible mongo sanitize middleware (avoids reassigning req.query getter)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Generous threshold for live ERP operations
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after a few minutes' }
});
app.use('/api', apiLimiter);

// Global middleware to sanitize empty strings from payloads
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] === "") {
          delete obj[key];
        } else if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          sanitize(obj[key]);
        }
      });
    };
    sanitize(req.body);
  }
  next();
});

// Basic Route for health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running...' });
});

// Admin endpoint to populate non-destructive demo data across all modules
app.post('/api/admin/seed-demo-data', async (req, res) => {
  try {
    const { seedMasterAndDemoData } = require('./src/utils/seedMasterData');
    const result = await seedMasterAndDemoData();
    res.status(200).json(result);
  } catch (err) {
    console.error('Error during demo data seeding:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Define Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');

const dashboardRoutes = require('./src/routes/dashboard.routes');
const companyRoutes = require('./src/routes/company.routes');
const roleRoutes = require('./src/routes/role.routes');
const approvalRoutes = require('./src/routes/approval.routes');
const auditRoutes = require('./src/routes/audit.routes');
const masterRoutes = require('./src/routes/master.routes');
const engineeringRoutes = require('./src/routes/engineering.routes');
const salesRoutes = require('./src/routes/sales.routes');
const demandRoutes = require('./src/routes/demand.routes');
const mrpRoutes = require('./src/routes/mrp.routes');
const capacityRoutes = require('./src/routes/capacity.routes');
const procurementRoutes = require('./src/routes/procurement.routes');
const receiptRoutes = require('./src/routes/receipt.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const productionRoutes = require('./src/routes/production.routes');
const shopfloorRoutes = require('./src/routes/shopfloor.routes');
const qualityRoutes = require('./src/routes/quality.routes');
const maintenanceRoutes = require('./src/routes/maintenance.routes');
const dispatchRoutes = require('./src/routes/dispatch.routes');
const financeRoutes = require('./src/routes/finance.routes');
const issueRoutes = require('./src/routes/issue.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/company', companyRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/mrp', mrpRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/receipt', receiptRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/shopfloor', shopfloorRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/issues', issueRoutes);

// Serve frontend client in production / unified hosting
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
