import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Search, DollarSign, Calendar, TrendingUp, AlertCircle, Settings} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BudgetCalendarApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Food'
  });

  // Budget allocations per category - persisted to localStorage
  const [budgetAllocations, setBudgetAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem('budgetAllocations');
      return saved ? JSON.parse(saved) : {
        Food: '', Transport: '', Entertainment: '',
        Shopping: '', Bills: '', Health: '', Other: ''
      };
    } catch { return { Food: '', Transport: '', Entertainment: '', Shopping: '', Bills: '', Health: '', Other: '' }; }
  });
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({});

  const categories = [
    { name: 'Food', color: 'bg-green-500' },
    { name: 'Transport', color: 'bg-blue-500' },
    { name: 'Entertainment', color: 'bg-purple-500' },
    { name: 'Shopping', color: 'bg-pink-500' },
    { name: 'Bills', color: 'bg-red-500' },
    { name: 'Health', color: 'bg-teal-500' },
    { name: 'Other', color: 'bg-gray-500' }
  ];

  // Load expenses from Supabase when component mounts or month changes
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const groupedExpenses = {};
      data.forEach(expense => {
        const dateKey = expense.date;
        if (!groupedExpenses[dateKey]) {
          groupedExpenses[dateKey] = [];
        }
        groupedExpenses[dateKey].push(expense);
      });
      
      setExpenses(groupedExpenses);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const getCategoryColor = (category) => {
    return categories.find(c => c.name === category)?.color || 'bg-gray-500';
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(clickedDate);
    setSelectedDay({ day, dateKey });
    setShowModal(true);
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    try {
      const dateKey = selectedDay.dateKey;
      const expenseData = {
        date: dateKey,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), data]
      }));

      setNewExpense({ description: '', amount: '', category: 'Food' });
      setError(null);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (dateKey, expenseId) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      setExpenses(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].filter(e => e.id !== expenseId)
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
    }
  };

  const getDayTotal = (day) => {
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    const dayExpenses = expenses[dateKey] || [];
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getAllExpenses = () => {
    return Object.entries(expenses).flatMap(([dateKey, expenseList]) =>
      expenseList.map(expense => ({ ...expense, dateKey: expense.date }))
    );
  };

  const getFilteredExpenses = () => {
    let allExpenses = getAllExpenses();
    
    if (selectedCategory !== 'all') {
      allExpenses = allExpenses.filter(e => e.category === selectedCategory);
    }
    
    if (searchTerm) {
      allExpenses = allExpenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allExpenses.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  };

  const getCategoryTotals = () => {
    const allExpenses = getAllExpenses();
    const totals = {};
    
    categories.forEach(cat => {
      totals[cat.name] = allExpenses
        .filter(e => e.category === cat.name)
        .reduce((sum, e) => sum + e.amount, 0);
    });
    
    return totals;
  };

  const getMonthTotal = () => {
    return getAllExpenses().reduce((sum, e) => sum + e.amount, 0);
  };

  const saveBudgetAllocations = () => {
    localStorage.setItem('budgetAllocations', JSON.stringify(budgetDraft));
    setBudgetAllocations({ ...budgetDraft });
    setShowBudgetSettings(false);
  };

  const openBudgetSettings = () => {
    setBudgetDraft({ ...budgetAllocations });
    setShowBudgetSettings(true);
  };

  // Returns bar color based on % used
  const getBudgetBarColor = (pct) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const getBudgetTextColor = (pct) => {
    if (pct >= 100) return 'text-red-600';
    if (pct >= 80) return 'text-orange-500';
    return 'text-green-600';
  };

  // Calculate average daily spend based on days elapsed so far this month
  const getAvgDailySpend = () => {
    const now = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() === month;

    // For current month: divide by days elapsed (up to today)
    // For past months: divide by total days in that month
    const daysElapsed = isCurrentMonth
      ? now.getDate()
      : new Date(year, month + 1, 0).getDate();

    const total = getMonthTotal();
    return daysElapsed > 0 ? total / daysElapsed : 0;
  };

  const changeMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center font-semibold text-gray-600 py-2 text-sm">
          {day}
        </div>
      );
    });

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className=""></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const total = getDayTotal(day);
      const hasExpenses = total > 0;
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className="border border-gray-200 min-h-20 p-2 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg"
        >
          <div className="font-semibold text-gray-700 mb-1">{day}</div>
          {hasExpenses && (
            <div className="text-xs bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium">
              ${total.toFixed(2)}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const categoryTotals = getCategoryTotals();
  const filteredExpenses = getFilteredExpenses();
  const monthTotal = getMonthTotal();
  const avgDailySpend = getAvgDailySpend();

  // Determine label based on whether viewing current or past month
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === currentDate.getFullYear() &&
    now.getMonth() === currentDate.getMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Calendar Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Budget Calendar</h1>
            </div>
            {/* Stats: Total + Avg Daily */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total This Month</div>
                <div className="text-2xl font-bold text-green-600">${monthTotal.toFixed(2)}</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {isCurrentMonth ? 'Avg Per Day (so far)' : 'Avg Per Day'}
                </div>
                <div className="text-2xl font-bold text-blue-600">${avgDailySpend.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-4 shadow">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Previous
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Expenses Overview
        </h2>

        {/* Avg Daily Spend Card in Sidebar */}
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-700">
              {isCurrentMonth ? 'Daily Average (so far)' : 'Daily Average'}
            </div>
            <div className="text-xs text-blue-500 mt-0.5">
              {isCurrentMonth
                ? `Based on ${now.getDate()} day${now.getDate() !== 1 ? 's' : ''} elapsed`
                : `Based on all ${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()} days`}
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">${avgDailySpend.toFixed(2)}</div>
        </div>

        {/* Category Budget Summary */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">By Category</h3>
            <button
              onClick={openBudgetSettings}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <Settings className="w-3 h-3" />
              Set Budgets
            </button>
          </div>
          <div className="space-y-3">
            {categories.map(cat => {
              const spent = categoryTotals[cat.name] || 0;
              const allocated = parseFloat(budgetAllocations[cat.name]) || 0;
              const hasBudget = allocated > 0;
              const pct = hasBudget ? Math.min((spent / allocated) * 100, 100) : 0;
              const pctDisplay = hasBudget ? Math.round((spent / allocated) * 100) : null;

              return (
                <div key={cat.name}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                      <span className="text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">${spent.toFixed(2)}</span>
                      {hasBudget && (
                        <span className="text-gray-400 text-xs">/ ${allocated.toFixed(0)}</span>
                      )}
                      {pctDisplay !== null && (
                        <span className={`text-xs font-bold ${getBudgetTextColor(pctDisplay)}`}>
                          {pctDisplay}%
                        </span>
                      )}
                    </div>
                  </div>
                  {hasBudget && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${getBudgetBarColor(pctDisplay)}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}
          </h3>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No expenses found</p>
            </div>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{expense.description}</div>
                    <div className="text-xs text-gray-500">{expense.dateKey}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(expense.dateKey, expense.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)} text-white`}>
                    {expense.category}
                  </span>
                  <span className="font-bold text-gray-800">${expense.amount.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for Adding Expenses */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Expenses for Day {selectedDay.day}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add New Expense Form */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Add Expense</h4>
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddExpense}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            {/* Existing Expenses for This Day */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Today's Expenses</h4>
              {(expenses[selectedDay.dateKey] || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No expenses yet</p>
              ) : (
                <div className="space-y-2">
                  {(expenses[selectedDay.dateKey] || []).map(expense => (
                    <div
                      key={expense.id}
                      className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{expense.description}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)} text-white`}>
                          {expense.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">${expense.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleDeleteExpense(selectedDay.dateKey, expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Budget Settings Modal */}
      {showBudgetSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Monthly Budget Allocations</h3>
              <button onClick={() => setShowBudgetSettings(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Set how much you want to spend per category this month. Leave blank for no limit.</p>
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="No limit"
                      value={budgetDraft[cat.name] || ''}
                      onChange={(e) => setBudgetDraft(prev => ({ ...prev, [cat.name]: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBudgetSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBudgetAllocations}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Save Budgets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCalendarApp;