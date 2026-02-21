import React from 'react';
import { Search, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { X } from 'lucide-react';

const Sidebar = ({
  isCurrentMonth, now, currentDate, avgDailySpend,
  categories, categoryTotals, budgetAllocations,
  getBudgetBarColor, getBudgetTextColor,
  onOpenBudgetSettings,
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory,
  filteredExpenses, getCategoryColor,
  onDeleteExpense,
}) => {
  return (
    <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" /> Expenses Overview
      </h2>

      {/* Daily Average Card */}
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

      {/* Category Budget Breakdown */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">By Category</h3>
          <button
            onClick={onOpenBudgetSettings}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Settings className="w-3 h-3" /> Set Budgets
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
                    {hasBudget && <span className="text-gray-400 text-xs">/ ${allocated.toFixed(0)}</span>}
                    {pctDisplay !== null && (
                      <span className={`text-xs font-bold ${getBudgetTextColor(pctDisplay)}`}>{pctDisplay}%</span>
                    )}
                  </div>
                </div>
                {hasBudget && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getBudgetBarColor(pctDisplay)}`}
                      style={{ width: `${pct}%` }}
                    />
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
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
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
            <div key={expense.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{expense.description}</div>
                  <div className="text-xs text-gray-500">{expense.dateKey}</div>
                </div>
                <button
                  onClick={() => onDeleteExpense(expense.dateKey, expense.id)}
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
  );
};

export default Sidebar;