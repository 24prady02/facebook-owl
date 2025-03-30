
import { useState } from "react";
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
import { Camera, Upload } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";

const TakeAttendance = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = () => {
    // This would be implemented with a native camera API through Capacitor
    console.log("Opening camera");
    toast.info("Camera functionality will be available in the mobile app");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photo) {
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
    
    try {
      // This is where we would send the data to Firebase
      // In a real implementation, this would call the cloud functions
      // that would run the Python code you've shared
      
      setTimeout(() => {
        setIsLoading(false);
        toast.success("Attendance recorded successfully!");
        navigate("/success", { 
          state: { 
            className, 
            timeSlot, 
            timestamp: new Date().toISOString() 
          } 
        });
      }, 2000);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to record attendance");
      setIsLoading(false);
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
                  <Button
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 flex-col border-dashed border-2"
                    onClick={handleCapture}
                  >
                    <Camera className="h-6 w-6 mb-2" />
                    <span>Take Photo</span>
                  </Button>
                  
                  <div className="relative h-24">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-full w-full flex-col border-dashed border-2"
                    >
                      <Upload className="h-6 w-6 mb-2" />
                      <span>Upload</span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !photo || !className || !timeSlot}
          >
            {isLoading ? "Processing..." : "Submit Attendance"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TakeAttendance;
