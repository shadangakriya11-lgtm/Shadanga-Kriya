const pool = require('../config/db.js');
const { v4: uuidv4 } = require('uuid');

// Get user's payments
const getMyPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.title as course_title
       FROM payments p
       LEFT JOIN courses c ON p.course_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const payments = result.rows.map(p => ({
      id: p.id,
      courseId: p.course_id,
      courseTitle: p.course_title,
      amount: parseFloat(p.amount),
      currency: p.currency,
      status: p.status,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      createdAt: p.created_at
    }));

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

// Create payment (initiate)
const createPayment = async (req, res) => {
  try {
    const { courseId, paymentMethod } = req.body;

    // Get course price
    const courseResult = await pool.query(
      'SELECT id, title, price FROM courses WHERE id = $1 AND status = $2',
      [courseId, 'published']
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Check if already enrolled
    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Generate transaction ID
    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create payment record
    const result = await pool.query(
      `INSERT INTO payments (user_id, course_id, amount, currency, status, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, courseId, course.price, 'USD', 'pending', paymentMethod, transactionId]
    );

    const payment = result.rows[0];

    res.status(201).json({
      message: 'Payment initiated',
      payment: {
        id: payment.id,
        courseId: payment.course_id,
        courseTitle: course.title,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transaction_id
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Complete payment (webhook simulation)
const completePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status = 'completed' } = req.body;

    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, paymentId]
    );

    // If completed, create enrollment
    if (status === 'completed') {
      await pool.query(
        `INSERT INTO enrollments (user_id, course_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [payment.user_id, payment.course_id]
      );
    }

    res.json({
      message: `Payment ${status}`,
      paymentId,
      status
    });
  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
};

// Get all payments (admin)
const getAllPayments = async (req, res) => {
  try {
    const { status, userId, courseId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, 
             c.title as course_title,
             u.first_name, u.last_name, u.email
       FROM payments p
       LEFT JOIN courses c ON p.course_id = c.id
       JOIN users u ON p.user_id = u.id
       WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (userId) {
      query += ` AND p.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND p.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    // Get count
    const countResult = await pool.query(
      query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const payments = result.rows.map(p => ({
      id: p.id,
      courseId: p.course_id,
      courseTitle: p.course_title,
      userId: p.user_id,
      userName: `${p.first_name} ${p.last_name}`,
      userEmail: p.email,
      amount: parseFloat(p.amount),
      currency: p.currency,
      status: p.status,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      createdAt: p.created_at
    }));

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

// Get payment stats
const getPaymentStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'), 0) as revenue_this_month
      FROM payments
    `);

    res.json({
      total: parseInt(stats.rows[0].total),
      completed: parseInt(stats.rows[0].completed),
      pending: parseInt(stats.rows[0].pending),
      failed: parseInt(stats.rows[0].failed),
      totalRevenue: parseFloat(stats.rows[0].total_revenue),
      revenueThisMonth: parseFloat(stats.rows[0].revenue_this_month)
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to get payment stats' });
  }
};

// Refund payment (admin)
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await pool.query(
      `UPDATE payments SET status = 'refunded', updated_at = NOW()
       WHERE id = $1 AND status = 'completed'
       RETURNING *`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found or not eligible for refund' });
    }

    res.json({
      message: 'Payment refunded',
      paymentId
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};

module.exports = {
  getMyPayments,
  createPayment,
  completePayment,
  getAllPayments,
  getPaymentStats,
  refundPayment
};
