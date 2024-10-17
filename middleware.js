const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        
        const authHeader = req.headers.authorization;
        
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is missing.'
            });
        }

        try {
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = authMiddleware;