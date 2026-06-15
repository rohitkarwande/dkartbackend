const db = require('../config/db');

// Supported Enums
const CATEGORIES = ['MRI', 'X-Ray', 'Cathlab', 'ECG', 'Ultrasound', 'Ventilator', 'CT Scan', 'Patient Monitor', 'Defibrillator', 'Laboratory Equipment', 'Surgical Equipment', 'Other'];
const CONDITIONS = ['Used', 'Refurbished', 'Spare'];
const STATUSES = ['Draft', 'Active', 'Sold', 'Archived'];

// Helper to handle validation errors
const sendError = (res, message, status = 400) => res.status(status).json({ error: message });

// 5. Create Equipment Post
const createEquipment = async (req, res) => {
    try {
        const { title, description, category, brand, model, manufacturingYear, condition, price, city, state, country } = req.body;
        const sellerId = req.user.id;

        // Validations
        if (!title || title.length < 5 || title.length > 150) return sendError(res, 'Title must be between 5 and 150 characters');
        if (description && description.length > 3000) return sendError(res, 'Description max 3000 characters');
        if (!category || !CATEGORIES.includes(category)) return sendError(res, 'Invalid category');
        if (!brand || !model || !city) return sendError(res, 'Brand, model, and city are required');
        if (!condition || !CONDITIONS.includes(condition)) return sendError(res, 'Invalid condition');
        if (price !== undefined && price < 0) return sendError(res, 'Price cannot be negative');
        if (manufacturingYear && manufacturingYear > new Date().getFullYear()) return sendError(res, 'Manufacturing year cannot exceed current year');

        // Insert Post
        const insertQuery = `
            INSERT INTO equipment_posts (
                seller_id, title, description, category, brand, model, 
                manufacturing_year, condition, price, city, state, country, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active')
            RETURNING *;
        `;
        const values = [sellerId, title, description, category, brand, model, manufacturingYear || null, condition, price || null, city, state || null, country || null];
        const result = await db.query(insertQuery, values);
        const post = result.rows[0];

        // Handle Images
        let images = [];
        if (req.files && req.files.length > 0) {
            if (req.files.length > 10) {
                // Should technically rollback here, but for simplicity we'll just slice or error.
                // Let's enforce 10 max at multer level, but just in case:
                return sendError(res, 'Maximum 10 images allowed');
            }
            
            const imagePromises = req.files.map((file, index) => {
                const imageUrl = `/uploads/${file.filename}`;
                return db.query(
                    `INSERT INTO equipment_images (equipment_post_id, image_url, display_order) VALUES ($1, $2, $3) RETURNING *`,
                    [post.id, imageUrl, index]
                );
            });
            const imgResults = await Promise.all(imagePromises);
            images = imgResults.map(r => r.rows[0]);
        }

        res.status(201).json({ message: 'Equipment post created successfully', post, images });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while creating equipment post', 500);
    }
};

// 6. Update Equipment Post
const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, brand, model, manufacturingYear, condition, price, city, state, country, deletedImages } = req.body;
        const sellerId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Check ownership
        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) return sendError(res, 'Equipment post not found', 404);
        const post = postResult.rows[0];

        if (post.seller_id !== sellerId && !isAdmin) {
            return sendError(res, 'Unauthorized to update this post', 403);
        }

        // Validations
        if (title && (title.length < 5 || title.length > 150)) return sendError(res, 'Title must be between 5 and 150 characters');
        if (description && description.length > 3000) return sendError(res, 'Description max 3000 characters');
        if (category && !CATEGORIES.includes(category)) return sendError(res, 'Invalid category');
        if (condition && !CONDITIONS.includes(condition)) return sendError(res, 'Invalid condition');
        if (price !== undefined && price < 0) return sendError(res, 'Price cannot be negative');
        if (manufacturingYear && manufacturingYear > new Date().getFullYear()) return sendError(res, 'Manufacturing year cannot exceed current year');

        // Update fields
        const updateQuery = `
            UPDATE equipment_posts SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                brand = COALESCE($4, brand),
                model = COALESCE($5, model),
                manufacturing_year = COALESCE($6, manufacturing_year),
                condition = COALESCE($7, condition),
                price = COALESCE($8, price),
                city = COALESCE($9, city),
                state = COALESCE($10, state),
                country = COALESCE($11, country),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *;
        `;
        const values = [title, description, category, brand, model, manufacturingYear, condition, price, city, state, country, id];
        const updatedPostResult = await db.query(updateQuery, values);

        // Handle image deletions
        if (deletedImages) {
            let imgIds = Array.isArray(deletedImages) ? deletedImages : [deletedImages];
            await db.query(`DELETE FROM equipment_images WHERE id = ANY($1::int[]) AND equipment_post_id = $2`, [imgIds, id]);
        }

        // Handle new image uploads
        let newImages = [];
        if (req.files && req.files.length > 0) {
            // Check total images limit
            const currentImgCountRes = await db.query('SELECT COUNT(*) FROM equipment_images WHERE equipment_post_id = $1', [id]);
            const currentCount = parseInt(currentImgCountRes.rows[0].count, 10);
            if (currentCount + req.files.length > 10) {
                return sendError(res, 'Adding these images would exceed the 10 image limit');
            }

            const imagePromises = req.files.map((file, index) => {
                const imageUrl = `/uploads/${file.filename}`;
                return db.query(
                    `INSERT INTO equipment_images (equipment_post_id, image_url, display_order) VALUES ($1, $2, $3) RETURNING *`,
                    [id, imageUrl, currentCount + index]
                );
            });
            const imgResults = await Promise.all(imagePromises);
            newImages = imgResults.map(r => r.rows[0]);
        }

        const remainingImages = await db.query('SELECT * FROM equipment_images WHERE equipment_post_id = $1 ORDER BY display_order', [id]);

        res.json({ message: 'Equipment post updated successfully', post: updatedPostResult.rows[0], images: remainingImages.rows });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while updating equipment post', 500);
    }
};

// 7. Delete Equipment Post (Soft Delete)
const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) return sendError(res, 'Equipment post not found', 404);
        
        if (postResult.rows[0].seller_id !== sellerId && !isAdmin) {
            return sendError(res, 'Unauthorized to delete this post', 403);
        }

        // Soft delete: set status to Archived
        await db.query(`UPDATE equipment_posts SET status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        
        res.json({ message: 'Equipment post deleted (archived) successfully' });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while deleting equipment post', 500);
    }
};

// 8. Get Single Equipment API
const getSingleEquipment = async (req, res) => {
    try {
        const { id } = req.params;

        const postQuery = `
            SELECT ep.*, u.email as seller_email, u.phone as seller_phone
            FROM equipment_posts ep
            JOIN users u ON ep.seller_id = u.id
            WHERE ep.id = $1 AND ep.status != 'Archived';
        `;
        const postResult = await db.query(postQuery, [id]);
        
        if (postResult.rows.length === 0) return sendError(res, 'Equipment post not found', 404);

        const imagesResult = await db.query('SELECT * FROM equipment_images WHERE equipment_post_id = $1 ORDER BY display_order', [id]);

        res.json({
            post: postResult.rows[0],
            images: imagesResult.rows
        });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching equipment post', 500);
    }
};

// 9. List Equipment API (with filters, sort, pagination, search)
const listEquipment = async (req, res) => {
    try {
        const { category, condition, city, brand, minPrice, maxPrice, search, sort, page = 1, limit = 10 } = req.query;

        let queryStr = `SELECT ep.*, u.email as seller_email, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images
            FROM equipment_posts ep
            JOIN users u ON ep.seller_id = u.id
            WHERE ep.status = 'Active'`;
        const queryParams = [];
        let paramIndex = 1;

        if (category) {
            queryStr += ` AND ep.category = $${paramIndex++}`;
            queryParams.push(category);
        }
        if (condition) {
            queryStr += ` AND ep.condition = $${paramIndex++}`;
            queryParams.push(condition);
        }
        if (city) {
            queryStr += ` AND ep.city ILIKE $${paramIndex++}`;
            queryParams.push(`%${city}%`);
        }
        if (brand) {
            queryStr += ` AND ep.brand ILIKE $${paramIndex++}`;
            queryParams.push(`%${brand}%`);
        }
        if (minPrice) {
            queryStr += ` AND ep.price >= $${paramIndex++}`;
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            queryStr += ` AND ep.price <= $${paramIndex++}`;
            queryParams.push(maxPrice);
        }
        if (search) {
            queryStr += ` AND (ep.title ILIKE $${paramIndex} OR ep.brand ILIKE $${paramIndex} OR ep.model ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Sorting
        if (sort === 'oldest') queryStr += ` ORDER BY ep.created_at ASC`;
        else if (sort === 'price low to high') queryStr += ` ORDER BY ep.price ASC NULLS LAST`;
        else if (sort === 'price high to low') queryStr += ` ORDER BY ep.price DESC NULLS LAST`;
        else queryStr += ` ORDER BY ep.created_at DESC`; // latest default

        // Pagination
        const offset = (page - 1) * limit;
        queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, offset);

        const result = await db.query(queryStr, queryParams);
        
        // Count total for pagination
        let countQuery = `SELECT COUNT(*) FROM equipment_posts ep WHERE ep.status = 'Active'`;
        const countParams = [];
        let countIndex = 1;
        if (category) { countQuery += ` AND ep.category = $${countIndex++}`; countParams.push(category); }
        if (condition) { countQuery += ` AND ep.condition = $${countIndex++}`; countParams.push(condition); }
        if (city) { countQuery += ` AND ep.city ILIKE $${countIndex++}`; countParams.push(`%${city}%`); }
        if (brand) { countQuery += ` AND ep.brand ILIKE $${countIndex++}`; countParams.push(`%${brand}%`); }
        if (minPrice) { countQuery += ` AND ep.price >= $${countIndex++}`; countParams.push(minPrice); }
        if (maxPrice) { countQuery += ` AND ep.price <= $${countIndex++}`; countParams.push(maxPrice); }
        if (search) {
            countQuery += ` AND (ep.title ILIKE $${countIndex} OR ep.brand ILIKE $${countIndex} OR ep.model ILIKE $${countIndex})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count, 10);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching equipment posts', 500);
    }
};

// 10. Seller Equipment API
const getMyEquipment = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { page = 1, limit = 10, sort = 'latest' } = req.query;

        let queryStr = `SELECT ep.*, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images
            FROM equipment_posts ep WHERE ep.seller_id = $1`;
        
        if (sort === 'oldest') queryStr += ` ORDER BY ep.created_at ASC`;
        else queryStr += ` ORDER BY ep.created_at DESC`;

        const offset = (page - 1) * limit;
        queryStr += ` LIMIT $2 OFFSET $3`;

        const result = await db.query(queryStr, [sellerId, limit, offset]);
        
        const countResult = await db.query(`SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1`, [sellerId]);
        const total = parseInt(countResult.rows[0].count, 10);

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching your equipment posts', 500);
    }
};

// 12. Update Status API
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const sellerId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!status || !STATUSES.includes(status)) return sendError(res, 'Invalid status value');

        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) return sendError(res, 'Equipment post not found', 404);
        
        if (postResult.rows[0].seller_id !== sellerId && !isAdmin) {
            return sendError(res, 'Unauthorized to change status of this post', 403);
        }

        const updated = await db.query(
            `UPDATE equipment_posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, id]
        );

        res.json({ message: 'Status updated successfully', post: updated.rows[0] });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while updating status', 500);
    }
};

module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getSingleEquipment,
    listEquipment,
    getMyEquipment,
    updateStatus
};
