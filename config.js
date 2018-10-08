'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/best-memories';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test-best-memories';
exports.PORT = process.env.PORT || 8080;
exports.S3_BUCKET = process.env.S3_BUCKET;
exports.S3_URL = process.env.S3_URL;