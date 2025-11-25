import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Car, Wrench, Phone } from "lucide-react";

interface VoiceCommandsProps {
  sessionStatus: string;
}

export function VoiceCommands({ sessionStatus }: VoiceCommandsProps) {
  const getCommandsForStatus = () => {
    switch (sessionStatus) {
      case 'vehicle-id':
        return [
          { icon: <Car className="h-4 w-4" />, text: "2018 Honda Civic", category: "Vehicle Info" },
          { icon: <Car className="h-4 w-4" />, text: "My VIN is...", category: "Vehicle Info" },
          { icon: <Car className="h-4 w-4" />, text: "I want to scan my VIN", category: "Action" }
        ];
      
      case 'symptoms':
        return [
          { icon: <Wrench className="h-4 w-4" />, text: "My brakes are squeaking", category: "Symptoms" },
          { icon: <Wrench className="h-4 w-4" />, text: "Engine makes rattling noise", category: "Symptoms" },
          { icon: <Wrench className="h-4 w-4" />, text: "Car won't start", category: "Symptoms" }
        ];
      
      case 'clarification':
        return [
          { icon: <Mic className="h-4 w-4" />, text: "Yes, every time I brake", category: "Response" },
          { icon: <Mic className="h-4 w-4" />, text: "About a week ago", category: "Response" },
          { icon: <Mic className="h-4 w-4" />, text: "Only when it's cold", category: "Response" }
        ];
      
      case 'quote':
        return [
          { icon: <Phone className="h-4 w-4" />, text: "Find mechanics near me", category: "Action" },
          { icon: <Phone className="h-4 w-4" />, text: "Schedule appointment", category: "Action" },
          { icon: <Phone className="h-4 w-4" />, text: "Get the basic option", category: "Decision" }
        ];
      
      default:
        return [
          { icon: <Mic className="h-4 w-4" />, text: "Yes", category: "Response" },
          { icon: <Mic className="h-4 w-4" />, text: "No", category: "Response" },
          { icon: <Mic className="h-4 w-4" />, text: "Tell me more", category: "Request" }
        ];
    }
  };

  const commands = getCommandsForStatus();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Mic className="h-4 w-4 text-blue-600" />
          <span>Try saying:</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {commands.map((command, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="text-gray-500">
              {command.icon}
            </div>
            <span className="text-sm text-gray-700 flex-1">"{command.text}"</span>
            <Badge variant="outline" className="text-xs">
              {command.category}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
