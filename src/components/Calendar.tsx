'use client';

import { useState } from 'react';

export default function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Function to get all dates in a month
  const getDatesInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates: Date[] = [];

    for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    return dates;
  };

  // Get month name
  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Navigation functions
  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  return (
    <section id="calendar" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Availability Calendar</h2>
        
        {/* Calendar Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={prevMonth}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Previous
          </button>
          <h3 className="text-xl font-semibold">{monthName}</h3>
          <button 
            onClick={nextMonth}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Next
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {getDatesInMonth(selectedMonth).map((date) => (
            <div
              key={formatDate(date)}
              className="border p-2 min-h-[80px] text-center hover:bg-gray-50"
            >
              <span className="text-sm">{date.getDate()}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border border-green-300"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border border-red-300"></div>
            <span className="text-sm">Booked</span>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Pricing Information</h3>
          <div className="space-y-2">
            <p>March - April 2025: $500 per night for the entire center</p>
            <p>May 2025 onwards: $600 per night for the entire center</p>
            <p className="text-sm text-gray-600 mt-4">
              * Minimum 2-night stay required<br />
              * $250 refundable deposit (up to 10 days before arrival)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
