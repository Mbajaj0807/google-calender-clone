// Google Calendar–style logo mark
const CalendarLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Calendar logo"
  >
    <rect width="40" height="40" rx="8" fill="white" />
    <rect x="1" y="1" width="38" height="38" rx="7" stroke="#DADCE0" strokeWidth="1" />
    {/* Top bar */}
    <rect x="1" y="1" width="38" height="10" rx="7" fill="#1A73E8" />
    <rect x="1" y="7" width="38" height="4" fill="#1A73E8" />
    {/* Date pins */}
    <rect x="10" y="5" width="3" height="8" rx="1.5" fill="white" />
    <rect x="27" y="5" width="3" height="8" rx="1.5" fill="white" />
    {/* Date number */}
    <text x="20" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1A73E8" fontFamily="Google Sans, sans-serif">
      20
    </text>
  </svg>
);

import React from 'react';
export default CalendarLogo;
