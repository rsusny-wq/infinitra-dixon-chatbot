import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router'
import { Car, Wrench, MessageSquare } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()

  const handleCustomerDemo = () => {
    navigate('/customer/welcome')
  }

  const handleMechanicDemo = () => {
    // Will implement mechanic flow later
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Car className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dixon Smart Repair
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            AI-Powered Automotive Diagnostics
          </p>
          <Badge variant="secondary" className="mb-6">
            Interactive Prototype Demo
          </Badge>
        </div>

        {/* Demo Selection */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Choose Your Experience</CardTitle>
            <CardDescription>
              Select which user flow you'd like to explore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Demo */}
            <Button 
              onClick={handleCustomerDemo}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-lg font-medium">Customer Experience</span>
              </div>
              <span className="text-sm opacity-90">Get your car diagnosed</span>
            </Button>

            {/* Mechanic Demo */}
            <Button 
              onClick={handleMechanicDemo}
              variant="outline"
              className="w-full h-16 flex-col space-y-1 border-2"
            >
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span className="text-lg font-medium">Mechanic Dashboard</span>
              </div>
              <span className="text-sm text-gray-600">Review and approve diagnostics</span>
            </Button>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="border-0 shadow-lg bg-white/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              What You'll Experience
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>VIN scanning with camera simulation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Natural language symptom input</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>AI diagnosis with confidence scores</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Transparent repair quotes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Mechanic review workflow</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This prototype demonstrates the complete Dixon Smart Repair mobile experience.
            <br />
            No actual diagnostics are performed.
          </p>
        </div>
      </div>
    </div>
  )
}
