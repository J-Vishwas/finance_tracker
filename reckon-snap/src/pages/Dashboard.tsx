import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { transactionApi } from "@/services/api";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

export default function Dashboard() {
  const { getToken } = useAuth();
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: "0.00",
    monthlyIncome: "0.00",
    monthlyExpenses: "0.00",
    savingsRate: "0.0"
  });

  // Derived datasets for additional charts
  const incomeExpenseDonut = [
    { name: 'Income', value: parseFloat(String(stats.monthlyIncome)) || 0, color: 'hsl(var(--income))' },
    { name: 'Expenses', value: parseFloat(String(stats.monthlyExpenses)) || 0, color: 'hsl(var(--expense))' },
  ];

  const cumulativeBalanceData = monthlyData.reduce((acc: any[], curr: any, idx: number) => {
    const delta = (Number(curr.income) || 0) - (Number(curr.expenses) || 0);
    const prev = idx > 0 ? acc[idx - 1].balance : 0;
    acc.push({ month: curr.month, balance: prev + delta });
    return acc;
  }, [] as any[]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const [overview, categories, transactions, stats] = await Promise.all([
          transactionApi.getMonthlyOverview(token || undefined),
          transactionApi.getCategoryBreakdown(token || undefined),
          transactionApi.getTransactions(undefined, token || undefined),
          transactionApi.getStats(token || undefined),
        ]);
        setMonthlyData(overview);
        setCategoryData(categories);
        setRecentTransactions(transactions);
        setStats(stats);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    })();
  }, [getToken]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={`$${stats.totalBalance}`}
          change="+12.5%"
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="Monthly Income"
          value={`$${stats.monthlyIncome}`}
          change="+8.2%"
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Monthly Expenses"
          value={`$${stats.monthlyExpenses}`}
          change="-2.4%"
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Savings Rate"
          value={`${stats.savingsRate}%`}
          change="+5.1%"
          icon={PieChart}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>
              Income vs Expenses for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="hsl(var(--income))" name="Income" />
                <Bar dataKey="expenses" fill="hsl(var(--expense))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Breakdown of your spending by category this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense (Line)</CardTitle>
            <CardDescription>Trend comparison over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--expense))" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income vs Expense Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense (Donut)</CardTitle>
            <CardDescription>This month’s totals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={incomeExpenseDonut}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  label
                >
                  {incomeExpenseDonut.map((entry, index) => (
                    <Cell key={`ied-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Balance Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Balance Over Time</CardTitle>
          <CardDescription>Running total of income minus expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeBalanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${
                  transaction.type === "income" ? "text-income" : "text-expense"
                }`}>
                  {transaction.type === "income" ? "+" : ""}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}