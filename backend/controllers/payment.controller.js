const pool = require('../config/db.js');
const { v4: uuidv4 } = require('uuid');
const { notifyAdmins } = require('./notification.controller.js');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getSetting } = require('./settings.controller.js');

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

    console.log('Initiating payment for courseId:', courseId);

    // Get course price - more relaxed check
    const courseResult = await pool.query(
      'SELECT id, title, price, status FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      console.error(`Course with ID ${courseId} not found in database.`);
      // Log available course IDs for debugging
      const allCourses = await pool.query('SELECT id, title, status FROM courses');
      console.log('Available courses:', allCourses.rows);
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];
    console.log('Found course:', course);

    if (course.status === 'draft') {
      return res.status(400).json({ error: 'Cannot purchase a draft course' });
    }

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
      [req.user.id, courseId, course.price, 'USD', 'pending', paymentMethod || 'mock', transactionId]
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

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    // 1. Get Razorpay keys from settings
    const keyId = await getSetting('razorpay_key_id');
    const secretKey = await getSetting('razorpay_secret_key');

    if (!keyId || !secretKey) {
      return res.status(500).json({ error: 'Razorpay is not configured by admin' });
    }

    console.log('Creating Razorpay order for courseId:', courseId);

    // 2. Get course price - more relaxed check
    const courseResult = await pool.query(
      'SELECT id, title, price, status FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      console.error(`Course with ID ${courseId} not found in database for Razorpay order.`);
      // Log available course IDs for debugging
      const allCourses = await pool.query('SELECT id, title, status FROM courses');
      console.log('Available courses:', allCourses.rows);
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];
    console.log('Found course for Razorpay:', course);

    if (course.status === 'draft') {
      return res.status(400).json({ error: 'Cannot purchase a draft course' });
    }
    const amountInPaise = Math.round(course.price * 100);

    // 3. Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: secretKey,
    });

    // 4. Create Order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${uuidv4().slice(0, 8)}`,
    };

    const order = await razorpay.orders.create(options);

    // 5. Create pending payment record
    const transactionId = order.id;
    await pool.query(
      `INSERT INTO payments (user_id, course_id, amount, currency, status, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, courseId, course.price, 'INR', 'pending', 'razorpay', transactionId]
    );

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      courseTitle: course.title
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Get secret key
    const secretKey = await getSetting('razorpay_secret_key');

    // 2. Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secretKey)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 3. Update payment record
    const paymentResult = await pool.query(
      'UPDATE payments SET status = $1, payment_id = $2, updated_at = NOW() WHERE transaction_id = $3 RETURNING *',
      ['completed', razorpay_payment_id, razorpay_order_id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = paymentResult.rows[0];

    // 4. Create enrollment
    await pool.query(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [payment.user_id, payment.course_id]
    );

    // 5. Notify admins
    notifyAdmins(
      'Payment Successful',
      `Payment of ₹${payment.amount} received for course ID: ${payment.course_id}`,
      'success',
      `/admin/payments`
    ).catch(err => console.error('Notification error:', err));

    res.json({ message: 'Payment verified and course unlocked', status: 'success' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
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

      // Notify admins - Fire and forget
      notifyAdmins(
        'Payment Received',
        `Payment of $${payment.amount} received for course ID: ${payment.course_id}`,
        'success',
        `/admin/payments`
      ).catch(err => console.error('Notification error:', err));
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

// Manual Activation (Admin)
const activateCourse = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { userId, courseId, notes } = req.body;

    // 1. Verify User and Course
    const courseRes = await client.query('SELECT price, title FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseRes.rows[0];

    // 2. Check Enrollment
    const enrollCheck = await client.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (enrollCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already enrolled' });
    }

    // 3. Create "Manual" Payment Record
    const transactionId = `MAN-${uuidv4().slice(0, 8).toUpperCase()}`;
    const paymentRes = await client.query(
      `INSERT INTO payments (user_id, course_id, amount, currency, status, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, courseId, 0, 'USD', 'completed', 'manual', transactionId] // Amount 0 for manual? or course.price? Let's use 0 to indicate no system revenue collected, or maybe add a note column?
      // Notes are not in schema. I'll just use 0 amount for now as it's a "grant".
    );

    // 4. Enroll
    await client.query(
      `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)`,
      [userId, courseId]
    );

    await client.query('COMMIT');

    // Notify admins (audit log)
    notifyAdmins(
      'Manual Course Activation',
      `Course "${course.title}" manually activated for user ID: ${userId}`,
      'warning',
      `/admin/enrollments`
    ).catch(err => console.error('Notification error', err));
    res.json({ message: 'Course activated successfully', paymentId: paymentRes.rows[0].id });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Manual activation error:', error);
    res.status(500).json({ error: 'Failed to activate course' });
  } finally {
    client.release();
  }
};

module.exports = {
  getMyPayments,
  createPayment,
  completePayment,
  getAllPayments,
  getPaymentStats,
  refundPayment,
  activateCourse,
  createRazorpayOrder,
  verifyRazorpayPayment
};
