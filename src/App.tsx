import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  FileText,
  Filter,
  IndianRupee,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { twMerge } from 'tailwind-merge';

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
    localStorage.setItem(
      'spendwise_transactions',
      JSON.stringify(transactions),
    );
  }, [transactions]);

  // Calculations
  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'All') return transactions;
    return transactions.filter((t) => t.category === filterCategory);
  }, [transactions, filterCategory]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // Chart Data
  const chartData = useMemo(() => {
    const expenseData = filteredTransactions.filter(
      (t) => t.type === 'expense',
    );
    const categoryTotals: Record<string, number> = {};

    expenseData.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map((l) => CATEGORY_COLORS[l] || '#cbd5e1');

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
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleClearAll = () => {
    setTransactions([]);
    setShowClearModal(false);
    localStorage.removeItem('spendwise_transactions');
  };

  // Clear error on change
  const handleInputChange =
    (setter: (val: string) => void, field: keyof ValidationErrors) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <IndianRupee className="h-7 w-7 text-white" />
            </div>
            SpendWise
          </h1>
          <p className="mt-1 ml-1 text-zinc-400">
            Professional Financial Management
          </p>
        </motion.div>
        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-rose-500/5 hover:text-rose-500"
        >
          <RotateCcw className="h-4 w-4" />
          Clear All Data
        </button>
      </header>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            label: 'Total Balance',
            value: stats.balance,
            icon: Wallet,
            color: stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Total Income',
            value: stats.income,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Total Expenses',
            value: stats.expenses,
            icon: TrendingDown,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card flex items-center gap-5 p-6"
          >
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner',
                stat.bg,
              )}
            >
              <stat.icon className={cn('h-7 w-7', stat.color)} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-zinc-500">
                {stat.label}
              </p>
              <motion.h2
                key={stat.value}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn('text-2xl font-bold tracking-tight', stat.color)}
              >
                {formatCurrency(stat.value)}
              </motion.h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form & Chart */}
        <div className="space-y-8 lg:col-span-5">
          {/* Add Transaction Form */}
          <section
            className={cn(
              'glass-card p-7 transition-all',
              isShaking && 'animate-shake',
            )}
          >
            <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <Plus className="h-5 w-5 text-emerald-500" />
              Add Transaction
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-5">
              <div className="flex rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300',
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300',
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  Income
                </button>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Description
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="e.g. Grocery Shopping"
                    className={cn(
                      'input-field',
                      errors.description && 'input-field-error',
                    )}
                    value={description}
                    onChange={handleInputChange(setDescription, 'description')}
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 ml-1 flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Amount
                  </label>
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={cn(
                        'input-field',
                        errors.amount && 'input-field-error',
                      )}
                      value={amount}
                      onChange={handleInputChange(setAmount, 'amount')}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 ml-1 flex items-center gap-1 text-xs text-rose-500">
                      <AlertCircle className="h-3 w-3" /> {errors.amount}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="date"
                      className={cn(
                        'input-field block w-full min-w-0 appearance-none bg-transparent',
                        errors.date && 'input-field-error',
                      )}
                      value={date}
                      onChange={handleInputChange(setDate, 'date')}
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 ml-1 flex items-center gap-1 text-xs text-rose-500">
                      <AlertCircle className="h-3 w-3" /> {errors.date}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Category
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <select
                    className="input-field cursor-pointer appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary group mt-4 w-full">
                <span className="flex items-center justify-center gap-2">
                  Add {type === 'income' ? 'Income' : 'Expense'}
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                </span>
              </button>
            </form>
          </section>

          {/* Chart Visualization */}
          <section className="glass-card p-7">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <TrendingDown className="h-5 w-5 text-emerald-500" />
              Expense Distribution
            </h3>
            <div className="relative flex h-80 items-center justify-center">
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
                      easing: 'easeOutQuart',
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#71717a',
                          usePointStyle: true,
                          padding: 25,
                          font: { size: 12, weight: 500 },
                        },
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
                          },
                        },
                      },
                    },
                    cutout: '75%',
                  }}
                />
              ) : (
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <TrendingDown className="h-10 w-10 text-zinc-700" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500">
                    No expense data to visualize
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Transaction List */}
        <div className="space-y-6 lg:col-span-7">
          <section className="glass-card flex h-full max-h-225 flex-col">
            <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 p-7 md:flex-row md:items-center">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <FileText className="h-5 w-5 text-emerald-500" />
                Recent Transactions
              </h3>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
                <Filter className="ml-3 h-4 w-4 text-zinc-500" />
                <select
                  className="cursor-pointer bg-transparent py-1.5 pr-4 text-sm text-zinc-300 focus:outline-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All" className="bg-zinc-900">
                    All Categories
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
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
                        transition={{
                          duration: 0.3,
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        <div className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-800/60 sm:p-5">
                          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg"
                              style={{
                                backgroundColor: `${CATEGORY_COLORS[t.category] || '#6b7280'}15`,
                                color: CATEGORY_COLORS[t.category] || '#6b7280',
                                border: `1px solid ${CATEGORY_COLORS[t.category] || '#6b7280'}30`,
                              }}
                            >
                              {t.category.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-bold tracking-tight text-zinc-100">
                                {t.description}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-zinc-500">
                                  <Tag className="h-3.5 w-3.5" />
                                  {t.category}
                                </span>
                                <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-zinc-500">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(t.date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
                            <span
                              className={cn(
                                'whitespace-nowrap text-base font-bold tracking-tight sm:text-lg',
                                t.type === 'income'
                                  ? 'text-emerald-500'
                                  : 'text-rose-500',
                              )}
                            >
                              {formatCurrency(t.amount, t.type)}
                            </span>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="rounded-xl p-2 text-zinc-600 opacity-100 transition-all hover:bg-rose-500/10 hover:text-rose-500 focus:opacity-100 active:scale-90 sm:p-2.5 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full flex-col items-center justify-center space-y-5 p-16 text-center"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 shadow-inner">
                      <FileText className="h-12 w-12 text-zinc-800" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zinc-400">
                        No transactions found
                      </p>
                      <p className="mx-auto mt-1 max-w-50 text-sm text-zinc-600">
                        Start by adding your first income or expense above
                      </p>
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
              className="glass-card relative w-full max-w-md border-zinc-800/50 p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Clear All Records?
                  </h3>
                  <p className="mt-1 text-zinc-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="mb-8 leading-relaxed text-zinc-300">
                Are you sure you want to delete all transactions? This will
                permanently remove your financial history from this device.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleClearAll} className="btn-danger">
                  Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-900 pt-10 pb-4 text-center">
        <p className="text-xs font-medium tracking-widest text-zinc-600 uppercase">
          SpendWise &bull; Secure Local Storage &bull; Built with Precision
          &bull; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
