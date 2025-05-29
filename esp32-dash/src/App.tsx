import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LocationCard } from "./LocationCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface SensorData {
  tds: number;
  rpm: number;
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
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
  voltage?: number;
}

const ESP_IP = "http://10.0.0.39";

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
            voltage: 0.06 * json.rpm
          };
          return [...prev, entry];
        });
      } catch (e) {
        console.error("Fetch error", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const downloadCSV = () => {
    if (!history.length) return;

    const header = Object.keys(history[0]).join(",");
    const rows = history.map((row) => Object.values(row).join(","));
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `sensor_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Temp fix
  // if (!data) return <div className="p-4 flex font-semibold justify-center">Loading...</div>;

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
                <Line key={key} type="monotone" stroke={color} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4">
      <div
        className="flex rounded-4xl items-center justify-between text-orange-100 px-6 py-4 shadow mb-6"
        style={{ backgroundColor: "#081c44" }}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full w-15 h-15 flex items-center justify-center text-black font-bold text-sm">
            <img src="/logo.png" alt="Wave to the Future logo" />
          </div>
          <h2 className="font-semibold text-2xl">Wave to the Future</h2>
        </div>
        <div className="flex-col w-48 mr-10 mt-2">
          <Progress value={80} />
          <span className="text-sm text-gray-300 mt-1 block text-right">
            Filter Health: 80%
          </span>
        </div>
      </div>

      <div className="flex-row justify-self-center pt-2">
        <div className="text-4xl font-semibold">System dashboard</div>
      </div>

      <div className="flex justify-end mr-10 mb-4">
        <button
          onClick={downloadCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          Download All Data as CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-5 justify-center mt-10 mr-10 ml-10 overflow-x-hidden">
        {renderChart("RPM", [{ key: "rpm", color: "#4f46e5" }])}
        {renderChart("TDS", [{ key: "tds", color: "#22c55e" }])}
        {renderChart("Accel", [
          { key: "accelX", color: "#ef4444" },
          { key: "accelY", color: "#f59e0b" },
          { key: "accelZ", color: "#10b981" }
        ])}
        {renderChart("Gyro", [
          { key: "gyroX", color: "#8b5cf6" },
          { key: "gyroY", color: "#ec4899" },
          { key: "gyroZ", color: "#0ea5e9" }
        ])}
        {renderChart("Generated Voltage", [
          { key: "voltage", color: "#f97316" }
        ])}
      </div>

      {/* Google Map */}
      <LocationCard />
    </div>
  );
}
