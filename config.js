'use strict';

exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/best-memories';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test-best-memories';
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.TEST_JWT_SECRET = process.env.TEST_JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

exports.S3_BUCKET = process.env.S3_BUCKET;
exports.S3_URL = process.env.S3_URL;