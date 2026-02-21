import { X } from 'lucide-react';

const BudgetSettingsModal = ({ categories, budgetDraft, setBudgetDraft, onSave, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Monthly Budget Allocations</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Set how much you want to spend per category. Leave blank for no limit.</p>
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
                type="number" min="0" step="1" placeholder="No limit"
                value={budgetDraft[cat.name] || ''}
                onChange={e => setBudgetDraft(prev => ({ ...prev, [cat.name]: e.target.value }))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">Save Budgets</button>
      </div>
    </div>
  </div>
);

export default BudgetSettingsModal;