const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. RFQ HEADER (The Sourcing Event) ---
const rfqHeaderSchema = new mongoose.Schema({
  rfqNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  sourcingType: {
    type: String,
    enum: ['Standard RFQ', 'Sealed Bid', 'Reverse Auction'],
    default: 'Standard RFQ'
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  submissionDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Scoring', 'Awarded', 'Cancelled'],
    default: 'Draft'
  },
  invitedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  // For Q&A Forum
  qaThreads: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, refPath: 'qaThreads.senderModel' },
    senderModel: { type: String, enum: ['User', 'Vendor'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
rfqHeaderSchema.plugin(auditPlugin);

// --- B. RFQ LINE ITEM (What you are buying) ---
// Simplified to one line per RFQ for this implementation, but keeping relational architecture
const rfqLineItemSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQHeader',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  requisitionId: { // Optional link back to PR
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PRHeader'
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1
  },
  targetDeliveryDate: {
    type: Date
  }
});
rfqLineItemSchema.plugin(auditPlugin);

// --- C. VENDOR BID / QUOTATION (The Supplier's Response) ---
const vendorBidSchema = new mongoose.Schema({
  rfqLineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQLineItem',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  offeredUnitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  offeredLeadTimeDays: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Disqualified', 'Awarded'],
    default: 'Submitted'
  }
}, { timestamps: true });
vendorBidSchema.plugin(auditPlugin);

// --- D. BID SCORING MATRIX (The AI/Math Engine) ---
const bidScoringMatrixSchema = new mongoose.Schema({
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorBid',
    required: true,
    unique: true
  },
  priceScore: { type: Number, default: 0 },
  leadTimeScore: { type: Number, default: 0 },
  vendorRatingMultiplier: { type: Number, default: 1 },
  finalWeightedScore: { type: Number, default: 0 }
});

const RFQHeader = mongoose.model('RFQHeader', rfqHeaderSchema);
const RFQLineItem = mongoose.model('RFQLineItem', rfqLineItemSchema);
const VendorBid = mongoose.model('VendorBid', vendorBidSchema);
const BidScoringMatrix = mongoose.model('BidScoringMatrix', bidScoringMatrixSchema);

// Exporting old alias as RFQHeader for backward compatibility with routes/controllers momentarily
module.exports = {
  RFQHeader,
  RFQLineItem,
  VendorBid,
  BidScoringMatrix,
  PurchaseRFQ: RFQHeader 
};
