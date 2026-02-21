import { X, Plus } from 'lucide-react';

const ExpenseModal = ({ selectedDay, expenses, newExpense, setNewExpense, categories, getCategoryColor, onAdd, onDelete, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Expenses for Day {selectedDay.day}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">Add Expense</h4>
        <input type="text" placeholder="Description" value={newExpense.description}
          onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input type="number" placeholder="Amount" step="0.01" value={newExpense.amount}
          onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
        </select>
        <button onClick={onAdd} className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Today's Expenses</h4>
        {(expenses[selectedDay.dateKey] || []).length === 0 ? (
          <p className="text-gray-500 text-sm">No expenses yet</p>
        ) : (
          <div className="space-y-2">
            {(expenses[selectedDay.dateKey] || []).map(expense => (
              <div key={expense.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{expense.description}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)} text-white`}>
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">${expense.amount.toFixed(2)}</span>
                  <button onClick={() => onDelete(selectedDay.dateKey, expense.id)} className="text-red-500 hover:text-red-700">
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
);

export default ExpenseModal;