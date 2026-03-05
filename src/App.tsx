import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Calendar, 
  Tag, 
  FileText,
  RotateCcw,
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale 
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
}

interface ValidationErrors {
  description?: string;
  amount?: string;
  date?: string;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Health',
  'Others',
  'Salary',
  'Freelance',
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Entertainment: '#8b5cf6',
  Bills: '#ef4444',
  Shopping: '#ec4899',
  Health: '#10b981',
  Others: '#6b7280',
  Salary: '#10b981',
  Freelance: '#06b6d4',
};

// --- Utilities ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount: number, type?: TransactionType) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (!type) return formatted;
  return `${type === 'income' ? '+' : '-'} ${formatted}`;
};

// --- Chart Registration ---

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

// --- Main Application ---

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendwise_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState<TransactionType>('expense');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'All') return transactions;
    return transactions.filter(t => t.category === filterCategory);
  }, [transactions, filterCategory]);

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // Chart Data
  const chartData = useMemo(() => {
    const expenseData = filteredTransactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenseData.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(l => CATEGORY_COLORS[l] || '#cbd5e1');

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: '#18181b',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [filteredTransactions]);

  // Handlers
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return false;
    }
    return true;
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category,
      type,
    };

    setTransactions([newTransaction, ...transactions]);
    setDescription('');
    setAmount('');
    setErrors({});
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleClearAll = () => {
    setTransactions([]);
    setShowClearModal(false);
    localStorage.removeItem('spendwise_transactions');
  };

  // Clear error on change
  const handleInputChange = (setter: (val: string) => void, field: keyof ValidationErrors) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <IndianRupee className="w-7 h-7 text-white" />
            </div>
            SpendWise
          </h1>
          <p className="text-zinc-400 mt-1 ml-1">Professional Financial Management</p>
        </motion.div>
        <button 
          onClick={() => setShowClearModal(true)}
          className="flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors text-sm font-medium px-4 py-2 rounded-xl hover:bg-rose-500/5"
        >
          <RotateCcw className="w-4 h-4" />
          Clear All Data
        </button>
      </header>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Balance', value: stats.balance, icon: Wallet, color: stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Income', value: stats.income, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Expenses', value: stats.expenses, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' }
        ].map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 flex items-center gap-5"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">{stat.label}</p>
              <motion.h2 
                key={stat.value}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("text-2xl font-bold tracking-tight", stat.color)}
              >
                {formatCurrency(stat.value)}
              </motion.h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Chart */}
        <div className="lg:col-span-5 space-y-8">
          {/* Add Transaction Form */}
          <section className={cn("glass-card p-7 transition-all", isShaking && "animate-shake")}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Add Transaction
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-5">
              <div className="flex p-1.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                    type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                    type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Income
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Grocery Shopping"
                    className={cn("input-field", errors.description && "input-field-error")}
                    value={description}
                    onChange={handleInputChange(setDescription, 'description')}
                  />
                </div>
                {errors.description && (
                  <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 ml-1">
                    <AlertCircle className="w-3 h-3" /> {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={cn("input-field", errors.amount && "input-field-error")}
                      value={amount}
                      onChange={handleInputChange(setAmount, 'amount')}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 ml-1">
                      <AlertCircle className="w-3 h-3" /> {errors.amount}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                    <input
                      type="date"
                      className={cn("input-field", errors.date && "input-field-error")}
                      value={date}
                      onChange={handleInputChange(setDate, 'date')}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 ml-1">
                      <AlertCircle className="w-3 h-3" /> {errors.date}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                  <select
                    className="input-field appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-4 group">
                <span className="flex items-center justify-center gap-2">
                  Add {type === 'income' ? 'Income' : 'Expense'}
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </span>
              </button>
            </form>
          </section>

          {/* Chart Visualization */}
          <section className="glass-card p-7">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-500" />
              Expense Distribution
            </h3>
            <div className="h-[320px] flex items-center justify-center relative">
              {chartData.labels.length > 0 ? (
                <Doughnut 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      animateRotate: true,
                      animateScale: true,
                      duration: 1000,
                      easing: 'easeOutQuart'
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#71717a',
                          usePointStyle: true,
                          padding: 25,
                          font: { size: 12, weight: 500 }
                        }
                      },
                      tooltip: {
                        backgroundColor: '#18181b',
                        titleColor: '#fff',
                        bodyColor: '#94a3b8',
                        borderColor: '#27272a',
                        borderWidth: 1,
                        padding: 14,
                        cornerRadius: 12,
                        callbacks: {
                          label: (context) => {
                            const value = context.raw as number;
                            return ` ${formatCurrency(value)}`;
                          }
                        }
                      }
                    },
                    cutout: '75%',
                  }} 
                />
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                    <TrendingDown className="w-10 h-10 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500 text-sm font-medium">No expense data to visualize</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Transaction List */}
        <div className="lg:col-span-7 space-y-6">
          <section className="glass-card flex flex-col h-full max-h-[900px]">
            <div className="p-7 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Recent Transactions
              </h3>
              
              <div className="flex items-center gap-3 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                <Filter className="w-4 h-4 text-zinc-500 ml-3" />
                <select
                  className="bg-transparent text-sm text-zinc-300 focus:outline-none pr-4 py-1.5 cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All" className="bg-zinc-900">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((t) => (
                      <motion.div 
                        key={t.id} 
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.95 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                        className="group flex items-center justify-between p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/60 transition-all border border-zinc-800/50 hover:border-zinc-700 shadow-sm"
                      >
                        <div className="flex items-center gap-5">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                            style={{ 
                              backgroundColor: `${CATEGORY_COLORS[t.category] || '#6b7280'}15`, 
                              color: CATEGORY_COLORS[t.category] || '#6b7280',
                              border: `1px solid ${CATEGORY_COLORS[t.category] || '#6b7280'}30`
                            }}
                          >
                            {t.category.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-100 tracking-tight">{t.description}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                {t.category}
                              </span>
                              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(t.date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                          <span className={cn(
                            "font-bold text-lg tracking-tight",
                            t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {formatCurrency(t.amount, t.type)}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-2.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-16 space-y-5"
                  >
                    <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 shadow-inner">
                      <FileText className="w-12 h-12 text-zinc-800" />
                    </div>
                    <div>
                      <p className="text-zinc-400 font-bold text-lg">No transactions found</p>
                      <p className="text-zinc-600 text-sm max-w-[200px] mx-auto mt-1">Start by adding your first income or expense above</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearModal(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-card p-8 max-w-md w-full shadow-2xl border-zinc-800/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Clear All Records?</h3>
                  <p className="text-zinc-400 mt-1">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-zinc-300 mb-8 leading-relaxed">
                Are you sure you want to delete all transactions? This will permanently remove your financial history from this device.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn-danger"
                >
                  Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="pt-10 pb-4 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-xs font-medium tracking-widest uppercase">
          SpendWise &bull; Secure Local Storage &bull; Built with Precision &bull; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
