const db = require('../config/db');

const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            res.json = originalJson;
            
            // Log if successful
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user ? req.user.id : null;
                const ip = req.ip || req.connection.remoteAddress;
                let entityId = req.params.id || null;
                
                db.query(
                    "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5)",
                    [userId, action, entityType, entityId, ip]
                ).catch(err => console.error('Audit Log Error:', err));
            }
            
            return res.json(body);
        };
        next();
    };
};

module.exports = auditLog;
