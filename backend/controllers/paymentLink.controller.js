const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');

// Helper to get setting
const getSetting = async (key) => {
  const result = await pool.query(
    'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
    [key]
  );
  return result.rows[0]?.setting_value || null;
};

/**
 * Generate payment link for a course
 * POST /api/payment-links/generate
 */
exports.generatePaymentLink = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Get course details
    const courseResult = await pool.query(
      'SELECT id, title, price FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];
    
    // Generate payment link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const courseSlug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const paymentLink = `${baseUrl}/pay/${courseId}/${courseSlug}`;

    res.json({
      success: true,
      paymentLink,
      course: {
        id: course.id,
        title: course.title,
        price: course.price
      }
    });
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
};

/**
 * Get course details for payment page
 * GET /api/payment-links/course/:courseId
 */
exports.getCourseForPayment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT 
        c.id, c.title, c.description, c.price, c.duration, c.thumbnail_url,
        COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.id = $1 AND c.status = 'active'
      GROUP BY c.id`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    res.json({
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching course for payment:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
};

/**
 * Process payment link payment
 * POST /api/payment-links/process
 */
exports.processPaymentLinkPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, email, courseId, discountCode } = req.body;

    if (!name || !email || !courseId) {
      return res.status(400).json({ 
        error: 'Name, email, and course ID are required' 
      });
    }

    await client.query('BEGIN');

    // 1. Check if user exists
    let userResult = await client.query(
      'SELECT id, email, first_name, last_name FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    let userId;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // Create new user with default password
      const defaultPassword = 'Password@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Generate unique user_id
      const userIdResult = await client.query(
        'SELECT COUNT(*) as count FROM users'
      );
      const userCount = parseInt(userIdResult.rows[0].count) + 1;
      const generatedUserId = `USR-${new Date().getFullYear()}-${String(userCount).padStart(6, '0')}`;

      const newUserResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, user_id, role, status)
         VALUES ($1, $2, $3, $4, $5, 'learner', 'active')
         RETURNING id, email, first_name, last_name`,
        [email, hashedPassword, firstName, lastName, generatedUserId]
      );

      userId = newUserResult.rows[0].id;
      isNewUser = true;

      // Add user role
      await client.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [userId, 'learner']
      );

      console.log('Created new user:', email);
    } else {
      userId = userResult.rows[0].id;
      console.log('Existing user found:', email);
    }

    // 2. Get course details
    const courseResult = await client.query(
      'SELECT id, title, price FROM courses WHERE id = $1 AND status = $2',
      [courseId, 'active']
    );

    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    const course = courseResult.rows[0];
    let finalAmount = course.price;
    let discountInfo = null;

    // 3. Validate discount code if provided
    if (discountCode) {
      const discountResult = await client.query(
        `SELECT 
          dc.*,
          EXISTS(
            SELECT 1 FROM discount_code_courses dcc 
            WHERE dcc.discount_code_id = dc.id AND dcc.course_id = $2
          ) as applies_to_course
        FROM discount_codes dc
        WHERE UPPER(dc.code) = UPPER($1)
          AND dc.is_active = true
          AND dc.expires_at > NOW()`,
        [discountCode, courseId]
      );

      if (discountResult.rows.length > 0 && discountResult.rows[0].applies_to_course) {
        const discount = discountResult.rows[0];
        
        // Check max usage
        if (!discount.max_usage || discount.usage_count < discount.max_usage) {
          // Check if user already used this code for this course
          const usageCheck = await client.query(
            `SELECT id FROM discount_code_usage 
             WHERE discount_code_id = $1 AND user_id = $2 AND course_id = $3`,
            [discount.id, userId, courseId]
          );

          if (usageCheck.rows.length === 0) {
            const discountAmount = Math.round((course.price * discount.discount_percent) / 100);
            finalAmount = course.price - discountAmount;
            
            discountInfo = {
              id: discount.id,
              code: discount.code,
              discountPercent: discount.discount_percent,
              discountAmount,
              originalPrice: course.price
            };
          }
        }
      }
    }

    // 4. Get Razorpay keys
    const keyId = await getSetting('razorpay_key_id');
    const secretKey = await getSetting('razorpay_secret_key');

    if (!keyId || !secretKey) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    // 5. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: secretKey,
    });

    const amountInPaise = Math.round(finalAmount * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${uuidv4().slice(0, 8)}`,
    };

    const order = await razorpay.orders.create(options);

    // 6. Create pending payment record
    await client.query(
      `INSERT INTO payments (user_id, course_id, amount, currency, status, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, courseId, finalAmount, 'INR', 'pending', 'razorpay', order.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      isNewUser,
      userId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      courseTitle: course.title,
      discountInfo
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment link payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    client.release();
  }
};

/**
 * Verify payment link payment
 * POST /api/payment-links/verify
 */
exports.verifyPaymentLinkPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId, discountInfo } = req.body;

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

    await client.query('BEGIN');

    // 3. Update payment record
    const paymentResult = await client.query(
      `UPDATE payments 
       SET status = 'completed', payment_id = $1, updated_at = NOW()
       WHERE transaction_id = $2 AND user_id = $3
       RETURNING *`,
      [razorpay_payment_id, razorpay_order_id, userId]
    );

    if (paymentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = paymentResult.rows[0];

    // 4. Create enrollment
    await client.query(
      `INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
       VALUES ($1, $2, 'active', NOW())
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, courseId]
    );

    // 5. Record discount usage if discount was applied
    if (discountInfo && discountInfo.id) {
      await client.query(
        `INSERT INTO discount_code_usage 
          (discount_code_id, user_id, course_id, original_price, discount_amount, final_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          discountInfo.id,
          userId,
          courseId,
          discountInfo.originalPrice,
          discountInfo.discountAmount,
          payment.amount
        ]
      );

      // Increment usage count
      await client.query(
        'UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = $1',
        [discountInfo.id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment verified and enrollment created',
      payment: paymentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying payment link payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  } finally {
    client.release();
  }
};
