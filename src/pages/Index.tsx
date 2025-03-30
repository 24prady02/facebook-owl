
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

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
                onClick={() => navigate("/take-attendance")}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
                onClick={() => navigate("/records")} 
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
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
