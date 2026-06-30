const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

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

        // Auto Moderation
        let initialStatus = 'Active';
        if (!req.files || req.files.length === 0) {
            initialStatus = 'Draft'; // Missing images moderation
        } else if (price === 0 || price > 100000000) {
            initialStatus = 'Draft'; // Suspicious price moderation
        }

        // Insert Post
        const insertQuery = `
            INSERT INTO equipment_posts (
                seller_id, title, description, category, brand, model, 
                manufacturing_year, condition, price, city, state, country, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const values = [sellerId, title, description, category, brand, model, manufacturingYear || null, condition, price || null, city, state || null, country || null, initialStatus];
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

        // Notify Admins (socket + email)
        const { notifyAdmins } = require('../services/adminNotificationService');
        notifyAdmins(req.io, 'NEW_LISTING', `A new equipment listing was created: ${title}`, post.id);

        const { emailNewEquipmentListing } = require('../services/emailService');
        emailNewEquipmentListing(req.user?.email || req.user?.phone, req.user?.id, title, post.id);

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

        // Increment view count
        await db.query(
            `INSERT INTO engagement_metrics (equipment_post_id, view_count)
             VALUES ($1, 1)
             ON CONFLICT (equipment_post_id)
             DO UPDATE SET view_count = engagement_metrics.view_count + 1, updated_at = CURRENT_TIMESTAMP`,
            [id]
        );

        // Track view analytics
        const userId = req.user ? req.user.id : null;
        await db.query(`INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'view', $2)`, [userId, id]);

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
            WHERE ep.status IN ('Active', 'Sold')`;
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
        let isSearchActive = false;
        if (search) {
            isSearchActive = true;
            // Track search analytics
            const userId = req.user ? req.user.id : null;
            await db.query(`INSERT INTO search_analytics (user_id, search_query) VALUES ($1, $2)`, [userId, search]);

            // Track popular tags
            const tags = search.split(/\s+/).filter(t => t.length > 2);
            for (const tag of tags) {
                await db.query(
                    `INSERT INTO popular_tags (tag, search_count)
                     VALUES ($1, 1)
                     ON CONFLICT (tag)
                     DO UPDATE SET search_count = popular_tags.search_count + 1, last_searched_at = CURRENT_TIMESTAMP`,
                    [tag.toLowerCase()]
                );
            }

            // Prepare prefix matching tsquery (e.g. "ECG mach" -> "ECG:* & mach:*")
            const searchTerms = search.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 0);
            const tsQueryStr = searchTerms.map(term => `${term}:*`).join(' & ');

            queryStr += ` AND ep.search_vector @@ to_tsquery('english', $${paramIndex})`;
            queryParams.push(tsQueryStr);
            paramIndex++;
        }

        // Sorting
        if (sort === 'oldest') {
            queryStr += ` ORDER BY ep.created_at ASC`;
        } else if (sort === 'price low to high') {
            queryStr += ` ORDER BY ep.price ASC NULLS LAST`;
        } else if (sort === 'price high to low') {
            queryStr += ` ORDER BY ep.price DESC NULLS LAST`;
        } else {
            // Default sort: if searching, sort by relevance. Otherwise, sort by latest.
            if (isSearchActive) {
                queryStr += ` ORDER BY ts_rank(ep.search_vector, to_tsquery('english', $${paramIndex - 1})) DESC, ep.created_at DESC`;
            } else {
                queryStr += ` ORDER BY ep.created_at DESC`;
            }
        }

        // Pagination
        const offset = (page - 1) * limit;
        queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, offset);

        const result = await db.query(queryStr, queryParams);
        
        // Count total for pagination
        let countQuery = `SELECT COUNT(*) FROM equipment_posts ep WHERE ep.status IN ('Active', 'Sold')`;
        const countParams = [];
        let countIndex = 1;
        if (category) { countQuery += ` AND ep.category = $${countIndex++}`; countParams.push(category); }
        if (condition) { countQuery += ` AND ep.condition = $${countIndex++}`; countParams.push(condition); }
        if (city) { countQuery += ` AND ep.city ILIKE $${countIndex++}`; countParams.push(`%${city}%`); }
        if (brand) { countQuery += ` AND ep.brand ILIKE $${countIndex++}`; countParams.push(`%${brand}%`); }
        if (minPrice) { countQuery += ` AND ep.price >= $${countIndex++}`; countParams.push(minPrice); }
        if (maxPrice) { countQuery += ` AND ep.price <= $${countIndex++}`; countParams.push(maxPrice); }
        if (search) {
            const searchTerms = search.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 0);
            const tsQueryStr = searchTerms.map(term => `${term}:*`).join(' & ');
            countQuery += ` AND ep.search_vector @@ to_tsquery('english', $${countIndex})`;
            countParams.push(tsQueryStr);
            countIndex++;
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

// 13. Get Similar Listings
const getSimilarListings = async (req, res) => {
    try {
        const { id } = req.params;
        const postResult = await db.query('SELECT category, brand, condition FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) return sendError(res, 'Equipment post not found', 404);
        
        const { category, brand, condition } = postResult.rows[0];
        
        const queryStr = `
            SELECT ep.*, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images
            FROM equipment_posts ep
            WHERE ep.status IN ('Active', 'Sold') AND ep.id != $1 AND ep.category = $2
            ORDER BY 
                CASE WHEN ep.brand = $3 THEN 1 ELSE 0 END DESC,
                CASE WHEN ep.condition = $4 THEN 1 ELSE 0 END DESC,
                ep.created_at DESC
            LIMIT 5;
        `;
        const result = await db.query(queryStr, [id, category, brand, condition]);
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching similar listings', 500);
    }
};

// 14. Get Popular Tags
const getPopularTags = async (req, res) => {
    try {
        const result = await db.query('SELECT tag, search_count FROM popular_tags ORDER BY search_count DESC LIMIT 20');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching popular tags', 500);
    }
};

// 15. Get Engagement Metrics for Post
const getEngagementMetrics = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT view_count, save_count, inquiry_count FROM engagement_metrics WHERE equipment_post_id = $1', [id]);
        res.json(result.rows[0] || { view_count: 0, save_count: 0, inquiry_count: 0 });
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error while fetching engagement metrics', 500);
    }
};

// 16. Bulk Upload Equipment API
const bulkUploadEquipment = async (req, res) => {
    try {
        const sellerId = req.user.id;
        if (!req.file) return sendError(res, 'No CSV file uploaded');

        const results = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let successCount = 0;
                let failCount = 0;
                const errors = [];

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        const title = row.title || row.Title;
                        const category = row.category || row.Category;
                        const brand = row.brand || row.Brand;
                        const model = row.model || row.Model;
                        const condition = row.condition || row.Condition;
                        const price = row.price || row.Price || null;
                        const city = row.city || row.City;
                        const state = row.state || row.State || null;
                        const description = row.description || row.Description || '';
                        const year = row.manufacturing_year || row.Manufacturing_Year || null;

                        if (!title || !category || !brand || !model || !condition || !city) {
                            failCount++;
                            errors.push(`Row ${i + 2}: Missing required fields (title, category, brand, model, condition, city)`);
                            continue;
                        }

                        if (!CATEGORIES.includes(category) || !CONDITIONS.includes(condition)) {
                            failCount++;
                            errors.push(`Row ${i + 2}: Invalid category or condition`);
                            continue;
                        }

                        const insertQuery = `
                            INSERT INTO equipment_posts (
                                seller_id, title, description, category, brand, model, 
                                manufacturing_year, condition, price, city, state, status
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Draft')
                        `;
                        const values = [sellerId, title, description, category, brand, model, year, condition, price, city, state];
                        await db.query(insertQuery, values);
                        successCount++;
                    } catch (err) {
                        failCount++;
                        errors.push(`Row ${i + 2}: Database error - ${err.message}`);
                    }
                }

                // Delete the uploaded file after processing
                fs.unlinkSync(req.file.path);

                res.json({
                    message: 'Bulk upload completed',
                    successCount,
                    failCount,
                    errors
                });
            });
    } catch (error) {
        console.error(error);
        if (req.file) fs.unlinkSync(req.file.path);
        sendError(res, 'Server error during bulk upload', 500);
    }
};

module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getSingleEquipment,
    listEquipment,
    getMyEquipment,
    updateStatus,
    getSimilarListings,
    getPopularTags,
    getEngagementMetrics,
    bulkUploadEquipment
};
