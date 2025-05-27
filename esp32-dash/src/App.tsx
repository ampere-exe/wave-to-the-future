import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SensorData {
  tds: number;
  rpm: number;
  accel: {
    x: number;
    y: number;
    z: number;
  };
  gyro: {
    x: number;
    y: number;
    z: number;
  };
}

interface HistoryEntry {
  time: string;
  rpm: number;
  tds: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

const ESP_IP = 'http://10.0.0.39';

export default function App() {
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${ESP_IP}/api/data`);
        const json: SensorData = await res.json();
        setData(json);

        setHistory((prev) => {
          const entry: HistoryEntry = {
            time: new Date().toLocaleTimeString(),
            rpm: json.rpm,
            tds: json.tds,
            accelX: json.accel.x,
            accelY: json.accel.y,
            accelZ: json.accel.z,
            gyroX: json.gyro.x,
            gyroY: json.gyro.y,
            gyroZ: json.gyro.z,
          };
          const updated = [...prev, entry];
          if (updated.length > 20) updated.shift();
          return updated;
        });
      } catch (e) {
        console.error('Fetch error', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="p-4">Loading...</div>;

  const renderChart = (
    title: string,
    lines: { key: keyof HistoryEntry; color: string }[]
  ) => (
    <Card className="flex-1 h-[340px] min-w-[400px]">
      <CardContent className="p-4 h-full">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              {lines.map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className=" p-4 ">
      <div className="flex justify-center">
        <h1 className="text-2xl font-semibold">Wave to the Future System Dashboard</h1>
      </div>
      <div className="flex flex-wrap gap-5 justify-center mt-10 mr-10 ml-10 overflow-x-hidden">
        {renderChart('RPM', [{ key: 'rpm', color: '#4f46e5' }])}
        {renderChart('TDS', [{ key: 'tds', color: '#22c55e' }])}
        {renderChart('Accel', [
          { key: 'accelX', color: '#ef4444' },
          { key: 'accelY', color: '#f59e0b' },
          { key: 'accelZ', color: '#10b981' },
        ])}
        {renderChart('Gyro', [
          { key: 'gyroX', color: '#8b5cf6' },
          { key: 'gyroY', color: '#ec4899' },
          { key: 'gyroZ', color: '#0ea5e9' },
        ])}
      </div>
    </div>
  );
}
