import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, UserCheck, FileDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";

const FLASK_API_URL = "http://192.0.0.2:5001";

const TakeAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { department, course, branch } = location.state || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [className, setClassName] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [lastAttendanceCollection, setLastAttendanceCollection] = useState<string | null>(null);
  
  // Get the branch data from the department/course/branch selection
  const selectedBranchData = department && course && branch ? 
    departments.find(d => d.name === department)
      ?.courses.find(c => c.name === course)
      ?.branches.find(b => b.name === branch) : null;
  
  // Get the years from the selected branch
  const years = selectedBranchData?.years || [];
  
  // Get the semesters from the selected year
  const semesters = selectedYear ? 
    selectedBranchData?.years.find(y => y.year === selectedYear)?.semesters || [] : [];
  
  // Set the class name based on selections
  useEffect(() => {
    if (department && course && branch && selectedYear && selectedSemester) {
      setClassName(`${department} - ${course} - ${branch} - ${selectedYear} - Semester ${selectedSemester}`);
    } else {
      setClassName("");
    }
  }, [department, course, branch, selectedYear, selectedSemester]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = () => {
    console.log("Opening camera");
    toast({
      title: "Camera",
      description: "Camera functionality will be available in the mobile app",
    });
  };
  
  const renderStatusMessage = () => {
    switch (processingStatus) {
      case "uploading":
        return "Uploading photo to server...";
      case "processing":
        return "Processing attendance (analyzing faces)...";
      default:
        return "Processing...";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photo || !photoFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please take or upload a photo",
      });
      return;
    }
    
    if (!className) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class",
      });
      return;
    }
    
    if (!timeSlot) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a time slot",
      });
      return;
    }
    
    setIsLoading(true);
    setProcessingStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("image", photoFile);
      formData.append("className", className);
      formData.append("timeSlot", timeSlot);
      
      toast({
        title: "Uploading",
        description: "Uploading photo to server...",
      });
      
      setProcessingStatus("processing");
      
      const response = await fetch(`${FLASK_API_URL}/process-attendance`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process attendance");
      }
      
      const data = await response.json();
      
      setIsLoading(false);
      setProcessingStatus(null);
      
      // Store the collection name for potential export
      if (data.collectionName) {
        setLastAttendanceCollection(data.collectionName);
      }
      
      const attendanceCount = data.attendance?.length || 0;
      const facesDetected = data.facesDetected || 0;
      
      if (attendanceCount > 0) {
        toast({
          title: "Success",
          description: `Attendance processed! ${attendanceCount} students marked present.`,
          variant: "default",
        });
      } else if (facesDetected > 0) {
        toast({
          title: "Warning",
          description: `${facesDetected} faces detected, but no matching students found.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Info",
          description: "No faces detected in the image.",
          variant: "default",
        });
      }
      
      navigate("/success", { 
        state: { 
          className, 
          timeSlot, 
          timestamp: new Date().toISOString(),
          attendance: data.attendance || [],
          facesDetected,
          collectionName: data.collectionName,
          department,
          course,
          branch,
          year: selectedYear,
          semester: selectedSemester
        } 
      });
      
    } catch (error) {
      console.error("Error processing attendance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process attendance",
      });
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };
  
  const handleExportAttendance = () => {
    if (!className || !timeSlot) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class and time slot to export attendance",
      });
      return;
    }
    
    // Create URL with query parameters
    const exportUrl = `${FLASK_API_URL}/export-attendance?className=${encodeURIComponent(className)}&timeSlot=${encodeURIComponent(timeSlot)}`;
    
    // Open in a new tab or download directly
    window.open(exportUrl, '_blank');
    toast({
      title: "Export",
      description: "Excel export initiated",
      variant: "default",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container px-4 pt-6 pb-16 mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Take Attendance</h2>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <Label>Selected Class</Label>
            <div className="p-3 bg-blue-50 rounded-md border border-blue-100 text-sm">
              {department ? (
                <div>
                  <p><span className="font-medium">Department:</span> {department}</p>
                  {course && <p><span className="font-medium">Course:</span> {course}</p>}
                  {branch && <p><span className="font-medium">Branch:</span> {branch}</p>}
                </div>
              ) : (
                <p className="text-blue-600">Please select a class from the home page</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={isLoading || !years.length}
              required
            >
              <SelectTrigger>
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
          
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select
              value={selectedSemester}
              onValueChange={setSelectedSemester}
              disabled={isLoading || !semesters.length}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.sem} value={semester.sem}>
                    Semester {semester.sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Select
              value={timeSlot}
              onValueChange={setTimeSlot}
              disabled={isLoading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Afternoon">Afternoon</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Card className="overflow-hidden">
            <div className="p-4">
              <Label className="block mb-2">Class Photo</Label>
              {photo ? (
                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={photo} 
                    alt="Class" 
                    className="w-full h-full object-cover" 
                  />
                  {!isLoading && (
                    <Button
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoFile(null);
                      }}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      Change
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 flex-col border-dashed border-2"
                    onClick={handleCapture}
                    disabled={isLoading}
                  >
                    <Camera className="h-6 w-6 mb-2" />
                    <span>Take Photo</span>
                  </Button>
                  
                  <div className="relative h-24">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-full w-full flex-col border-dashed border-2"
                      disabled={isLoading}
                    >
                      <Upload className="h-6 w-6 mb-2" />
                      <span>Upload</span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {isLoading && processingStatus && (
            <div className="bg-blue-50 p-4 rounded-md flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-700">{renderStatusMessage()}</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !photo || !className || !timeSlot || !selectedYear || !selectedSemester}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">Processing</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Submit Attendance</span>
                </span>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleExportAttendance}
              className="flex items-center gap-2"
              disabled={isLoading || !className || !timeSlot}
            >
              <FileDown className="h-5 w-5" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import the departments data so it can be used by this component
const departments = [
  {
    name: "Computer Science Engineering",
    courses: [
      {
        name: "B.Tech",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Artificial Intelligence and Machine Learning",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Cyber Security",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Diploma",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "M.Tech",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Civil Engineering",
    courses: [
      {
        name: "B.Tech",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Environmental Engineering",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Geoinformatics",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Diploma",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Mechanical Engineering",
    courses: [
      {
        name: "B.Tech",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Electric Vehicles",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Mechatronics",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Diploma",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Electronics and Communication Engineering",
    courses: [
      {
        name: "B.Tech",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Drone Technology",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
          {
            name: "Very Large Scale Integration",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "School of Computing",
    courses: [
      {
        name: "BCA",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
          {
            name: "Artificial Intelligence and Data Science",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "MCA",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Management",
    courses: [
      {
        name: "BBA",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
          {
            name: "International Finance and Accountancy with ACCA",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "B.Com",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
          {
            name: "International Finance and Accountancy with ACCA",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "MBA",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Nursing",
    courses: [
      {
        name: "B.Sc. Nursing",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Pharmacy",
    courses: [
      {
        name: "B.Pharma",
        branches: [
          {
            name: "Core",
            years: [
              {
                year: "1st Year",
                semesters: [
                  { sem: "1" },
                  { sem: "2" },
                ],
              },
              {
                year: "2nd Year",
                semesters: [
                  { sem: "3" },
                  { sem: "4" },
                ],
              },
              {
                year: "3rd Year",
                semesters: [
                  { sem: "5" },
                  { sem: "6" },
                ],
              },
              {
                year: "4th Year",
                semesters: [
                  { sem: "7" },
                  { sem: "8" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // Add more departments here if needed
];

export default TakeAttendance;
