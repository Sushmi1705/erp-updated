const mongoose = require('mongoose');

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/erp-system');
    console.log('Connected to DB');
    
    const { InspectionLot, UsageDecision } = require('./src/models/QualityInspection');
    const MasterMaterial = require('./src/models/MasterMaterial');
    const GoodsReceipt = require('./src/models/GoodsReceipt');
    
    const material = await MasterMaterial.findOne();
    const grnLine = await GoodsReceipt.GRNLines.findOne();
    
    const lotId = new mongoose.Types.ObjectId();
    
    await InspectionLot.create({
      _id: lotId,
      Lot_Number: `INSP-TEST-${Date.now().toString().slice(-4)}`,
      GRN_Line_ID: grnLine ? grnLine._id : new mongoose.Types.ObjectId(),
      Product_ID: material ? material._id : new mongoose.Types.ObjectId(),
      Total_Received_Quantity: 100,
      Sample_Quantity_Required: 10,
      Inspection_Status: 'Evaluated'
    });

    await UsageDecision.create({
      Inspection_Lot_ID: lotId,
      Decision_Code: 'Accept',
      Accepted_Quantity: 100,
      Rejected_Quantity: 0,
      Hold_Quantity: 0
    });

    console.log('Seeded QA Data Successfully');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
