import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDiagnosticStore } from "@/store/diagnostic-store";
import { useNavigate } from "react-router";
import { 
  ArrowLeft,
  Car,
  User,
  MessageSquare,
  Wrench,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  Phone,
  Mail
} from "lucide-react";

export default function MechanicReview() {
  const navigate = useNavigate();
  const { 
    currentSession, 
    mechanicQueue, 
    loadMechanicQueue,
    setUserRole,
    addChatMessage,
    updateSessionStatus
  } = useDiagnosticStore();
  
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [overrideDiagnosis, setOverrideDiagnosis] = useState(false);
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [editedQuote, setEditedQuote] = useState<any>(null);

  useEffect(() => {
    setUserRole('mechanic');
    loadMechanicQueue();
  }, []);

  useEffect(() => {
    if (mechanicQueue.length > 0 && !selectedSession) {
      setSelectedSession(mechanicQueue[0]);
      setMechanicNotes('');
      setEditedQuote(mechanicQueue[0].quotes[0] || null);
    }
  }, [mechanicQueue]);

  const handleSessionSelect = (session: any) => {
    setSelectedSession(session);
    setMechanicNotes('');
    setOverrideDiagnosis(false);
    setCustomDiagnosis('');
    setEditedQuote(session.quotes[0] || null);
    setIsEditing(false);
  };

  const handleQuoteEdit = (field: string, value: any) => {
    if (!editedQuote) return;
    
    const updated = { ...editedQuote };
    
    if (field === 'laborHours') {
      updated.laborHours = parseFloat(value) || 0;
      updated.totalCost = updated.parts.reduce((sum: number, part: any) => sum + part.cost, 0) + 
                         (updated.laborHours * updated.laborRate);
    } else if (field === 'laborRate') {
      updated.laborRate = parseFloat(value) || 0;
      updated.totalCost = updated.parts.reduce((sum: number, part: any) => sum + part.cost, 0) + 
                         (updated.laborHours * updated.laborRate);
    } else if (field.startsWith('part-')) {
      const partIndex = parseInt(field.split('-')[1]);
      const partField = field.split('-')[2];
      
      if (updated.parts[partIndex]) {
        updated.parts[partIndex][partField] = partField === 'cost' ? parseFloat(value) || 0 : value;
        updated.totalCost = updated.parts.reduce((sum: number, part: any) => sum + part.cost, 0) + 
                           (updated.laborHours * updated.laborRate);
      }
    }
    
    setEditedQuote(updated);
  };

  const handleAddPart = () => {
    if (!editedQuote) return;
    
    const newPart = {
      name: 'New Part',
      cost: 0,
      type: 'aftermarket' as const
    };
    
    setEditedQuote({
      ...editedQuote,
      parts: [...editedQuote.parts, newPart]
    });
  };

  const handleRemovePart = (index: number) => {
    if (!editedQuote) return;
    
    const updatedParts = editedQuote.parts.filter((_: any, i: number) => i !== index);
    const totalPartsCost = updatedParts.reduce((sum: number, part: any) => sum + part.cost, 0);
    
    setEditedQuote({
      ...editedQuote,
      parts: updatedParts,
      totalCost: totalPartsCost + (editedQuote.laborHours * editedQuote.laborRate)
    });
  };

  const handleApproveQuote = () => {
    if (!selectedSession) return;
    
    // Add mechanic notes to the session
    addChatMessage({
      type: 'system',
      content: `Mechanic Review Complete:\n\n${mechanicNotes}\n\n${overrideDiagnosis ? `Custom Diagnosis: ${customDiagnosis}` : 'AI Diagnosis Approved'}\n\nQuote approved and ready for customer.`,
      metadata: {
        mechanicApproved: true,
        finalQuote: editedQuote
      }
    });
    
    updateSessionStatus('approved');
    
    // Simulate notification to customer
    setTimeout(() => {
      alert('Customer has been notified that their quote is ready for review.');
    }, 1000);
  };

  const handleContactCustomer = (method: 'call' | 'message') => {
    if (!selectedSession?.vehicle) return;
    
    const customerInfo = `Customer: John Doe\nVehicle: ${selectedSession.vehicle.year} ${selectedSession.vehicle.make} ${selectedSession.vehicle.model}`;
    
    if (method === 'call') {
      alert(`Calling customer...\n\n${customerInfo}\nPhone: (555) 123-4567`);
    } else {
      alert(`Opening message interface...\n\n${customerInfo}`);
    }
  };

  if (!selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading mechanic queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/welcome')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">Mechanic Review</h1>
              <p className="text-sm text-gray-500">
                {mechanicQueue.length} sessions pending review
              </p>
            </div>
          </div>
          
          <Badge variant="default" className="bg-blue-600">
            Mechanic Mode
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Session Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mechanicQueue.map((session, index) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionSelect(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Car className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">
                          {session.vehicle?.year} {session.vehicle?.make} {session.vehicle?.model}
                        </p>
                        <p className="text-xs text-gray-600">
                          {session.symptoms.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {session.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(session.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <p className="font-medium">
                  {selectedSession.vehicle?.year} {selectedSession.vehicle?.make} {selectedSession.vehicle?.model}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Engine:</span>
                <p className="font-medium">{selectedSession.vehicle?.engine}</p>
              </div>
              <div>
                <span className="text-gray-600">VIN:</span>
                <p className="font-medium font-mono text-xs">
                  {selectedSession.vehicle?.vin || 'Not provided'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Transmission:</span>
                <p className="font-medium">{selectedSession.vehicle?.transmission}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Customer Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800">{selectedSession.symptoms}</p>
            </div>
            
            {Object.keys(selectedSession.clarificationAnswers || {}).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Clarification Answers:</h4>
                <div className="space-y-2">
                  {Object.entries(selectedSession.clarificationAnswers || {}).map(([question, answer]) => (
                    <div key={question} className="text-sm">
                      <p className="text-gray-600">{question}</p>
                      <p className="text-gray-800 ml-2">→ {answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Diagnosis Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              AI Diagnosis Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSession.diagnoses?.map((diagnosis: any, index: number) => (
              <div key={diagnosis.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{diagnosis.issue}</h4>
                  <Badge variant={diagnosis.confidence > 70 ? 'default' : 'secondary'}>
                    {diagnosis.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{diagnosis.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Category: {diagnosis.category}</span>
                  <span>Severity: {diagnosis.severity}</span>
                  <span>Est. Cost: ${diagnosis.estimatedCost}</span>
                </div>
              </div>
            ))}
            
            {/* Diagnosis Override */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="override"
                  checked={overrideDiagnosis}
                  onChange={(e) => setOverrideDiagnosis(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="override" className="text-sm font-medium">
                  Override AI Diagnosis
                </label>
              </div>
              
              {overrideDiagnosis && (
                <Textarea
                  value={customDiagnosis}
                  onChange={(e) => setCustomDiagnosis(e.target.value)}
                  placeholder="Enter your professional diagnosis and reasoning..."
                  className="min-h-[100px]"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quote Review & Modification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Quote Review
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedQuote && (
              <>
                {/* Parts */}
                <div>
                  <h4 className="font-medium mb-3">Parts</h4>
                  <div className="space-y-2">
                    {editedQuote.parts.map((part: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                        {isEditing ? (
                          <>
                            <Input
                              value={part.name}
                              onChange={(e) => handleQuoteEdit(`part-${index}-name`, e.target.value)}
                              className="flex-1"
                              placeholder="Part name"
                            />
                            <Input
                              type="number"
                              value={part.cost}
                              onChange={(e) => handleQuoteEdit(`part-${index}-cost`, e.target.value)}
                              className="w-24"
                              placeholder="Cost"
                            />
                            <select
                              value={part.type}
                              onChange={(e) => handleQuoteEdit(`part-${index}-type`, e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="oem">OEM</option>
                              <option value="aftermarket">Aftermarket</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemovePart(index)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{part.name}</p>
                              <p className="text-xs text-gray-600 capitalize">{part.type}</p>
                            </div>
                            <p className="font-medium">${part.cost}</p>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddPart}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Part
                      </Button>
                    )}
                  </div>
                </div>

                {/* Labor */}
                <div>
                  <h4 className="font-medium mb-3">Labor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Hours</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.5"
                          value={editedQuote.laborHours}
                          onChange={(e) => handleQuoteEdit('laborHours', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">{editedQuote.laborHours} hours</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Rate ($/hour)</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedQuote.laborRate}
                          onChange={(e) => handleQuoteEdit('laborRate', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">${editedQuote.laborRate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Cost:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${editedQuote.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Mechanic Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mechanic Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mechanicNotes}
              onChange={(e) => setMechanicNotes(e.target.value)}
              placeholder="Add your professional notes, recommendations, or additional observations..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleContactCustomer('call')}
              className="flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => handleContactCustomer('message')}
              className="flex items-center justify-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Message Customer
            </Button>
          </div>
          
          <Button
            onClick={handleApproveQuote}
            disabled={!mechanicNotes.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Quote & Notify Customer
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Customer will be notified when you approve the quote
          </p>
        </div>
      </div>
    </div>
  );
}
