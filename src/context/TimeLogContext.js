import React, { createContext, useContext, useState } from 'react';

const TimeLogContext = createContext();

export function TimeLogProvider({ children }) {
  const [timeLogs, setTimeLogs] = useState([]);

  function addTimeLog(log) {
    setTimeLogs(prev => [...prev, { ...log, id: Date.now().toString() }]);
  }

  return (
    <TimeLogContext.Provider value={{ timeLogs, addTimeLog }}>
      {children}
    </TimeLogContext.Provider>
  );
}

export function useTimeLogs() {
  return useContext(TimeLogContext);
}
