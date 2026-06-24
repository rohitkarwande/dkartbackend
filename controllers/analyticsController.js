const db = require('../config/db');

// 1. Demand Reports - Most Searched & Most Viewed
const getDemandReports = async (req, res) => {
    try {
        const mostSearched = await db.query(`
            SELECT search_query, COUNT(*) as search_count
            FROM search_analytics
            GROUP BY search_query
            ORDER BY search_count DESC
            LIMIT 10
        `);

        const mostViewed = await db.query(`
            SELECT ep.id, ep.title, ep.brand, ep.category, em.view_count
            FROM engagement_metrics em
            JOIN equipment_posts ep ON em.equipment_post_id = ep.id
            ORDER BY em.view_count DESC
            LIMIT 10
        `);

        res.json({
            mostSearched: mostSearched.rows,
            mostViewed: mostViewed.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching demand reports' });
    }
};

// 2. Geographic Analytics & 4. Heatmap Data
const getGeographicAnalytics = async (req, res) => {
    try {
        const demandByCity = await db.query(`
            SELECT city, COUNT(*) as demand_count
            FROM analytics_events ae
            JOIN equipment_posts ep ON ae.equipment_post_id = ep.id
            WHERE ae.event_type = 'view' OR ae.event_type = 'inquiry'
            GROUP BY city
            ORDER BY demand_count DESC
        `);

        const demandByState = await db.query(`
            SELECT state, COUNT(*) as demand_count
            FROM analytics_events ae
            JOIN equipment_posts ep ON ae.equipment_post_id = ep.id
            WHERE ae.event_type = 'view' OR ae.event_type = 'inquiry'
            GROUP BY state
            ORDER BY demand_count DESC
        `);

        res.json({
            demandByCity: demandByCity.rows,
            demandByState: demandByState.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching geographic analytics' });
    }
};

// 3. Trending Equipment
const getTrendingEquipment = async (req, res) => {
    try {
        // Popularity score = (view_count * 1) + (save_count * 3) + (inquiry_count * 5)
        const trending = await db.query(`
            SELECT ep.id, ep.title, ep.category, ep.price, em.view_count, em.save_count, em.inquiry_count,
                   (em.view_count * 1 + em.save_count * 3 + em.inquiry_count * 5) as popularity_score
            FROM engagement_metrics em
            JOIN equipment_posts ep ON em.equipment_post_id = ep.id
            WHERE ep.status = 'Active'
            ORDER BY popularity_score DESC
            LIMIT 10
        `);

        res.json(trending.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching trending equipment' });
    }
};

// 5. Conversion Funnel Analytics
const getConversionFunnel = async (req, res) => {
    try {
        const searchTotal = await db.query("SELECT COUNT(*) as count FROM search_analytics");
        const viewTotal = await db.query("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'view'");
        const inquiryTotal = await db.query("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'inquiry'");
        const dealTotal = await db.query("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'deal'");

        res.json({
            funnel: {
                search: parseInt(searchTotal.rows[0].count, 10),
                view: parseInt(viewTotal.rows[0].count, 10),
                inquiry: parseInt(inquiryTotal.rows[0].count, 10),
                deal: parseInt(dealTotal.rows[0].count, 10)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching conversion funnel' });
    }
};

module.exports = {
    getDemandReports,
    getGeographicAnalytics,
    getTrendingEquipment,
    getConversionFunnel
};
