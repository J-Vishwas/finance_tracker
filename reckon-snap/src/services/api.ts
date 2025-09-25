const API_BASE_URL = 'http://localhost:3001/api';

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  savingsRate: string;
}

export interface MonthlyOverview {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface TransactionQuery {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}

// Transaction API functions
export const transactionApi = {
  // Get transactions with optional server-side filters
  getTransactions: async (query?: TransactionQuery, token?: string): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.category) params.set('category', query.category);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const qs = params.toString();
    const response = await fetch(`${API_BASE_URL}/transactions${qs ? `?${qs}` : ''}` , {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },

  // Add new transaction
  addTransaction: async (transaction: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>, token?: string): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error('Failed to add transaction');
    }
    return response.json();
  },

  // Bulk add transactions
  addBulkTransactions: async (transactions: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>[], token?: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/transactions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ transactions }),
    });
    if (!response.ok) {
      throw new Error('Failed to add bulk transactions');
    }
    return response.json();
  },

  // Get transaction stats
  getStats: async (token?: string): Promise<TransactionStats> => {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  // Get monthly overview
  getMonthlyOverview: async (token?: string): Promise<MonthlyOverview[]> => {
    const response = await fetch(`${API_BASE_URL}/monthly-overview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch monthly overview');
    }
    return response.json();
  },

  // Get category breakdown
  getCategoryBreakdown: async (token?: string): Promise<CategoryBreakdown[]> => {
    const response = await fetch(`${API_BASE_URL}/category-breakdown`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch category breakdown');
    }
    return response.json();
  },
};

export const receiptApi = {
  // Upload a receipt image/pdf and extract data
  extract: async (file: File, token?: string): Promise<{
    filename: string;
    mimeType: string;
    size: number;
    parsed: { merchant: string; date: string; total: number; items: any[] };
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/receipts/extract`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to extract receipt');
    }
    return response.json();
  },
};
