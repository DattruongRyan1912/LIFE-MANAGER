'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

interface PomodoroTimerProps {
  taskId?: number;
  taskTitle?: string;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  estimatedMinutes?: number; // Total estimated minutes for the task
  onPomodoroComplete?: () => void;
}

export default function PomodoroTimer({
  taskId,
  taskTitle = 'Focus Session',
  estimatedPomodoros = 1,
  completedPomodoros = 0,
  estimatedMinutes,
  onPomodoroComplete,
}: PomodoroTimerProps) {
  const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
  const SHORT_BREAK = 5 * 60; // 5 minutes
  const LONG_BREAK = 15 * 60; // 15 minutes

  // Calculate remaining time for smart Pomodoro adjustment
  const getRemainingMinutes = () => {
    if (!estimatedMinutes) return null;
    const completedMinutes = (completedPomodoros || 0) * 25;
    const remaining = estimatedMinutes - completedMinutes;
    return remaining > 0 ? remaining : 0;
  };

  // Get initial Pomodoro time (adjust for last session)
  const getInitialPomodoroTime = () => {
    const remainingMinutes = getRemainingMinutes();
    if (remainingMinutes !== null && remainingMinutes < 25 && remainingMinutes > 0) {
      return remainingMinutes * 60; // Convert to seconds
    }
    return POMODORO_TIME;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialPomodoroTime());
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(completedPomodoros);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (!isBreak) {
      // Pomodoro completed
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      // Call backend to mark Pomodoro complete
      if (taskId) {
        try {
          await fetch(`http://localhost:8000/api/tasks/${taskId}/pomodoro/complete`, {
            method: 'POST',
          });
          onPomodoroComplete?.();
        } catch (error) {
          console.error('Error completing Pomodoro:', error);
        }
      }

      // Start break
      const breakTime = newSessions % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
      setTimeLeft(breakTime);
      setIsBreak(true);
      
      // Play notification sound (browser notification)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete! 🍅', {
          body: `Great work! Time for a ${newSessions % 4 === 0 ? 'long' : 'short'} break.`,
        });
      }
    } else {
      // Break completed - calculate next Pomodoro time
      const remainingMinutes = getRemainingMinutes();
      let nextPomodoroTime = POMODORO_TIME;
      
      if (remainingMinutes !== null) {
        const nextSessionMinutes = remainingMinutes - (sessionsCompleted * 25);
        if (nextSessionMinutes > 0 && nextSessionMinutes < 25) {
          nextPomodoroTime = nextSessionMinutes * 60; // Use remaining time for last session
        }
      }
      
      setTimeLeft(nextPomodoroTime);
      setIsBreak(false);

      if ('Notification' in window && Notification.permission === 'granted') {
        const remainingMins = Math.floor(nextPomodoroTime / 60);
        new Notification('Break Over! 💪', {
          body: remainingMins < 25 
            ? `Final sprint: ${remainingMins} minutes to complete this task!`
            : 'Ready to start your next Pomodoro session?',
        });
      }
    }
  };

  const handleStart = () => {
    // Request notification permission on first start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (isBreak) {
      setTimeLeft(sessionsCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
    } else {
      // Reset to appropriate Pomodoro time (adjusted for remaining minutes)
      setTimeLeft(getInitialPomodoroTime());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionTime = () => {
    if (isBreak) {
      return sessionsCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
    }
    return getInitialPomodoroTime();
  };

  const progress = isBreak
    ? ((sessionsCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK) - timeLeft) /
      (sessionsCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK)
    : (getCurrentSessionTime() - timeLeft) / getCurrentSessionTime();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🍅 Pomodoro Timer
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {sessionsCompleted}/{estimatedPomodoros}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Title */}
        <div className="text-center">
          <h3 className="font-medium text-lg">{taskTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {isBreak
              ? `${sessionsCompleted % 4 === 0 ? 'Long' : 'Short'} Break`
              : timeLeft < POMODORO_TIME
              ? `Final Sprint! (${Math.floor(timeLeft / 60)}m remaining)`
              : 'Focus Time'}
          </p>
        </div>

        {/* Timer Display */}
        <div className="relative">
          {/* Progress Circle */}
          <svg className="w-full h-48" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted opacity-20"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={isBreak ? 'text-blue-500' : 'text-primary'}
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          
          {/* Time Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={timeLeft === POMODORO_TIME && !isBreak}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {!isRunning ? (
            <Button size="lg" onClick={handleStart} className="px-8">
              <Play className="h-5 w-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button size="lg" onClick={handlePause} variant="secondary" className="px-8">
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </Button>
          )}

          {taskId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsRunning(false);
                handleTimerComplete();
              }}
              disabled={isRunning}
              title={isBreak ? "Skip break" : "Skip to break"}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Session Progress */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.min(estimatedPomodoros, 8) }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < sessionsCompleted
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
