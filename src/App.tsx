import './App.css';
import { ScheduleBoard } from './components/ScheduleBoard';

function App() {
  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h2 mb-2">Literal Schedule Calendar</h1>
        <p className="text-muted mb-1">1. Add people (comma or new line list). 2. (Optional) add custom time slots. 3. Click Auto Assign to populate the month. 4. Manually adjust any cell.</p>
      </div>
      <ScheduleBoard />
    </div>
  );
}

export default App;
