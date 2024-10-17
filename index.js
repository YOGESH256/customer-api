const express = require('express');
const { validate: validateUUID } = require('uuid');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'YOUR_DATABASE',
    password: 'YOUR_PASSWORD',
    port: '5432',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000
});

const validateUUIDMiddleware = (req, res, next) => {
    const uuid = req.params.id;
    
    if (!uuid) {
        return next();
    }

    if (!validateUUID(uuid)) {
        const error = new Error('Invalid UUID format');
        error.status = 400;
        return next(error);
    }
    next();
};


const validateDateParams = (req, res, next) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        const error = new Error('Start date and end date are required');
        error.status = 400;
        return next(error);
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        const error = new Error('Invalid date format. Use YYYY-MM-DD');
        error.status = 400;
        return next(error);
    }

    
    if (new Date(startDate) > new Date(endDate)) {
        const error = new Error('Start date must be before end date');
        error.status = 400;
        return next(error);
    }

    next();
};

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}



const getUsersData = async (startDate, endDate, location, page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    
    
    const query = {
        text: `
            SELECT 
                u.*,
                COUNT(*) OVER() as total_count
            FROM public."Users" u
            WHERE 1=1
                ${location ? 'AND location = $1' : ''}
                AND start_date >= $${location ? '2' : '1'}::date 
                AND end_date <= $${location ? '3' : '2'}::date
            ORDER BY start_date DESC
            LIMIT $${location ? '4' : '3'} 
            OFFSET $${location ? '5' : '4'}
        `,
        values: location 
            ? [location, startDate, endDate, limit, offset]
            : [startDate, endDate, limit, offset]
    };

   
    const result = await pool.query(query);
    
    const total = result.rows[0]?.total_count || 0;

    return {
        data: result.rows.map(row => {
            const { total_count, ...userData } = row;
            return userData;
        }),
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};


app.get('/api/customer/:id?', validateUUIDMiddleware, validateDateParams, async (req, res, next) => {
    try {
        const { startDate, endDate, location } = req.body;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

        const result = await getUsersData(startDate, endDate, location, page, limit);

        res.status(200).json({
            status: 'success',
            ...result
        });

    } catch (error) {
        next(error);
    }
});