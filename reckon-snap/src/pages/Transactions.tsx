import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Filter, Download, Eye, RefreshCw, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { transactionApi, Transaction } from "@/services/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function Transactions() {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch transactions from server
  const { 
    data: transactions = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['transactions', filterType, filterCategory, startDate?.toISOString() ?? '', endDate?.toISOString() ?? ''],
    queryFn: async () => {
      const token = await getToken();
      return transactionApi.getTransactions({
        type: filterType === 'all' ? undefined : (filterType as 'income' | 'expense'),
        category: filterCategory === 'all' ? undefined : filterCategory,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      }, token || undefined);
    },
    refetchOnWindowFocus: false,
  });

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = useMemo(() => [...new Set(transactions.map(t => t.category))], [transactions]);

  function exportToCsv() {
    const headers = ["Type", "Amount", "Category", "Date", "Description"];
    const rows = filteredTransactions.map(t => [
      t.type,
      t.amount,
      t.category,
      new Date(t.date).toISOString(),
      (t.description ?? "").replace(/\n|\r/g, " ")
    ]);

    const csv = [headers, ...rows]
      .map(r => r
        .map(value => {
          const v = String(value ?? "");
          const needsQuotes = /[",\n]/.test(v);
          const escaped = v.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `transactions-${ts}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage your financial transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2" onClick={exportToCsv} disabled={transactions.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter your transactions by type, category, or search term
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start w-full", !startDate && "text-muted-foreground")}> 
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start w-full", !endDate && "text-muted-foreground")}> 
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterCategory("all");
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load transactions. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {isLoading ? (
              "Loading transactions..."
            ) : (
              `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} found`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {transactions.length === 0 
                  ? "No transactions found. Add your first transaction to get started!"
                  : "No transactions found matching your criteria."
                }
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{transaction.description}</h3>
                      <Badge 
                        variant="outline"
                        className={cn(
                          transaction.type === "income" 
                            ? "border-income text-income bg-income/5" 
                            : "border-expense text-expense bg-expense/5"
                        )}
                      >
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{format(new Date(transaction.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "text-right font-semibold text-lg",
                      transaction.type === "income" ? "text-income" : "text-expense"
                    )}>
                      {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}