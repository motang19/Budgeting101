import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, DollarSign, Calendar, TrendingUp, AlertCircle, Settings, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ExpenseModal from './ExpenseModal';
import BudgetSettingsModal from './BudgetSettingsModal';

const CATEGORIES = [
  { name: 'Food', color: 'bg-green-500' },
  { name: 'Transport', color: 'bg-blue-500' },
  { name: 'Entertainment', color: 'bg-purple-500' },
  { name: 'Shopping', color: 'bg-pink-500' },
  { name: 'Bills', color: 'bg-red-500' },
  { name: 'Health', color: 'bg-teal-500' },
  { name: 'Other', color: 'bg-gray-500' },
];

const BudgetCalendarApp = ({ session }) => {
  const userId = session.user.id;
  const userEmail = session.user.email;

  // Budget allocations keyed per user so each account has their own
  const budgetStorageKey = `budgetAllocations_${userId}`;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Food' });

  const [budgetAllocations, setBudgetAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem(`budgetAllocations_${userId}`);
      return saved ? JSON.parse(saved) : { Food: '', Transport: '', Entertainment: '', Shopping: '', Bills: '', Health: '', Other: '' };
    } catch { return { Food: '', Transport: '', Entertainment: '', Shopping: '', Bills: '', Health: '', Other: '' }; }
  });
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({});

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses').select('*')
        .eq('user_id', userId)
        .gte('date', firstDay).lte('date', lastDay)
        .order('date', { ascending: false });

      if (error) throw error;

      const grouped = {};
      data.forEach(expense => {
        if (!grouped[expense.date]) grouped[expense.date] = [];
        grouped[expense.date].push(expense);
      });
      setExpenses(grouped);
    } catch (err) {
      setError('Failed to load expenses. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, userId]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const getCategoryColor = (category) => CATEGORIES.find(c => c.name === category)?.color || 'bg-gray-500';

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const handleDayClick = (day) => {
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedDay({ day, dateKey });
    setShowModal(true);
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    try {
      const dateKey = selectedDay.dateKey;
      const { data, error } = await supabase.from('expenses')
        .insert([{ date: dateKey, description: newExpense.description, amount: parseFloat(newExpense.amount), category: newExpense.category, user_id: userId, created_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      setExpenses(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), data] }));
      setNewExpense({ description: '', amount: '', category: 'Food' });
    } catch { setError('Failed to add expense.'); }
  };

  const handleDeleteExpense = async (dateKey, expenseId) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
      setExpenses(prev => ({ ...prev, [dateKey]: prev[dateKey].filter(e => e.id !== expenseId) }));
    } catch { setError('Failed to delete expense.'); }
  };

  const getAllExpenses = () =>
    Object.values(expenses).flatMap(list => list.map(e => ({ ...e, dateKey: e.date })));

  const getCategoryTotals = () => {
    const all = getAllExpenses();
    return Object.fromEntries(CATEGORIES.map(cat => [cat.name, all.filter(e => e.category === cat.name).reduce((s, e) => s + e.amount, 0)]));
  };

  const getMonthTotal = () => getAllExpenses().reduce((s, e) => s + e.amount, 0);

  const getAvgDailySpend = () => {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
    const daysElapsed = isCurrentMonth ? now.getDate() : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    return daysElapsed > 0 ? getMonthTotal() / daysElapsed : 0;
  };

  const getDayTotal = (day) => {
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return (expenses[dateKey] || []).reduce((s, e) => s + e.amount, 0);
  };

  const getFilteredExpenses = () => {
    let all = getAllExpenses();
    if (selectedCategory !== 'all') all = all.filter(e => e.category === selectedCategory);
    if (searchTerm) all = all.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return all.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  };

  const saveBudgetAllocations = () => {
    localStorage.setItem(budgetStorageKey, JSON.stringify(budgetDraft));
    setBudgetAllocations({ ...budgetDraft });
    setShowBudgetSettings(false);
  };

  const getBudgetBarColor = (pct) => pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500';
  const getBudgetTextColor = (pct) => pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-500' : 'text-green-600';

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
  const categoryTotals = getCategoryTotals();
  const monthTotal = getMonthTotal();
  const avgDailySpend = getAvgDailySpend();
  const filteredExpenses = getFilteredExpenses();

  const renderCalendar = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d =>
      days.push(<div key={`h-${d}`} className="text-center font-semibold text-gray-600 py-2 text-sm">{d}</div>)
    );
    for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`e-${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const total = getDayTotal(day);
      days.push(
        <div key={day} onClick={() => handleDayClick(day)}
          className="border border-gray-200 min-h-20 p-2 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg">
          <div className="font-semibold text-gray-700 mb-1">{day}</div>
          {total > 0 && <div className="text-xs bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium">${total.toFixed(2)}</div>}
        </div>
      );
    }
    return days;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading expenses...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="flex-1 text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Budget Calendar</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total This Month</div>
                <div className="text-2xl font-bold text-green-600">${monthTotal.toFixed(2)}</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{isCurrentMonth ? 'Avg Per Day (so far)' : 'Avg Per Day'}</div>
                <div className="text-2xl font-bold text-blue-600">${avgDailySpend.toFixed(2)}</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              {/* User info + sign out */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 max-w-32 truncate">{userEmail}</span>
                <button onClick={() => supabase.auth.signOut()} title="Sign Out"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-4 shadow">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">← Previous</button>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Next →</button>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Expenses Overview
        </h2>

        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-700">{isCurrentMonth ? 'Daily Average (so far)' : 'Daily Average'}</div>
            <div className="text-xs text-blue-500 mt-0.5">
              {isCurrentMonth ? `Based on ${now.getDate()} day${now.getDate() !== 1 ? 's' : ''} elapsed`
                : `Based on all ${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()} days`}
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">${avgDailySpend.toFixed(2)}</div>
        </div>

        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">By Category</h3>
            <button onClick={() => { setBudgetDraft({ ...budgetAllocations }); setShowBudgetSettings(true); }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              <Settings className="w-3 h-3" /> Set Budgets
            </button>
          </div>
          <div className="space-y-3">
            {CATEGORIES.map(cat => {
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
                      {hasBudget && <span className="text-gray-400 text-xs">/ ${allocated.toFixed(0)}</span>}
                      {pctDisplay !== null && <span className={`text-xs font-bold ${getBudgetTextColor(pctDisplay)}`}>{pctDisplay}%</span>}
                    </div>
                  </div>
                  {hasBudget && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${getBudgetBarColor(pctDisplay)}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search expenses..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}
          </h3>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No expenses found</p>
            </div>
          ) : filteredExpenses.map(expense => (
            <div key={expense.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{expense.description}</div>
                  <div className="text-xs text-gray-500">{expense.dateKey}</div>
                </div>
                <button onClick={() => handleDeleteExpense(expense.dateKey, expense.id)} className="text-red-500 hover:text-red-700 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)} text-white`}>{expense.category}</span>
                <span className="font-bold text-gray-800">${expense.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <ExpenseModal
          selectedDay={selectedDay} expenses={expenses} newExpense={newExpense}
          setNewExpense={setNewExpense} categories={CATEGORIES} getCategoryColor={getCategoryColor}
          onAdd={handleAddExpense} onDelete={handleDeleteExpense} onClose={() => setShowModal(false)}
        />
      )}
      {showBudgetSettings && (
        <BudgetSettingsModal
          categories={CATEGORIES} budgetDraft={budgetDraft} setBudgetDraft={setBudgetDraft}
          onSave={saveBudgetAllocations} onClose={() => setShowBudgetSettings(false)}
        />
      )}
    </div>
  );
};

export default BudgetCalendarApp;