import React, { useState } from 'react';
import { X, Plus, Pencil, Check } from 'lucide-react';

const ExpenseModal = ({
  selectedDay, expenses, newExpense, setNewExpense,
  categories, getCategoryColor, onAdd, onDelete, onUpdate, onClose
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditDraft({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const handleSaveEdit = (expense) => {
    if (!editDraft.description || !editDraft.amount) return;
    onUpdate(selectedDay.dateKey, expense.id, {
      description: editDraft.description,
      amount: parseFloat(editDraft.amount),
      category: editDraft.category,
    });
    setEditingId(null);
    setEditDraft({});
  };

  const dayExpenses = expenses[selectedDay.dateKey] || [];
  const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[480px] max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Day {selectedDay.day}</h3>
            {dayTotal > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                Total: <span className="font-semibold text-gray-700">${dayTotal.toFixed(2)}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Add New Expense Form */}
        <div className="mb-5 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Add Expense</h4>
          <input
            type="text"
            placeholder="Description"
            value={newExpense.description}
            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={newExpense.amount}
              onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newExpense.category}
              onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <button
            onClick={onAdd}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* Existing Expenses */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">
            {dayExpenses.length === 0 ? "No expenses yet" : `${dayExpenses.length} Expense${dayExpenses.length !== 1 ? 's' : ''}`}
          </h4>
          <div className="space-y-2">
            {dayExpenses.map(expense => (
              <div key={expense.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                {editingId === expense.id ? (
                  /* Edit mode */
                  <div>
                    <input
                      type="text"
                      value={editDraft.description}
                      onChange={e => setEditDraft({ ...editDraft, description: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.amount}
                        onChange={e => setEditDraft({ ...editDraft, amount: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={editDraft.category}
                        onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(expense)}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={() => { onDelete(selectedDay.dateKey, expense.id); cancelEdit(); }}
                        className="flex items-center justify-center gap-1 bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        <X className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{expense.description}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(expense.category)} text-white`}>
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="font-bold text-gray-800">${expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => startEdit(expense)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(selectedDay.dateKey, expense.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;