const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware.js');
const { verifyToken, isAdmin, isFacilitatorOrAdmin } = require('../middleware/auth.middleware.js');
const certificateController = require('../controllers/certificate.controller.js');

// Public route - Verify certificate
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

// Protected routes
// Get my certificates (learner)
router.get('/my', verifyToken, certificateController.getMyCertificates);

// Get all certificates (admin)
router.get('/', verifyToken, isAdmin, certificateController.getAllCertificates);

// Get certificate by ID
router.get('/:id', verifyToken, [
    param('id').isUUID().withMessage('Valid certificate ID required')
], validate, certificateController.getCertificateById);

// Get certificate PDF data
router.get('/:id/pdf-data', verifyToken, [
    param('id').isUUID().withMessage('Valid certificate ID required')
], validate, certificateController.getCertificatePdfData);

// Issue certificate (admin/facilitator)
router.post('/', verifyToken, isFacilitatorOrAdmin, [
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('courseId').isUUID().withMessage('Valid course ID required')
], validate, certificateController.issueCertificate);

module.exports = router;
