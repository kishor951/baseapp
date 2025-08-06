import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export default function useTimer(initialSeconds = 3600) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            Alert.alert('Timer Finished!', 'Your focus session is complete!');
            return 0;
          }
          return newTime;
        });
      }, 1000);
      intervalRef.current = interval;
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleTimer = () => {
    setIsRunning(running => {
      console.log('toggleTimer called. Previous isRunning:', running, 'Next isRunning:', !running);
      return !running;
    });
  };
  const restartTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setTimeLeft(initialSeconds);
    setInitialTime(initialSeconds);
  };
  const addTime = (minutes) => {
    const additionalTime = minutes * 60;
    setTimeLeft(prevTime => prevTime + additionalTime);
    setInitialTime(prevInitial => prevInitial + additionalTime);
  };
  const progress = initialTime > 0 ? (initialTime - timeLeft) / initialTime : 0;

  return {
    timeLeft,
    isRunning,
    initialTime,
    toggleTimer,
    restartTimer,
    addTime,
    progress,
    setTimeLeft,
    setInitialTime,
    setIsRunning,
  };
}
