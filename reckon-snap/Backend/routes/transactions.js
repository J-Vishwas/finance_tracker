const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Build query filters from request
function buildTransactionFilters(query, userId) {
    const filters = {};

    if (userId) {
        filters.userId = userId;
    }

    if (query.type && (query.type === 'income' || query.type === 'expense')) {
        filters.type = query.type;
    }

    if (query.category) {
        filters.category = query.category;
    }

    if (query.startDate || query.endDate) {
        filters.date = {};
        if (query.startDate) {
            const start = new Date(query.startDate);
            if (!isNaN(start.getTime())) {
                filters.date.$gte = start;
            }
        }
        if (query.endDate) {
            const end = new Date(query.endDate);
            if (!isNaN(end.getTime())) {
                filters.date.$lte = end;
            }
        }
    }

    return filters;
}

// GET /api/transactions -> list with optional filters
router.get('/', async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const filters = buildTransactionFilters(req.query, userId);
        const transactions = await Transaction.find(filters).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        next(error);
    }
});

// POST /api/transactions -> create
router.post('/', async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const { type, amount, category, date, description } = req.body;

        if (!type || !amount || !category || !date || !description) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Date must be a valid date' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
        }

        if (description.length > 200) {
            return res.status(400).json({ error: 'Description must not exceed 200 characters' });
        }

        const transaction = new Transaction({
            userId,
            type,
            amount: parsedAmount,
            category,
            date: parsedDate,
            description
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
});

// POST /api/transactions/bulk -> bulk create
router.post('/bulk', async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const { transactions } = req.body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'Transactions array is required and cannot be empty' });
        }

        const results = { success: [], errors: [] };

        for (let i = 0; i < transactions.length; i++) {
            const transactionData = transactions[i];

            try {
                if (!transactionData.type || !transactionData.amount || !transactionData.category || !transactionData.date || !transactionData.description) {
                    results.errors.push({ index: i, error: 'Missing required fields', data: transactionData });
                    continue;
                }

                if (transactionData.type !== 'income' && transactionData.type !== 'expense') {
                    results.errors.push({ index: i, error: 'Invalid type. Must be "income" or "expense"', data: transactionData });
                    continue;
                }

                const parsedAmount = parseFloat(transactionData.amount);
                if (isNaN(parsedAmount) || parsedAmount < 0) {
                    results.errors.push({ index: i, error: 'Invalid amount. Must be a positive number', data: transactionData });
                    continue;
                }

                const parsedDate = new Date(transactionData.date);
                if (isNaN(parsedDate.getTime())) {
                    results.errors.push({ index: i, error: 'Invalid date format', data: transactionData });
                    continue;
                }

                if (transactionData.description.length > 200) {
                    results.errors.push({ index: i, error: 'Description must not exceed 200 characters', data: transactionData });
                    continue;
                }

                const transaction = new Transaction({
                    userId,
                    type: transactionData.type,
                    amount: parsedAmount,
                    category: transactionData.category,
                    date: parsedDate,
                    description: transactionData.description
                });

                const savedTransaction = await transaction.save();
                results.success.push({ index: i, transaction: savedTransaction });
            } catch (err) {
                results.errors.push({ index: i, error: err.message || 'Unknown error', data: transactionData });
            }
        }

        res.status(200).json({
            message: `Bulk upload completed: ${results.success.length} successful, ${results.errors.length} errors`,
            successCount: results.success.length,
            errorCount: results.errors.length,
            results
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


