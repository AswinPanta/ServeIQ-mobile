import { useEffect, useState, useRef } from 'react';
import { Text } from 'react-native';

interface CleaningTimerProps {
  startTime: number;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export function CleaningTimer({ startTime, warningThreshold = 15, dangerThreshold = 30 }: CleaningTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let color = '#22C55E';
  if (minutes >= dangerThreshold) color = '#EF4444';
  else if (minutes >= warningThreshold) color = '#F59E0B';

  return (
    <Text style={{ fontSize: 14, fontWeight: '700', color, fontVariant: ['tabular-nums'] }}>{display}</Text>
  );
}
