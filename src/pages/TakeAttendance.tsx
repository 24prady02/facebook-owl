
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { db } from "@/lib/firebase";

const FLASK_API_URL = process.env.REACT_APP_FLASK_API_URL || "http://localhost:5000";

const TakeAttendance = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [className, setClassName] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [lastAttendanceCollection, setLastAttendanceCollection] = useState<string | null>(null);
  
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
    toast.info("Camera functionality will be available in the mobile app");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photo || !photoFile) {
      toast.error("Please take or upload a photo");
      return;
    }
    
    if (!className) {
      toast.error("Please select a class");
      return;
    }
    
    if (!timeSlot) {
      toast.error("Please select a time slot");
      return;
    }
    
    setIsLoading(true);
    setProcessingStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("image", photoFile);
      formData.append("className", className);
      formData.append("timeSlot", timeSlot);
      
      toast.info("Uploading photo to server...");
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
        toast.success(`Attendance processed! ${attendanceCount} students marked present.`);
      } else if (facesDetected > 0) {
        toast.warning(`${facesDetected} faces detected, but no matching students found.`);
      } else {
        toast.info("No faces detected in the image.");
      }
      
      navigate("/success", { 
        state: { 
          className, 
          timeSlot, 
          timestamp: new Date().toISOString(),
          attendance: data.attendance || [],
          facesDetected,
          collectionName: data.collectionName
        } 
      });
      
    } catch (error) {
      console.error("Error processing attendance:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process attendance");
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };
  
  const handleExportAttendance = () => {
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
  
  const renderStatusMessage = () => {
    if (!processingStatus) return null;
    
    switch (processingStatus) {
      case "uploading":
        return "Uploading photo...";
      case "processing":
        return "Processing faces...";
      default:
        return "Processing...";
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container px-4 pt-6 pb-16 mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Take Attendance</h2>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select
              value={className}
              onValueChange={setClassName}
              disabled={isLoading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Math 101">Math 101</SelectItem>
                <SelectItem value="Physics 202">Physics 202</SelectItem>
                <SelectItem value="Chemistry 303">Chemistry 303</SelectItem>
                <SelectItem value="Biology 404">Biology 404</SelectItem>
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
              disabled={isLoading || !photo || !className || !timeSlot}
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

export default TakeAttendance;
