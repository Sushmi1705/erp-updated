/* Inventory movement & valuation for the LBAP demo.
 *
 * Story: steel coil lands in the Raw Material store against open POs, gets
 * issued to the press shop against work orders, a little is staged in WIP,
 * some comes back, and the stores team runs a cycle count. Every coil carries
 * a mill heat number so a bracket can be traced back to the cast it was
 * pressed from. Valuation is FIFO layers over the standard cost per kg.
 *
 * Deliberate sore points for the dashboard: three materials below safety
 * stock, one coil quarantined on a mill test certificate mismatch, one coil
 * scrapped for edge cracks, a draft issue blocked by a GI sheet shortage, a
 * transfer stuck waiting for the store in-charge, a reversed issue (wrong
 * thickness), and two dead-stock lines nobody has touched in months.
 */

module.exports = {
  name: 'Inventory',

  run: async (ctx) => {
    const {
      col, M, daysAgo, admin, company, plant, whRM, whWIP, whFG, uomKg
    } = ctx;

    const { InventoryTransaction, InvTxnHeader, InvTxnLine, InvTxnBatch, InvLedger } =
      M('InventoryTransaction');
    const { InventoryValuation, ValuationSummary, FIFOCostLayer } = M('InventoryValuation');
    const { InventoryTraceability, TrackingEntity, EntityGenealogy } = M('InventoryTraceability');
    const { InventoryOptimization, DeadStockLog } = M('InventoryOptimization');
    const { InventorySummary } = M('InventoryControl');
    const { StorageLocation, StorageZone, Rack, Bin } = M('MasterWarehouse');

    // ---- re-runnable: clear only the collections this module owns -----------
    const OWNED = [
      'storagelocations', 'storagezones', 'racks', 'bins',
      'inventorysummaries',
      'inventorytransactions', 'invtxnheaders', 'invtxnlines', 'invtxnbatches', 'invledgers',
      'trackingentities', 'entitygenealogies', 'inventorytraceabilities',
      'inventoryvaluations', 'valuationsummaries', 'fifocostlayers',
      'inventoryoptimizations', 'deadstocklogs'
    ];
    for (const c of OWNED) await col(c).deleteMany({});

    const audit = { createdBy: admin?._id, companyId: company?._id, plantId: plant?._id };
    const audit2 = { created_by: admin?._id, company_id: company?._id };
    const mat = (code) => ctx.materials.find((m) => m.code === code);

    // =========================================================================
    // 0. The plan: where every material stands right now.
    //    Total_On_Hand mirrors the already-seeded inventorystocks rows so the
    //    stock list and the summary agree with each other.
    // =========================================================================
    const PLAN = [
      { code: 'MAT-001', onHand: 5200, alloc: 1800, abc: 'A', rop: 2600, heat: 'TATA/HT/26/44117',
        layers: [[2600, 60.5, 58], [1900, 62.0, 31], [1500, 63.4, 11]] },
      { code: 'MAT-002', onHand: 2400, alloc: 1150, abc: 'A', rop: 2200, heat: 'TATA/HT/26/44206',
        layers: [[1400, 60.8, 54], [900, 61.5, 29], [700, 62.9, 9]] },
      { code: 'MAT-003', onHand: 4100, alloc: 1400, abc: 'A', rop: 2000, heat: 'JSW/HT/26/72841',
        layers: [[2200, 58.9, 51], [1600, 60.2, 26], [1300, 61.1, 7]] },
      { code: 'MAT-004', onHand: 7800, alloc: 2600, abc: 'A', rop: 3200, heat: 'SAIL/HT/26/19035',
        layers: [[4200, 55.1, 56], [3000, 56.4, 33], [2500, 57.2, 13]] },
      { code: 'MAT-005', onHand: 3100, alloc: 1050, abc: 'B', rop: 2600, heat: 'SAIL/HT/26/19112',
        layers: [[1800, 54.2, 49], [1200, 55.0, 27], [900, 56.3, 10]] },
      { code: 'MAT-006', onHand: 1500, alloc: 900, abc: 'B', rop: 1600, heat: 'JSW/HT/26/73004',
        layers: [[900, 66.8, 47], [600, 68.4, 22], [400, 69.7, 8]] },
      { code: 'MAT-007', onHand: 950, alloc: 640, abc: 'A', rop: 700, heat: 'JINDAL/HT/26/55219',
        layers: [[600, 241.0, 44], [400, 246.5, 20], [250, 252.0, 6]] },
      { code: 'MAT-008', onHand: 420, alloc: 0, abc: 'C', rop: 300, heat: 'HIND/HT/26/80471',
        dead: true, idle: 214, layers: [[500, 276.0, 232], [250, 281.5, 214]] },
      { code: 'MAT-009', onHand: 680, alloc: 120, abc: 'C', rop: 400, heat: 'ADOR/LOT/26/3308',
        expires: true, layers: [[400, 132.0, 40], [300, 135.5, 18], [200, 137.0, 5]] },
      { code: 'MAT-010', onHand: 260, alloc: 0, abc: 'B', rop: 150, heat: 'KLYN/HT/26/61027',
        idle: 96, layers: [[200, 334.0, 118], [150, 341.0, 96]] }
    ];

    // FIFO consumes oldest first, so fill remaining quantity from the newest
    // layer backwards. Guarantees sum(remaining) === on-hand.
    for (const p of PLAN) {
      let left = p.onHand;
      p.fifo = p.layers.map(([orig, cost, days]) => ({ orig, cost, days, remaining: 0 }));
      for (let i = p.fifo.length - 1; i >= 0; i--) {
        const take = Math.min(left, p.fifo[i].orig);
        p.fifo[i].remaining = take;
        left -= take;
      }
      p.fifoValue = Math.round(p.fifo.reduce((s, l) => s + l.remaining * l.cost, 0));
      p.wac = p.onHand ? Math.round((p.fifoValue / p.onHand) * 100) / 100 : 0;
    }
    const byCode = Object.fromEntries(PLAN.map((p) => [p.code, p]));

    // =========================================================================
    // 1. Storage structure: location -> zone -> rack -> bin
    // =========================================================================
    const LOCS = [
      { code: 'RM-L01', name: 'Coil Yard', wh: whRM },
      { code: 'RM-L02', name: 'Sheet & Consumables Store', wh: whRM },
      { code: 'WIP-L01', name: 'Press Line Buffer', wh: whWIP },
      { code: 'FG-L01', name: 'Dispatch Staging', wh: whFG }
    ];
    const locDocs = await StorageLocation.create(
      LOCS.map((l) => ({ name: l.name, code: l.code, warehouseId: l.wh._id, status: 'Active', ...audit }))
    );
    const loc = (code) => locDocs.find((d) => d.code === code);

    const ZONES = [
      { code: 'Z-COIL-A', name: 'Coil Bay A - CRCA', loc: 'RM-L01' },
      { code: 'Z-COIL-B', name: 'Coil Bay B - HR', loc: 'RM-L01' },
      { code: 'Z-SHEET', name: 'Sheet Rack Area', loc: 'RM-L02' },
      { code: 'Z-CONS', name: 'Consumables Cage', loc: 'RM-L02' },
      { code: 'Z-QHOLD', name: 'Incoming QC Hold', loc: 'RM-L02' },
      { code: 'Z-BLANK', name: 'Blank Pallet Zone', loc: 'WIP-L01' },
      { code: 'Z-INPROC', name: 'In-Process Hold', loc: 'WIP-L01' },
      { code: 'Z-PACK', name: 'Packed Bin Area', loc: 'FG-L01' },
      { code: 'Z-DISP', name: 'Dispatch Lane', loc: 'FG-L01' }
    ];
    const zoneDocs = await StorageZone.create(
      ZONES.map((z) => ({ name: z.name, code: z.code, storageLocationId: loc(z.loc)._id, status: 'Active', ...audit }))
    );
    const zone = (code) => zoneDocs.find((d) => d.code === code);

    const RACKS = [
      { code: 'RK-A01', name: 'Coil Rack A1', z: 'Z-COIL-A' },
      { code: 'RK-A02', name: 'Coil Rack A2', z: 'Z-COIL-A' },
      { code: 'RK-B01', name: 'Coil Rack B1', z: 'Z-COIL-B' },
      { code: 'RK-B02', name: 'Coil Rack B2', z: 'Z-COIL-B', status: 'Inactive' }, // floor repair
      { code: 'RK-S01', name: 'Sheet Rack S1', z: 'Z-SHEET' },
      { code: 'RK-S02', name: 'Sheet Rack S2', z: 'Z-SHEET' },
      { code: 'RK-C01', name: 'Consumable Rack C1', z: 'Z-CONS' },
      { code: 'RK-Q01', name: 'Hold Rack Q1', z: 'Z-QHOLD' },
      { code: 'RK-W01', name: 'Blank Pallet Rack W1', z: 'Z-BLANK' },
      { code: 'RK-W02', name: 'Blank Pallet Rack W2', z: 'Z-BLANK' },
      { code: 'RK-P01', name: 'Press Hold Rack P1', z: 'Z-INPROC' },
      { code: 'RK-F01', name: 'FG Rack F1', z: 'Z-PACK' },
      { code: 'RK-F02', name: 'FG Rack F2', z: 'Z-PACK' },
      { code: 'RK-D01', name: 'Dispatch Lane Rack D1', z: 'Z-DISP' }
    ];
    const rackDocs = await Rack.create(
      RACKS.map((r) => ({ name: r.name, code: r.code, zoneId: zone(r.z)._id, status: r.status || 'Active', ...audit }))
    );

    const binRows = [];
    rackDocs.forEach((r, i) => {
      for (let b = 1; b <= 2; b++) {
        binRows.push({
          name: `${r.name} - Bin ${b}`,
          code: `${r.code}-B${b}`,
          rackId: r._id,
          // one bin per warehouse block is blocked off for the annual count
          status: i === 3 ? 'Inactive' : 'Active',
          ...audit
        });
      }
    });
    const binDocs = await Bin.create(binRows);

    // =========================================================================
    // 2. Legacy movement history (pre-V2 cutover): coil receipts against POs
    // =========================================================================
    const PO_REFS = ['PO-2026-2001', 'PO-2026-2002', 'PO-2026-2003',
      'PO-2026-2004', 'PO-2026-2005', 'PO-2026-2006'];

    const legacyRows = PLAN.map((p, i) => {
      const newest = p.fifo[p.fifo.length - 1];
      return {
        transactionNumber: `GR-2026-${4001 + i}`,
        transactionDate: daysAgo(newest.days),
        transactionType: 'Goods Receipt',
        materialId: mat(p.code)._id,
        batchNumber: p.heat,
        destinationWarehouseId: whRM._id,
        quantity: newest.orig,
        referenceDocument: PO_REFS[i % PO_REFS.length],
        notes: `Coil receipt against ${PO_REFS[i % PO_REFS.length]}, mill heat ${p.heat}, weighed in at gate`
      };
    });

    legacyRows.push(
      {
        transactionNumber: 'GR-2026-4011',
        transactionDate: daysAgo(63),
        transactionType: 'Material Issue',
        materialId: mat('MAT-001')._id,
        batchNumber: 'TATA/HT/26/43880',
        sourceWarehouseId: whRM._id,
        quantity: 2400,
        referenceDocument: 'WO-2026-2988',
        notes: 'Pre-cutover issue to 250T press line'
      },
      {
        transactionNumber: 'GR-2026-4012',
        transactionDate: daysAgo(60),
        transactionType: 'Material Issue',
        materialId: mat('MAT-004')._id,
        batchNumber: 'SAIL/HT/26/18944',
        sourceWarehouseId: whRM._id,
        quantity: 3100,
        referenceDocument: 'WO-2026-2991',
        notes: 'Pre-cutover issue to 160T press line'
      },
      {
        transactionNumber: 'GR-2026-4013',
        transactionDate: daysAgo(55),
        transactionType: 'Stock Transfer',
        materialId: mat('MAT-003')._id,
        batchNumber: 'JSW/HT/26/72590',
        sourceWarehouseId: whRM._id,
        destinationWarehouseId: whWIP._id,
        quantity: 640,
        referenceDocument: 'STO-2026-0114',
        notes: 'Slit strip moved to press line buffer'
      },
      {
        transactionNumber: 'GR-2026-4014',
        transactionDate: daysAgo(43),
        transactionType: 'Stock Adjustment',
        materialId: mat('MAT-003')._id,
        batchNumber: 'JSW/HT/26/72590',
        sourceWarehouseId: whRM._id,
        quantity: -310,
        referenceDocument: 'ADJ-2026-0021',
        notes: 'Edge cracks found on outer wraps - coil rejected at goods-in and scrapped'
      },
      {
        transactionNumber: 'GR-2026-4015',
        transactionDate: daysAgo(36),
        transactionType: 'Stock Return',
        materialId: mat('MAT-005')._id,
        batchNumber: 'SAIL/HT/26/19112',
        sourceWarehouseId: whWIP._id,
        destinationWarehouseId: whRM._id,
        quantity: 220,
        referenceDocument: 'WO-2026-2991',
        notes: 'Unused HR strip returned from press line after job closure'
      }
    );
    const legacyDocs = await InventoryTransaction.create(legacyRows);
    const grOf = (code) => legacyDocs.find(
      (d) => d.transactionType === 'Goods Receipt' && String(d.materialId) === String(mat(code)._id)
    );

    // =========================================================================
    // 3. V2 transactions: header -> lines -> batches -> ledger
    // =========================================================================
    const HEADERS = [
      { n: 'INV-TXN-26-0001', t: 'Material Issue', ref: 'WO-2026-3001', rt: 'Work Order', st: 'Executed', d: 41,
        lines: [
          { m: 'MAT-001', q: 1600, from: whRM, to: whWIP, batch: 'TATA/HT/26/43880' },
          { m: 'MAT-004', q: 2100, from: whRM, to: whWIP, batch: 'SAIL/HT/26/18944' }
        ] },
      { n: 'INV-TXN-26-0002', t: 'Material Issue', ref: 'WO-2026-3002', rt: 'Work Order', st: 'Executed', d: 34,
        lines: [
          { m: 'MAT-003', q: 1350, from: whRM, to: whWIP, batch: 'JSW/HT/26/72841' },
          { m: 'MAT-006', q: 640, from: whRM, to: whWIP, batch: 'JSW/HT/26/73004' }
        ] },
      { n: 'INV-TXN-26-0003', t: 'Material Issue', ref: 'WO-2026-3002', rt: 'Work Order', st: 'Executed', d: 27,
        lines: [{ m: 'MAT-002', q: 980, from: whRM, to: whWIP, batch: 'TATA/HT/26/44206' }] },
      { n: 'INV-TXN-26-0004', t: 'Material Issue', ref: 'WO-2026-3003', rt: 'Work Order', st: 'Executed', d: 19,
        lines: [
          { m: 'MAT-005', q: 1250, from: whRM, to: whWIP, batch: 'SAIL/HT/26/19112' },
          { m: 'MAT-007', q: 210, from: whRM, to: whWIP, batch: 'JINDAL/HT/26/55219' }
        ] },
      { n: 'INV-TXN-26-0005', t: 'Transfer', ref: 'STO-2026-0163', rt: 'None', st: 'Executed', d: 15,
        lines: [
          { m: 'MAT-001', q: 420, from: whRM, to: whWIP, batch: 'TATA/HT/26/44117', both: true },
          { m: 'MAT-004', q: 610, from: whRM, to: whWIP, batch: 'SAIL/HT/26/19035', both: true },
          { m: 'MAT-005', q: 240, from: whRM, to: whWIP, batch: 'SAIL/HT/26/19112', both: true }
        ] },
      { n: 'INV-TXN-26-0006', t: 'Return', ref: 'WO-2026-3003', rt: 'Work Order', st: 'Executed', d: 12,
        lines: [{ m: 'MAT-005', q: 180, from: whWIP, to: whRM, batch: 'SAIL/HT/26/19112', both: true }] },
      { n: 'INV-TXN-26-0007', t: 'Adjustment', ref: 'CC-2026-0009', rt: 'None', st: 'Executed', d: 9,
        lines: [
          { m: 'MAT-007', q: -35, from: whRM, batch: 'JINDAL/HT/26/55219' },
          { m: 'MAT-009', q: 12, to: whRM, batch: 'ADOR/LOT/26/3308' }
        ] },
      { n: 'INV-TXN-26-0008', t: 'Material Issue', ref: 'WO-2026-3003', rt: 'Work Order', st: 'Executed', d: 6,
        lines: [
          { m: 'MAT-001', q: 1350, from: whRM, to: whWIP, batch: 'TATA/HT/26/44117' },
          { m: 'MAT-003', q: 900, from: whRM, to: whWIP, batch: 'JSW/HT/26/72841' }
        ] },
      { n: 'INV-TXN-26-0009', t: 'Material Issue', ref: 'WO-2026-3004', rt: 'Work Order', st: 'Draft', d: 2,
        lines: [{ m: 'MAT-006', q: 780, from: whRM, to: whWIP, batch: 'JSW/HT/26/73004' }] },
      { n: 'INV-TXN-26-0010', t: 'Transfer', ref: 'STO-2026-0171', rt: 'None', st: 'Pending Approval', d: 1,
        lines: [{ m: 'MAT-003', q: 800, from: whRM, to: whWIP, batch: 'JSW/HT/26/72841' }] },
      { n: 'INV-TXN-26-0011', t: 'Material Issue', ref: 'WO-2026-3001', rt: 'Work Order', st: 'Reversed', d: 22,
        lines: [{ m: 'MAT-002', q: 900, from: whRM, to: whWIP, batch: 'TATA/HT/26/44206' }] }
    ];

    const headerDocs = await InvTxnHeader.create(HEADERS.map((h) => ({
      Txn_Number: h.n,
      Txn_Date: daysAgo(h.d),
      Txn_Type: h.t,
      Ref_Doc_Number: h.ref,
      Ref_Doc_Type: h.rt,
      Status: h.st,
      Total_Lines: h.lines.length,
      ...audit
    })));

    const lineRows = [];
    HEADERS.forEach((h, hi) => h.lines.forEach((l, li) => lineRows.push({
      Txn_ID: headerDocs[hi]._id,
      Line_Sequence: li + 1,
      Material_ID: mat(l.m)._id,
      Quantity: l.q,
      UOM_ID: uomKg?._id,
      Source_WH_ID: l.from ? l.from._id : undefined,
      Dest_WH_ID: l.to ? l.to._id : undefined,
      Unit_Cost: byCode[l.m].wac,
      ...audit
    })));
    const lineDocs = await InvTxnLine.create(lineRows);

    // index lines back to their spec
    const lineSpec = [];
    HEADERS.forEach((h, hi) => h.lines.forEach((l) => lineSpec.push({ h, hi, l })));

    // --- batch / heat tracking on every steel line ---------------------------
    const batchRows = [];
    lineSpec.forEach(({ l }, i) => {
      if (!l.batch) return;
      batchRows.push({
        Txn_Line_ID: lineDocs[i]._id,
        Batch_Lot_Number: l.batch,
        Quantity: Math.abs(l.q),
        Expiration_Date: l.m === 'MAT-009' ? daysAgo(-540) : undefined,
        ...audit
      });
    });
    const batchDocs = await InvTxnBatch.create(batchRows);

    // --- ledger: only executed movements post ---------------------------------
    const posting = [];
    lineSpec.forEach(({ h, l }, i) => {
      if (h.st !== 'Executed') return;
      const line = lineDocs[i];
      const qty = Math.abs(l.q);
      const src = l.from;
      const dst = l.to;
      if (l.q < 0 && src) {
        posting.push({ line, mat: l.m, wh: src, type: 'OUT', qty: -qty, d: h.d });
      } else if (l.q > 0 && src && dst && l.both) {
        posting.push({ line, mat: l.m, wh: src, type: 'OUT', qty: -qty, d: h.d });
        posting.push({ line, mat: l.m, wh: dst, type: 'IN', qty, d: h.d });
      } else if (src) {
        // consumption at issue - backflushed straight off the raw material store
        posting.push({ line, mat: l.m, wh: src, type: 'OUT', qty: -qty, d: h.d });
      } else if (dst) {
        posting.push({ line, mat: l.m, wh: dst, type: 'IN', qty, d: h.d });
      }
    });
    posting.sort((a, b) => b.d - a.d); // oldest first

    // Opening balance chosen so the ledger lands exactly on today's on-hand.
    const key = (m, wh) => `${m}|${String(wh._id)}`;
    const net = {};
    posting.forEach((p) => { net[key(p.mat, p.wh)] = (net[key(p.mat, p.wh)] || 0) + p.qty; });
    const bal = {};
    Object.keys(net).forEach((k) => {
      const code = k.split('|')[0];
      const isRM = k.endsWith(String(whRM._id));
      bal[k] = isRM ? byCode[code].onHand - net[k] : 0;
    });

    const ledgerRows = posting.map((p) => {
      const k = key(p.mat, p.wh);
      bal[k] += p.qty;
      return {
        Txn_Line_ID: p.line._id,
        Material_ID: mat(p.mat)._id,
        Warehouse_ID: p.wh._id,
        Movement_Type: p.type,
        Qty_Change: p.qty,
        Running_Balance: Math.round(bal[k] * 100) / 100,
        Posting_Date: daysAgo(p.d),
        ...audit
      };
    });
    const ledgerDocs = await InvLedger.create(ledgerRows);

    // =========================================================================
    // 4. Inventory summary (what the Inventory Control screen reads)
    // =========================================================================
    const poLines = await col('polineitems').find({}).toArray();
    const onOrder = {};
    poLines.forEach((l) => {
      const open = (l.orderQty || 0) - (l.receivedQty || 0);
      if (open > 0) onOrder[String(l.materialId)] = (onOrder[String(l.materialId)] || 0) + open;
    });

    const summaryRows = PLAN.map((p) => ({
      Product_ID: mat(p.code)._id,
      Warehouse_ID: whRM._id,
      Total_On_Hand: p.onHand,
      Total_Allocated: p.alloc,
      On_Order_Quantity: onOrder[String(mat(p.code)._id)] || 0,
      Last_Updated_Timestamp: daysAgo(0),
      ...audit2
    }));
    // Deliberately summarised against the raw material store only. Safety
    // stock is held per material at plant level, and the Inventory Control
    // screen flags any row whose ATP is under it - so a WIP row carrying a few
    // hundred kg of strip would raise a shortage alert that isn't real. The
    // WIP position stays visible in the ledger running balances instead.

    // InventorySummary's pre('save') hook takes a `next` callback, which
    // mongoose 9 no longer supplies, so create()/save() throws. insertMany
    // still validates against the schema but skips document middleware, so we
    // compute Available_to_Promise here exactly as the hook would.
    summaryRows.forEach((r) => { r.Available_to_Promise = r.Total_On_Hand - r.Total_Allocated; });
    const summaryDocs = await InventorySummary.insertMany(summaryRows);

    // =========================================================================
    // 5. Traceability - heat numbers on coil
    // =========================================================================
    const traceSpecs = PLAN.map((p) => {
      const newest = p.fifo[p.fifo.length - 1];
      const special = {
        'MAT-007': { status: 'Pending', note: 'awaiting incoming inspection clearance' },
        'MAT-008': { status: 'Active' }
      }[p.code] || { status: 'Active' };
      return {
        Tracking_Number: p.heat,
        Tracking_Type: p.code === 'MAT-009' ? 'Lot' : 'Batch',
        Reference_Code: grOf(p.code).referenceDocument,
        Material_ID: mat(p.code)._id,
        Origin_Txn_ID: grOf(p.code)._id,
        Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(newest.days + 9),
        Expiry_Date: p.expires ? daysAgo(-(730 - newest.days)) : undefined,
        Current_Status: special.status,
        Current_Quantity: newest.remaining,
        ...audit
      };
    });

    traceSpecs.push(
      { Tracking_Number: 'TATA/HT/26/43880', Tracking_Type: 'Batch', Reference_Code: 'PO-2026-1987',
        Material_ID: mat('MAT-001')._id, Origin_Txn_ID: grOf('MAT-001')._id, Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(88), Current_Status: 'Consumed', Current_Quantity: 0, ...audit },
      { Tracking_Number: 'SAIL/HT/26/18944', Tracking_Type: 'Lot', Reference_Code: 'PO-2026-1990',
        Material_ID: mat('MAT-004')._id, Origin_Txn_ID: grOf('MAT-004')._id, Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(81), Current_Status: 'Consumed', Current_Quantity: 0, ...audit },
      { Tracking_Number: 'JSW/HT/26/72590', Tracking_Type: 'Batch', Reference_Code: 'PO-2026-1994',
        Material_ID: mat('MAT-003')._id, Origin_Txn_ID: grOf('MAT-003')._id, Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(69), Current_Status: 'Scrapped', Current_Quantity: 0, ...audit },
      { Tracking_Number: 'JINDAL/HT/26/55184', Tracking_Type: 'Batch', Reference_Code: 'PO-2026-2004',
        Material_ID: mat('MAT-007')._id, Origin_Txn_ID: grOf('MAT-007')._id, Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(58), Current_Status: 'Quarantined', Current_Quantity: 260, ...audit },
      { Tracking_Number: 'LBAP/SER/26/D2-014', Tracking_Type: 'Serial Number', Reference_Code: 'PO-2026-2006',
        Material_ID: mat('MAT-010')._id, Origin_Txn_ID: grOf('MAT-010')._id, Current_WH_ID: whRM._id,
        Mfg_Date: daysAgo(96), Current_Status: 'Active', Current_Quantity: 110, ...audit }
    );
    const entityDocs = await TrackingEntity.create(traceSpecs);
    const ent = (num) => entityDocs.find((e) => e.Tracking_Number === num);

    const genRows = entityDocs.map((e) => ({
      Entity_ID: e._id,
      Txn_ID: e.Origin_Txn_ID,
      Action_Type: 'Creation',
      Dest_WH_ID: whRM._id,
      Transaction_Date: e.Mfg_Date,
      ...audit
    }));
    const gen = (num, type, extra = {}) => genRows.push({
      Entity_ID: ent(num)._id, Action_Type: type, ...extra, ...audit
    });
    gen('TATA/HT/26/44117', 'Transfer', { Source_WH_ID: whRM._id, Dest_WH_ID: whWIP._id, Transaction_Date: daysAgo(15) });
    gen('SAIL/HT/26/19035', 'Transfer', { Source_WH_ID: whRM._id, Dest_WH_ID: whWIP._id, Transaction_Date: daysAgo(15) });
    gen('SAIL/HT/26/19112', 'Transfer', { Source_WH_ID: whRM._id, Dest_WH_ID: whWIP._id, Transaction_Date: daysAgo(15) });
    gen('SAIL/HT/26/19112', 'Transfer', { Source_WH_ID: whWIP._id, Dest_WH_ID: whRM._id, Transaction_Date: daysAgo(12) });
    gen('TATA/HT/26/43880', 'Consumption', { Source_WH_ID: whRM._id, Transaction_Date: daysAgo(41) });
    gen('SAIL/HT/26/18944', 'Consumption', { Source_WH_ID: whRM._id, Transaction_Date: daysAgo(41) });
    gen('JINDAL/HT/26/55184', 'Quality Hold', { Source_WH_ID: whRM._id, Transaction_Date: daysAgo(52) });
    gen('JSW/HT/26/72590', 'Adjustment', { Source_WH_ID: whRM._id, Transaction_Date: daysAgo(43) });
    gen('JINDAL/HT/26/55219', 'Adjustment', { Source_WH_ID: whRM._id, Transaction_Date: daysAgo(9) });
    const genealogyDocs = await EntityGenealogy.create(genRows);

    // Legacy traceability register (kept in step with the V2 entities)
    const legacyTraceDocs = await InventoryTraceability.create(
      PLAN.map((p, i) => {
        const newest = p.fifo[p.fifo.length - 1];
        return {
          trackingNumber: `TRK-2026-${7101 + i}`,
          trackingType: p.code === 'MAT-009' ? 'Lot' : 'Batch',
          materialId: mat(p.code)._id,
          referenceNumber: p.heat,
          manufacturingDate: daysAgo(newest.days + 9),
          expiryDate: p.expires ? daysAgo(-(730 - newest.days)) : undefined,
          originTransactionId: grOf(p.code)._id
        };
      })
    );

    // =========================================================================
    // 6. Valuation - FIFO layers at standard cost per kg
    // =========================================================================
    const layerRows = [];
    PLAN.forEach((p) => p.fifo.forEach((l) => layerRows.push({
      Material_ID: mat(p.code)._id,
      Receipt_Transaction_ID: grOf(p.code)._id,
      Receipt_Date: daysAgo(l.days),
      Original_Quantity: l.orig,
      Remaining_Quantity: l.remaining,
      Unit_Cost: l.cost,
      ...audit
    })));
    const layerDocs = await FIFOCostLayer.create(layerRows);

    const valuationDocs = await InventoryValuation.create(PLAN.map((p) => ({
      materialId: mat(p.code)._id,
      fifoValuation: p.fifoValue,
      weightedAverageCost: p.wac,
      lastCalculatedDate: daysAgo(1)
    })));

    const totalFifo = PLAN.reduce((s, p) => s + p.fifoValue, 0);
    const summaryValDocs = await ValuationSummary.create([{
      Plant_ID: plant?._id,
      Total_FIFO_Valuation: totalFifo,
      Total_WAC_Tracked_Items: PLAN.length,
      Last_Global_Calculation: daysAgo(1),
      ...audit
    }]);

    // =========================================================================
    // 7. Optimization / dead stock
    // =========================================================================
    const optDocs = await InventoryOptimization.create(PLAN.map((p) => ({
      materialId: mat(p.code)._id,
      reorderLevel: p.rop,
      safetyStock: mat(p.code).Safety_Stock_Level || 0,
      abcClassification: p.abc,
      isDeadStock: !!p.dead,
      lastAnalysisDate: daysAgo(1)
    })));

    const deadDocs = await DeadStockLog.create([
      {
        Material_ID: mat('MAT-008')._id,
        Last_Movement_Date: daysAgo(214),
        Days_Inactive: 214,
        Current_Stock_Value: Math.round(byCode['MAT-008'].fifoValue),
        ...audit
      },
      {
        Material_ID: mat('MAT-010')._id,
        Last_Movement_Date: daysAgo(96),
        Days_Inactive: 96,
        Current_Stock_Value: Math.round(byCode['MAT-010'].fifoValue),
        ...audit
      }
    ]);

    return {
      storagelocations: locDocs.length,
      storagezones: zoneDocs.length,
      racks: rackDocs.length,
      bins: binDocs.length,
      inventorysummaries: summaryDocs.length,
      inventorytransactions: legacyDocs.length,
      invtxnheaders: headerDocs.length,
      invtxnlines: lineDocs.length,
      invtxnbatches: batchDocs.length,
      invledgers: ledgerDocs.length,
      trackingentities: entityDocs.length,
      entitygenealogies: genealogyDocs.length,
      inventorytraceabilities: legacyTraceDocs.length,
      fifocostlayers: layerDocs.length,
      inventoryvaluations: valuationDocs.length,
      valuationsummaries: summaryValDocs.length,
      inventoryoptimizations: optDocs.length,
      deadstocklogs: deadDocs.length
    };
  }
};
