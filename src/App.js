import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import HomeScreen from './screens/HomeScreen';
import BookScreen from './screens/BookScreen';
import SubBookScreen from './screens/SubBookScreen';
import AlarmScreen from './screens/AlarmScreen';
import TaskScreen from './screens/TaskScreen';
import { getAllAlarms, updateAlarm } from './services/storageService';

function AlarmManager() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAlarms = async () => {
      const allAlarms = await getAllAlarms();
      const now = new Date();
      const dueAlarms = allAlarms.filter(alarm => {
        if (!alarm.alarmTime || alarm.isCompleted || alarm.triggered) return false;
        const alarmDate = new Date(alarm.alarmTime);
        return alarmDate <= now;
      });

      if (dueAlarms.length === 0) return;

      const alarmToTrigger = dueAlarms[0];

      await updateAlarm(alarmToTrigger.id, {
        triggered: true,
        lastTriggered: new Date().toISOString()
      });
      navigate(`/alarm/${alarmToTrigger.id}`);
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>ACAES alarm</Link>
          <AlarmManager />
        </nav>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/book/:id" element={<BookScreen />} />
          <Route path="/subbook/:id" element={<SubBookScreen />} />
          <Route path="/alarm/:id" element={<AlarmScreen />} />
          <Route path="/task/:id" element={<TaskScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;