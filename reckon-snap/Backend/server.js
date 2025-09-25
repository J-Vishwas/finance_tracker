require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Verify Clerk keys are present and attach middleware explicitly
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!publishableKey || !secretKey) {
  console.warn('Clerk keys missing: ' +
    (!publishableKey ? '[CLERK_PUBLISHABLE_KEY] ' : '') +
    (!secretKey ? '[CLERK_SECRET_KEY]' : '') +
    ' - set them in Backend/.env');
}

app.use(clerkMiddleware({
  publishableKey,
  secretKey,
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/budgettracking')
.then(() => {
    console.log('Connected to MongoDB');
    // Start server only after successful connection
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
})
.catch(err => console.error('MongoDB connection error:', err));
// Models & Routes
const transactionsRouter = require('./routes/transactions');
const receiptsRouter = require('./routes/receipts');

// Mount routers (protect all API routes by default)
app.use('/api/transactions', requireAuth(), transactionsRouter);
app.use('/api/receipts', requireAuth(), receiptsRouter);

// Get monthly overview data
app.get('/api/monthly-overview', requireAuth(), async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const userId = req.auth.userId;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    income: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                        }
                    },
                    expenses: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = monthlyData.map(item => ({
            month: months[item._id.month - 1],
            income: item.income,
            expenses: item.expenses
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching monthly overview' });
    }
});

// Get category breakdown
app.get('/api/category-breakdown', requireAuth(), async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const userId = req.auth.userId;
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const categoryData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    value: { $sum: '$amount' }
                }
            }
        ]);

        // Add colors to categories
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        const formattedData = categoryData.map((item, index) => ({
            name: item._id,
            value: item.value,
            color: colors[index % colors.length]
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching category breakdown' });
    }
});

// Get stats overview
app.get('/api/stats', requireAuth(), async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const userId = req.auth.userId;
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const [totalBalance, monthlyStats] = await Promise.all([
            Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        balance: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$type', 'income'] },
                                    '$amount',
                                    { $multiply: ['$amount', -1] }
                                ]
                            }
                        }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        userId,
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        const monthlyIncome = monthlyStats.find(stat => stat._id === 'income')?.total || 0;
        const monthlyExpenses = monthlyStats.find(stat => stat._id === 'expense')?.total || 0;
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : '0.0';

        res.json({
            totalBalance: (totalBalance[0]?.balance || 0).toFixed(2),
            monthlyIncome: monthlyIncome.toFixed(2),
            monthlyExpenses: monthlyExpenses.toFixed(2),
            savingsRate
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});


// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});