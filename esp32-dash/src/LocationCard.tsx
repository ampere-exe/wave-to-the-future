import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

export function LocationCard() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyD7cXxEgRavaLmeapx6ZWe7ZIfQBmNNeVc",
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocation({ lat: 37.7749, lng: -122.4194 }); // Default: San Francisco
        }
      );
    } else {
      console.warn("Geolocation not supported");
      setLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  return (
    <Card className="flex-1 h-[600px] min-w-[400px] mr-10 ml-10 mt-5">
      <CardContent className="p-4 h-full">
        <h2 className="text-lg font-bold mb-2">Device Location</h2>
        <div className="rounded-xs w-full h-[500px]">
          {isLoaded && location ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={location}
              zoom={14}
            >
              <Marker position={location} />
            </GoogleMap>
          ) : (
            <div>Loading map...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
