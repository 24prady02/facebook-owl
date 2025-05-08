
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
import { Button } from "@/components/ui/button";
import { FileDown, RefreshCcw } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const FLASK_API_URL = "http://192.0.0.2:5001";

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  timeSlot: string;
  presentCount: number;
  absentCount: number;
}

interface StudentAttendance {
  student_id: string;
  class: string;
  slot: string;
  timestamp: Date;
  status: string;
  date: string;
}

// Function to get collection name based on class and time slot
const getCollectionName = (className: string, timeSlot: string) => {
  const cleanClass = className.replace(/\s+/g, '');
  const cleanSlot = timeSlot.replace(/\s+/g, '');
  return `${cleanClass}_${cleanSlot}_attendance`;
};

// Function to fetch attendance records from Firestore
const fetchAttendanceRecords = async () => {
  try {
    const classes = ["Math 101", "Physics 202", "Chemistry 303", "Biology 404"];
    const timeSlots = ["Morning", "Afternoon", "Evening"];
    
    const records: AttendanceRecord[] = [];
    
    for (const className of classes) {
      for (const timeSlot of timeSlots) {
        const collectionName = getCollectionName(className, timeSlot);
        const today = new Date().toISOString().split('T')[0];
        
        try {
          const q = query(
            collection(db, collectionName),
            where("date", "==", today)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Count present students
            const presentCount = querySnapshot.size;
            
            records.push({
              id: `${className}-${timeSlot}-${today}`,
              date: today,
              className,
              timeSlot,
              presentCount,
              absentCount: 0, // We don't have absent count in current data model
            });
          }
        } catch (error) {
          console.log(`No collection found for ${collectionName}`);
        }
      }
    }
    
    return records;
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    throw error;
  }
};


const Records = () => {
  const [filter, setFilter] = useState<string>("all");
  
  // Use React Query to fetch and cache attendance records
  const { data: attendanceRecords, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendanceRecords'],
    queryFn: fetchAttendanceRecords,
  });
  
  // Filter records based on selected class
  const filteredRecords = attendanceRecords?.filter(record => 
    filter === "all" || record.className === filter
  ) || [];
  
  const handleExportAttendance = (className: string, timeSlot: string) => {
    if (!className || !timeSlot) {
      toast.error("Please select a class and time slot to export attendance");
      return;
    }
    
    // Create URL with query parameters
    const exportUrl = `${FLASK_API_URL}/export-attendance?className=${encodeURIComponent(className)}&timeSlot=${encodeURIComponent(timeSlot)}`;
    
    // Open in a new tab or download directly
    window.open(exportUrl, '_blank');
    toast.success("Excel export initiated");
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Attendance Records</h2>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
        
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
            {isLoading ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading attendance records...</p>
                </CardContent>
              </Card>
            ) : isError ? (
              <Card>
                <CardContent className="py-10 text-center text-red-500">
                  Error loading attendance records. Please try again.
                </CardContent>
              </Card>
            ) : filteredRecords.length === 0 ? (
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
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{record.className}</h3>
                          <div className="flex space-x-4 text-sm">
                            <p className="text-green-600">{record.presentCount} Present</p>
                            {record.absentCount > 0 && (
                              <p className="text-red-600">{record.absentCount} Absent</p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportAttendance(record.className, record.timeSlot)}
                          className="flex items-center gap-1"
                        >
                          <FileDown className="h-4 w-4" />
                          <span>Export</span>
                        </Button>
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
