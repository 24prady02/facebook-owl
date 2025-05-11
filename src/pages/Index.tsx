import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { motion } from "framer-motion";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Department data structure
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
  // Add more departments here if needed
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  
  // Filter courses based on selected department
  const courses = selectedDepartment 
    ? departments.find(dept => dept.name === selectedDepartment)?.courses || []
    : [];
    
  // Filter branches based on selected course
  const branches = selectedCourse && selectedDepartment
    ? departments.find(dept => dept.name === selectedDepartment)?.courses.find(course => course.name === selectedCourse)?.branches || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container px-4 pt-8 pb-16 mx-auto"
      >
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-4">Face Attendance</h1>
          <p className="text-gray-600">
            Take attendance quickly and accurately using facial recognition
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-blue-700">Select Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setSelectedCourse("");
                    setSelectedBranch("");
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
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 max-w-md mx-auto">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-blue-700">Take Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Capture class photos and mark attendance automatically
              </p>
              <Button 
                onClick={() => navigate("/take-attendance", { 
                  state: { 
                    department: selectedDepartment,
                    course: selectedCourse,
                    branch: selectedBranch 
                  } 
                })}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedBranch}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-blue-700">View Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Access attendance history and generate reports
              </p>
              <Button 
                variant="outline"
                onClick={() => navigate("/records", { 
                  state: { 
                    department: selectedDepartment,
                    course: selectedCourse,
                    branch: selectedBranch 
                  } 
                })} 
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                disabled={!selectedBranch}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
