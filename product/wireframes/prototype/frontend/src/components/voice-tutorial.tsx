import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Volume2, 
  Smartphone, 
  Car, 
  CheckCircle,
  X
} from "lucide-react";

interface VoiceTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function VoiceTutorial({ isOpen, onClose, onComplete }: VoiceTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Voice-Enabled Diagnostics",
      icon: <Car className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Dixon Smart Repair uses advanced voice technology to make car diagnostics hands-free and convenient.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Perfect for:</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• Describing symptoms while driving</li>
              <li>• Hands-free operation in the garage</li>
              <li>• Quick voice commands</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Voice Input",
      icon: <Mic className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Tap the microphone button to start voice input. Speak clearly and the AI will understand your car problems.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Voice Tips:</h4>
            <ul className="text-green-800 space-y-1">
              <li>• Speak naturally and clearly</li>
              <li>• Describe symptoms in detail</li>
              <li>• Use automotive terms when possible</li>
            </ul>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Mic className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              "My car makes a squeaking noise when I brake"
            </span>
          </div>
        </div>
      )
    },
    {
      title: "Voice Output",
      icon: <Volume2 className="h-8 w-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The AI will speak responses back to you, perfect for hands-free operation while working on your car.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Audio Features:</h4>
            <ul className="text-purple-800 space-y-1">
              <li>• Clear, natural voice responses</li>
              <li>• Optimized for automotive environment</li>
              <li>• Can be disabled if preferred</li>
            </ul>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Volume2 className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              "Based on your symptoms, this sounds like brake pad wear..."
            </span>
          </div>
        </div>
      )
    },
    {
      title: "Mobile Optimization",
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The voice interface is optimized for mobile devices and works great in automotive environments.
          </p>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Mobile Benefits:</h4>
            <ul className="text-orange-800 space-y-1">
              <li>• Works in mobile browsers</li>
              <li>• Touch-friendly voice controls</li>
              <li>• Hands-free operation</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Badge variant="outline" className="justify-center py-2">
              <Mic className="h-4 w-4 mr-1" />
              Voice Input
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <Volume2 className="h-4 w-4 mr-1" />
              Voice Output
            </Badge>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {currentStepData.icon}
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentStepData.content}
          
          {/* Progress Indicator */}
          <div className="flex space-x-2 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 
                  index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {isLastStep ? (
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
