import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ExpenseModal from './ExpenseModal';
import BudgetSettingsModal from './BudgetSettingsModal';
import CalendarGrid from './CalendarGrid';
import Sidebar from './Sidebar';

export const CATEGORIES = [
  { name: 'Food', color: 'bg-green-500' },
  { name: 'Groceries', color: 'bg-lime-500' },
  { name: 'Desserts', color: 'bg-yellow-400' },
  { name: 'Transport', color: 'bg-blue-500' },
  { name: 'Entertainment', color: 'bg-purple-500' },
  { name: 'Shopping', color: 'bg-pink-500' },
  { name: 'Bills', color: 'bg-red-500' },
  { name: 'Health', color: 'bg-teal-500' },
  { name: 'Other', color: 'bg-gray-500' },
];

const EMPTY_BUDGETS = Object.fromEntries(CATEGORIES.map(c => [c.name, '']));

const BudgetCalendarApp = ({ session }) => {
  const userId = session.user.id;
  const userEmail = session.user.email;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Food' });

  // Budget state - loaded from Supabase, persists across reloads
  const [budgetAllocations, setBudgetAllocations] = useState(EMPTY_BUDGETS);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({});

  // Load budget allocations from Supabase
  const loadBudgets = useCallback(async () => {
    try {
      setBudgetsLoading(true);
      const { data, error } = await supabase
        .from('budget_allocations')
        .select('category, amount')
        .eq('user_id', userId);

      if (error) throw error;

      const loaded = { ...EMPTY_BUDGETS };
      data.forEach(row => {
        if (Object.prototype.hasOwnProperty.call(loaded, row.category)) {
          loaded[row.category] = row.amount > 0 ? String(row.amount) : '';
        }
      });
      setBudgetAllocations(loaded);
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setBudgetsLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  // Load expenses from Supabase
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

  const getCategoryColor = (category) =>
    CATEGORIES.find(c => c.name === category)?.color || 'bg-gray-500';

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    try {
      const dateKey = selectedDay.dateKey;
      const { data, error } = await supabase.from('expenses')
        .insert([{
          date: dateKey,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
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

  // Save all budget allocations to Supabase using upsert
  const saveBudgetAllocations = async () => {
    try {
      const upsertRows = CATEGORIES.map(cat => ({
        user_id: userId,
        category: cat.name,
        amount: parseFloat(budgetDraft[cat.name]) || 0,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('budget_allocations')
        .upsert(upsertRows, { onConflict: 'user_id,category' });

      if (error) throw error;

      setBudgetAllocations({ ...budgetDraft });
      setShowBudgetSettings(false);
    } catch (err) {
      console.error('Error saving budgets:', err);
      setError('Failed to save budgets. Please try again.');
    }
  };

  const getAllExpenses = () =>
    Object.values(expenses).flatMap(list => list.map(e => ({ ...e, dateKey: e.date })));

  const getCategoryTotals = () =>
    Object.fromEntries(
      CATEGORIES.map(cat => [
        cat.name,
        getAllExpenses().filter(e => e.category === cat.name).reduce((s, e) => s + e.amount, 0)
      ])
    );

  const getMonthTotal = () => getAllExpenses().reduce((s, e) => s + e.amount, 0);

  const getAvgDailySpend = () => {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
    const daysElapsed = isCurrentMonth
      ? now.getDate()
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    return daysElapsed > 0 ? getMonthTotal() / daysElapsed : 0;
  };

  const getFilteredExpenses = () => {
    let all = getAllExpenses();
    if (selectedCategory !== 'all') all = all.filter(e => e.category === selectedCategory);
    if (searchTerm) all = all.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return all.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  };

  const getBudgetBarColor = (pct) => pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500';
  const getBudgetTextColor = (pct) => pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-500' : 'text-green-600';

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === currentDate.getFullYear() && now.getMonth() === currentDate.getMonth();
  const categoryTotals = getCategoryTotals();
  const monthTotal = getMonthTotal();
  const avgDailySpend = getAvgDailySpend();
  const filteredExpenses = getFilteredExpenses();

  if (loading || budgetsLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 max-w-32 truncate">{userEmail}</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  title="Sign Out"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-4 shadow">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >← Previous</button>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >Next →</button>
          </div>

          <CalendarGrid
            currentDate={currentDate}
            expenses={expenses}
            onDayClick={(day, dateKey) => { setSelectedDay({ day, dateKey }); setShowModal(true); }}
          />
        </div>
      </div>

      <Sidebar
        isCurrentMonth={isCurrentMonth}
        now={now}
        currentDate={currentDate}
        avgDailySpend={avgDailySpend}
        categories={CATEGORIES}
        categoryTotals={categoryTotals}
        budgetAllocations={budgetAllocations}
        getBudgetBarColor={getBudgetBarColor}
        getBudgetTextColor={getBudgetTextColor}
        onOpenBudgetSettings={() => { setBudgetDraft({ ...budgetAllocations }); setShowBudgetSettings(true); }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        filteredExpenses={filteredExpenses}
        getCategoryColor={getCategoryColor}
        onDeleteExpense={handleDeleteExpense}
      />

      {showModal && (
        <ExpenseModal
          selectedDay={selectedDay}
          expenses={expenses}
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          categories={CATEGORIES}
          getCategoryColor={getCategoryColor}
          onAdd={handleAddExpense}
          onDelete={handleDeleteExpense}
          onClose={() => setShowModal(false)}
        />
      )}

      {showBudgetSettings && (
        <BudgetSettingsModal
          categories={CATEGORIES}
          budgetDraft={budgetDraft}
          setBudgetDraft={setBudgetDraft}
          onSave={saveBudgetAllocations}
          onClose={() => setShowBudgetSettings(false)}
        />
      )}
    </div>
  );
};

export default BudgetCalendarApp;