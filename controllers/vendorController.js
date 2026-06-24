const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

// 1. Vendor Dashboard Metrics
const getDashboardMetrics = async (req, res) => {
    try {
        const vendorId = req.user.id;

        const totalListings = await db.query("SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1", [vendorId]);
        const activeListings = await db.query("SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1 AND status = 'Active'", [vendorId]);
        const closedDeals = await db.query("SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 AND status = 'Deal Closed'", [vendorId]);
        const inquiryCount = await db.query("SELECT COUNT(*) FROM inquiries WHERE seller_id = $1", [vendorId]);

        res.json({
            total_listings: parseInt(totalListings.rows[0].count, 10),
            active_listings: parseInt(activeListings.rows[0].count, 10),
            closed_deals: parseInt(closedDeals.rows[0].count, 10),
            inquiry_count: parseInt(inquiryCount.rows[0].count, 10)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching dashboard metrics' });
    }
};

// 2. Inventory Tracking (Updating stock)
const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity, reserved_quantity } = req.body;
        const vendorId = req.user.id;

        const result = await db.query(
            "UPDATE equipment_posts SET stock_quantity = COALESCE($1, stock_quantity), reserved_quantity = COALESCE($2, reserved_quantity), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND seller_id = $4 RETURNING *",
            [stock_quantity, reserved_quantity, id, vendorId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment post not found or unauthorized' });

        res.json({ message: 'Inventory updated', post: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error updating inventory' });
    }
};

// 3. Multi Location Support
const getLocations = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const result = await db.query("SELECT * FROM vendor_locations WHERE vendor_id = $1", [vendorId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error fetching locations' });
    }
};

const addLocation = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { branch_name, address, city, state, country, is_primary } = req.body;

        if (!branch_name) return res.status(400).json({ error: 'Branch name is required' });

        const result = await db.query(
            "INSERT INTO vendor_locations (vendor_id, branch_name, address, city, state, country, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [vendorId, branch_name, address, city, state, country, is_primary || false]
        );

        res.status(201).json({ message: 'Location added', location: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error adding location' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;
        const { branch_name, address, city, state, country, is_primary } = req.body;

        const result = await db.query(
            "UPDATE vendor_locations SET branch_name = COALESCE($1, branch_name), address = COALESCE($2, address), city = COALESCE($3, city), state = COALESCE($4, state), country = COALESCE($5, country), is_primary = COALESCE($6, is_primary) WHERE id = $7 AND vendor_id = $8 RETURNING *",
            [branch_name, address, city, state, country, is_primary, id, vendorId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Location not found or unauthorized' });

        res.json({ message: 'Location updated', location: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error updating location' });
    }
};

const deleteLocation = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;

        const result = await db.query("DELETE FROM vendor_locations WHERE id = $1 AND vendor_id = $2 RETURNING *", [id, vendorId]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Location not found or unauthorized' });

        res.json({ message: 'Location deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error deleting location' });
    }
};

// 4. Bulk CSV Upload
const bulkUploadListings = async (req, res) => {
    try {
        const vendorId = req.user.id;
        if (!req.file) return res.status(400).json({ error: 'CSV file required' });

        const results = [];
        const errors = [];
        let rowCount = 0;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const inserted = [];
                for (const row of results) {
                    rowCount++;
                    try {
                        const { title, description, category, brand, model, manufacturing_year, condition, price, city, state, country, stock_quantity } = row;
                        
                        if (!title || !category || !brand || !model || !condition || !city) {
                            errors.push({ row: rowCount, error: 'Missing required fields' });
                            continue;
                        }

                        const result = await db.query(`
                            INSERT INTO equipment_posts (
                                seller_id, title, description, category, brand, model, 
                                manufacturing_year, condition, price, city, state, country, status, stock_quantity
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', $13)
                            RETURNING *
                        `, [
                            vendorId, title, description, category, brand, model,
                            manufacturing_year ? parseInt(manufacturing_year) : null,
                            condition,
                            price ? parseFloat(price) : null,
                            city, state, country,
                            stock_quantity ? parseInt(stock_quantity) : 1
                        ]);
                        
                        inserted.push(result.rows[0]);
                    } catch (err) {
                        errors.push({ row: rowCount, error: err.message });
                    }
                }
                
                // cleanup file
                fs.unlinkSync(req.file.path);

                res.json({
                    message: 'Bulk upload completed',
                    totalProcessed: rowCount,
                    successCount: inserted.length,
                    errorCount: errors.length,
                    errors
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error during bulk upload' });
    }
};

module.exports = {
    getDashboardMetrics,
    updateInventory,
    getLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    bulkUploadListings
};
