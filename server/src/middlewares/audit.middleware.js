const { AuditLog, LoginHistory } = require('../models/Audit');

const logActivity = (moduleName) => {
  return async (req, res, next) => {
    // Intercept response to log activity AFTER successful request
    const originalSend = res.send;
    
    res.send = function (data) {
      res.send = originalSend;
      res.send(data);
      
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let action = 'READ';
          if (req.method === 'POST') action = 'CREATE';
          if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
          if (req.method === 'DELETE') action = 'DELETE';

          if (action !== 'READ') {
            const parsedData = JSON.parse(data);
            AuditLog.create({
              action,
              module: moduleName,
              recordId: parsedData.data?._id || req.params.id,
              newValue: req.body,
              changedBy: req.user?.id,
              ipAddress: req.ip
            });
          }
        }
      } catch (err) {
        console.error('Audit Logging Error:', err);
      }
    };
    
    next();
  };
};

module.exports = { logActivity };
