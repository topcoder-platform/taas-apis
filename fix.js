const NylasWebhookAuth = {
    secret: process.env.NYLAS_WEBHOOK_SECRET || 'unique-secret-string',
    validate: function(req, res, next) {
        const incoming = req.query.authToken;
        if (incoming === this.secret) {
            return next();
        }
        if (incoming) {
            return res.status(401).json({ error: 'authTokenMismatch' });
        }
        return next();
    }
};
module.exports = NylasWebhookAuth;
module.exports.getSecret = () => NylasWebhookAuth.secret;