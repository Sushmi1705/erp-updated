const mongoose = require('mongoose');

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/erp-system');
    console.log('Connected to DB');
    
    // Check if models exist, else create minimal schema
    const poSchema = new mongoose.Schema({
        poNumber: String,
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        status: String,
        items: [{
            materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
            quantity: Number,
            unitPrice: Number
        }]
    }, { strict: false });

    const materialSchema = new mongoose.Schema({
        name: String,
        code: String,
        type: String,
        standardPrice: Number
    }, { strict: false });

    const PO = mongoose.models.Procurement || mongoose.model('Procurement', poSchema);
    const Material = mongoose.models.Material || mongoose.model('Material', materialSchema);

    // Create a dummy material if needed
    let mat = await Material.findOne();
    if (!mat) {
        mat = await Material.create({
            name: 'Brake Pad Set - Front',
            code: 'BRK-001',
            type: 'RawMaterial',
            standardPrice: 45.00
        });
    }

    // Create a dummy PO
    await PO.create({
        poNumber: `PO-${Date.now().toString().slice(-6)}`,
        status: 'Approved',
        items: [{
            materialId: mat._id,
            quantity: 100,
            unitPrice: mat.standardPrice
        }]
    });

    console.log('Successfully seeded an Approved Purchase Order.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
