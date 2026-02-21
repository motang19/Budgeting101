import React from 'react';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid = ({ currentDate, expenses, onDayClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDay.getDay();

  const formatDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayTotal = (day) => {
    const dateKey = formatDateKey(day);
    return (expenses[dateKey] || []).reduce((sum, e) => sum + e.amount, 0);
  };

  const days = [];

  WEEK_DAYS.forEach(d =>
    days.push(
      <div key={`h-${d}`} className="text-center font-semibold text-gray-600 py-2 text-sm">{d}</div>
    )
  );

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`e-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const total = getDayTotal(day);
    days.push(
      <div
        key={day}
        onClick={() => onDayClick(day, formatDateKey(day))}
        className="border border-gray-200 min-h-20 p-2 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg"
      >
        <div className="font-semibold text-gray-700 mb-1">{day}</div>
        {total > 0 && (
          <div className="text-xs bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium">
            ${total.toFixed(2)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-7 gap-2">{days}</div>
    </div>
  );
};

export default CalendarGrid;