
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  timeSlot: string;
  presentCount: number;
  absentCount: number;
}

const mockRecords: AttendanceRecord[] = [
  {
    id: "1",
    date: "2023-05-15",
    className: "Math 101",
    timeSlot: "Morning",
    presentCount: 24,
    absentCount: 3,
  },
  {
    id: "2",
    date: "2023-05-15",
    className: "Physics 202",
    timeSlot: "Afternoon",
    presentCount: 18,
    absentCount: 2,
  },
  {
    id: "3",
    date: "2023-05-14",
    className: "Math 101",
    timeSlot: "Morning",
    presentCount: 22,
    absentCount: 5,
  },
  {
    id: "4",
    date: "2023-05-13",
    className: "Chemistry 303",
    timeSlot: "Evening",
    presentCount: 15,
    absentCount: 1,
  },
];

const Records = () => {
  const [filter, setFilter] = useState<string>("all");
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  
  useEffect(() => {
    if (filter === "all") {
      setFilteredRecords(mockRecords);
    } else {
      setFilteredRecords(mockRecords.filter(record => record.className === filter));
    }
  }, [filter]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container px-4 py-6 mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Attendance Records</h2>
        
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="Math 101">Math 101</SelectItem>
              <SelectItem value="Physics 202">Physics 202</SelectItem>
              <SelectItem value="Chemistry 303">Chemistry 303</SelectItem>
              <SelectItem value="Biology 404">Biology 404</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs defaultValue="list" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            {filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">
                  No attendance records found.
                </CardContent>
              </Card>
            ) : (
              filteredRecords.map(record => (
                <Card key={record.id} className="overflow-hidden">
                  <div className="flex border-l-4 border-blue-500">
                    <div className="py-4 px-5 bg-blue-50 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">{record.date}</p>
                        <p className="font-medium">{record.timeSlot}</p>
                      </div>
                    </div>
                    
                    <CardContent className="py-4 px-5 flex-1">
                      <h3 className="font-semibold text-lg mb-1">{record.className}</h3>
                      <div className="flex justify-between text-sm">
                        <p className="text-green-600">{record.presentCount} Present</p>
                        <p className="text-red-600">{record.absentCount} Absent</p>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>
                  Calendar view will be available in future updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center border-t">
                <p className="text-gray-500">Coming Soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Records;
