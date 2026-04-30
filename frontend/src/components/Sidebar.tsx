import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiUsers, FiClock, FiFileText, FiRepeat, FiBarChart2, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { user } = useAuth();

  const isManagement = user?.role === 'admin' || user?.role === 'manager';

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/schedule', icon: FiCalendar, label: 'Schedule' },
    ...(isManagement ? [{ path: '/shift-overview', icon: FiBarChart2, label: 'All Shifts' }] : []),
    { path: '/attendance', icon: FiClock, label: 'Attendance' },
    { path: '/leaves', icon: FiFileText, label: 'Leaves' },
    { path: '/swaps', icon: FiRepeat, label: 'Shift Swaps' },
    ...(isManagement ? [{ path: '/employees', icon: FiUsers, label: 'Employees' }] : []),
    ...(isManagement ? [{ path: '/reports', icon: FiBarChart2, label: 'Reports' }] : []),
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-primary-600">ShiftFlow</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'employee'} workspace</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
};

export default Sidebar;
