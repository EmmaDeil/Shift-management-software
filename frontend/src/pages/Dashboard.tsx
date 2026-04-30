const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Today's Shifts</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-sm text-green-600 mt-1">+2 from yesterday</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">48</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Out of 50 total</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Swaps</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">5</p>
          <p className="text-sm text-orange-600 mt-1">Needs review</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Attendance Rate</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">96%</p>
          <p className="text-sm text-green-600 mt-1">+3% from last week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Shifts</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">No upcoming shifts to display</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
