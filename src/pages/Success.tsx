
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "@/components/AppHeader";

interface AttendanceRecord {
  studentId: string;
  status: string;
  distance: number;
}

interface LocationState {
  className: string;
  timeSlot: string;
  timestamp: string;
  attendance?: AttendanceRecord[];
  facesDetected?: number;
}

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<LocationState | null>(null);
  
  useEffect(() => {
    if (location.state) {
      setState(location.state as LocationState);
    } else {
      navigate("/");
    }
  }, [location, navigate]);
  
  if (!state) return null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container px-4 py-10 mx-auto">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Attendance Recorded Successfully
          </h2>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 my-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium">{state.className}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-medium">{state.timeSlot}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {new Date(state.timestamp).toLocaleString()}
                </p>
              </div>

              {state.facesDetected !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Faces Detected</p>
                  <p className="font-medium flex items-center justify-center gap-1">
                    <UsersRound className="h-4 w-4" />
                    {state.facesDetected}
                  </p>
                </div>
              )}
              
              {state.attendance && state.attendance.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Students Present</p>
                  <div className="bg-gray-50 rounded-md p-2">
                    <ul className="space-y-1 max-h-32 overflow-auto">
                      {state.attendance.map((record, index) => (
                        <li 
                          key={index}
                          className="text-left flex items-center gap-2 p-2 text-sm border-b last:border-0"
                        >
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{record.studentId}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => navigate("/records")}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              View Records
            </Button>
            
            <Button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
