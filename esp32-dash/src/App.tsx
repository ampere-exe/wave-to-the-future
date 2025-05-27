import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card" 
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
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
  rpm: number;
  time: string;
}

const ESP_IP = 'http://10.0.0.39'; // ESP32 IP 

export default function App() {
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${ESP_IP}/api/data`);
        const json: SensorData = await res.json();
        setData(json);

        setHistory((h) => {
          const newHistory = [...h, { rpm: json.rpm, time: new Date().toLocaleTimeString() }];
          if (newHistory.length > 20) newHistory.shift();
          return newHistory;
        });
      } catch (e) {
        console.error('Fetch error', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-bold mb-2">Current Sensor Data</h2>
        <p><strong>TDS:</strong> {data.tds}</p>
        <p><strong>RPM:</strong> {data.rpm.toFixed(2)}</p>
        <p><strong>Accel:</strong> x={data.accel.x}, y={data.accel.y}, z={data.accel.z}</p>
        <p><strong>Gyro:</strong> x={data.gyro.x}, y={data.gyro.y}, z={data.gyro.z}</p>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-bold mb-2">RPM Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rpm" stroke="#4f46e5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
