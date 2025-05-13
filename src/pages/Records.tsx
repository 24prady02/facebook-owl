import { useState } from "react";
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
import { departments } from "./index"; // Import the departments data from index

const FLASK_API_URL = "http://192.0.0.2:5001";

interface AttendanceRecord {
  id: string;
  date: string;
  department: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  timeSlot: string;
  presentCount: number;
  absentCount: number;
}

// Function to get collection name based on class details
const getCollectionName = (
  department: string,
  course: string,
  branch: string,
  year: string,
  semester: string,
  timeSlot: string
) => {
  const cleanDept = department.replace(/\s+/g, '');
  const cleanCourse = course.replace(/\s+/g, '');
  const cleanBranch = branch.replace(/\s+/g, '');
  const cleanYear = year.replace(/\s+/g, '');
  const cleanSem = semester.replace(/\s+/g, '');
  const cleanSlot = timeSlot.replace(/\s+/g, '');
  return `${cleanDept}_${cleanCourse}_${cleanBranch}_${cleanYear}_${cleanSem}_${cleanSlot}_attendance`;
};

// Function to fetch attendance records from Firestore
const fetchAttendanceRecords = async (
  department: string,
  course: string,
  branch: string,
  year: string,
  semester: string
) => {
  try {
    const timeSlots = ["Morning", "Afternoon", "Evening"];
    const records: AttendanceRecord[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const timeSlot of timeSlots) {
      const collectionName = getCollectionName(
        department,
        course,
        branch,
        year,
        semester,
        timeSlot
      );

      try {
        const q = query(
          collection(db, collectionName),
          where("date", "==", today)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          records.push({
            id: `${department}-${course}-${branch}-${year}-${semester}-${timeSlot}-${today}`,
            date: today,
            department,
            course,
            branch,
            year,
            semester,
            timeSlot,
            presentCount: querySnapshot.size,
            absentCount: 0, // Would need total class size to calculate this
          });
        }
      } catch (error) {
        console.log(`No collection found for ${collectionName}`);
      }
    }
    
    return records;
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    throw error;
  }
};

const Records = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  
  // Filter courses based on selected department
  const courses = selectedDepartment 
    ? departments.find(dept => dept.name === selectedDepartment)?.courses || []
    : [];
    
  // Filter branches based on selected course
  const branches = selectedCourse && selectedDepartment
    ? departments.find(dept => dept.name === selectedDepartment)?.courses.find(course => course.name === selectedCourse)?.branches || []
    : [];
    
  // Filter years based on selected branch
  const years = selectedBranch && selectedCourse && selectedDepartment
    ? departments.find(dept => dept.name === selectedDepartment)?.courses.find(course => course.name === selectedCourse)?.branches.find(branch => branch.name === selectedBranch)?.years || []
    : [];
    
  // Filter semesters based on selected year
  const semesters = selectedYear && selectedBranch && selectedCourse && selectedDepartment
    ? departments.find(dept => dept.name === selectedDepartment)?.courses.find(course => course.name === selectedCourse)?.branches.find(branch => branch.name === selectedBranch)?.years.find(year => year.year === selectedYear)?.semesters || []
    : [];

  // Use React Query to fetch and cache attendance records
  const { data: attendanceRecords, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendanceRecords', selectedDepartment, selectedCourse, selectedBranch, selectedYear, selectedSemester],
    queryFn: () => fetchAttendanceRecords(
      selectedDepartment,
      selectedCourse,
      selectedBranch,
      selectedYear,
      selectedSemester
    ),
    enabled: !!selectedSemester // Only fetch when semester is selected
  });

  const handleExportAttendance = (
    department: string,
    course: string,
    branch: string,
    year: string,
    semester: string,
    timeSlot: string
  ) => {
    if (!department || !course || !branch || !year || !semester || !timeSlot) {
      toast.error("Please select all required fields to export attendance");
      return;
    }
    
    const exportUrl = `${FLASK_API_URL}/export-attendance?department=${encodeURIComponent(department)}&course=${encodeURIComponent(course)}&branch=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}&timeSlot=${encodeURIComponent(timeSlot)}`;
    
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
            disabled={!selectedSemester}
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Select 
              value={selectedDepartment} 
              onValueChange={(value) => {
                setSelectedDepartment(value);
                setSelectedCourse("");
                setSelectedBranch("");
                setSelectedYear("");
                setSelectedSemester("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <Select 
                value={selectedCourse} 
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  setSelectedBranch("");
                  setSelectedYear("");
                  setSelectedSemester("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.name} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCourse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <Select 
                value={selectedBranch} 
                onValueChange={(value) => {
                  setSelectedBranch(value);
                  setSelectedYear("");
                  setSelectedSemester("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedBranch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select 
                value={selectedYear} 
                onValueChange={(value) => {
                  setSelectedYear(value);
                  setSelectedSemester("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.year} value={year.year}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedYear && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <Select 
                value={selectedSemester} 
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.sem} value={sem.sem}>
                      Semester {sem.sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            ) : !selectedSemester ? (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">
                  Please select all filters to view attendance records.
                </CardContent>
              </Card>
            ) : attendanceRecords?.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">
                  No attendance records found for the selected criteria.
                </CardContent>
              </Card>
            ) : (
              attendanceRecords?.map(record => (
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
                          <h3 className="font-semibold text-lg mb-1">
                            {record.department} - {record.course} ({record.branch})
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Year: {record.year}, Semester: {record.semester}
                          </p>
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
                          onClick={() => handleExportAttendance(
                            record.department,
                            record.course,
                            record.branch,
                            record.year,
                            record.semester,
                            record.timeSlot
                          )}
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
