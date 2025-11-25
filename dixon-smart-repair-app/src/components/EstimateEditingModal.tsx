import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PartItem {
  description: string;
  cost: number;
  warranty: string;
  url?: string;
}

interface EstimateBreakdown {
  total: number;
  parts: {
    total: number;
    items: PartItem[];
  };
  labor: {
    total: number;
    totalHours: number;
    hourlyRate: number;
  };
  shopFees: {
    total: number;
  };
  tax: number;
}

interface SharedEstimate {
  estimateId: string;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    trim?: string;
  };
  selectedOption: string;
  breakdown: EstimateBreakdown;
  status: string;
  confidence: number;
  createdAt: string;
}

interface MechanicRequest {
  id: string;
  customerId: string;
  customerName: string;
  sharedEstimate: SharedEstimate;
  customerComment: string;
}

interface EstimateEditingModalProps {
  visible: boolean;
  request: MechanicRequest;
  mechanicId: string;
  onClose: () => void;
  onSave: (modifiedEstimate: SharedEstimate, mechanicNotes: string) => void;
}

export default function EstimateEditingModal({
  visible,
  request,
  mechanicId,
  onClose,
  onSave,
}: EstimateEditingModalProps) {
  // State for editing
  const [parts, setParts] = useState<PartItem[]>([]);
  const [laborHours, setLaborHours] = useState('');
  const [laborRate, setLaborRate] = useState('');
  const [shopFees, setShopFees] = useState('');
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [confidence, setConfidence] = useState('');
  
  // Calculated totals
  const [calculatedBreakdown, setCalculatedBreakdown] = useState<EstimateBreakdown | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && request.sharedEstimate) {
      const estimate = request.sharedEstimate;
      setParts([...estimate.breakdown.parts.items]);
      setLaborHours(estimate.breakdown.labor.totalHours.toString());
      setLaborRate(estimate.breakdown.labor.hourlyRate.toString());
      setShopFees(estimate.breakdown.shopFees.total.toString());
      setConfidence(estimate.confidence.toString());
      setMechanicNotes('');
    }
  }, [visible, request]);

  // Calculate totals whenever inputs change
  useEffect(() => {
    calculateTotals();
  }, [parts, laborHours, laborRate, shopFees]);

  const calculateTotals = () => {
    try {
      // Calculate parts total
      const partsTotal = parts.reduce((sum, part) => sum + (part.cost || 0), 0);
      
      // Calculate labor total
      const hours = parseFloat(laborHours) || 0;
      const rate = parseFloat(laborRate) || 95;
      const laborTotal = hours * rate;
      
      // Shop fees
      const fees = parseFloat(shopFees) || 25;
      
      // Calculate tax (8% of subtotal + shop fees)
      const subtotal = partsTotal + laborTotal;
      const tax = (subtotal + fees) * 0.08;
      
      // Calculate total
      const total = subtotal + fees + tax;

      setCalculatedBreakdown({
        total,
        parts: {
          total: partsTotal,
          items: parts,
        },
        labor: {
          total: laborTotal,
          totalHours: hours,
          hourlyRate: rate,
        },
        shopFees: {
          total: fees,
        },
        tax,
      });
    } catch (error) {
      console.error('Error calculating totals:', error);
    }
  };

  const addPart = () => {
    setParts([
      ...parts,
      {
        description: '',
        cost: 0,
        warranty: '1 year',
        url: '',
      },
    ]);
  };

  const updatePart = (index: number, field: keyof PartItem, value: string | number) => {
    const updatedParts = [...parts];
    if (field === 'cost') {
      updatedParts[index][field] = parseFloat(value.toString()) || 0;
    } else {
      updatedParts[index][field] = value as string;
    }
    setParts(updatedParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!calculatedBreakdown) {
      Alert.alert('Error', 'Unable to calculate estimate totals');
      return;
    }

    if (!mechanicNotes.trim()) {
      Alert.alert('Required', 'Please add notes explaining your changes');
      return;
    }

    // Create modified estimate
    const modifiedEstimate: SharedEstimate = {
      ...request.sharedEstimate,
      breakdown: calculatedBreakdown,
      confidence: parseFloat(confidence) || request.sharedEstimate.confidence,
      status: 'mechanic_modified',
    };

    onSave(modifiedEstimate, mechanicNotes);
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]
    );
  };

  if (!visible || !request.sharedEstimate) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Cost Estimate</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <Text style={styles.vehicleInfo}>
              {request.sharedEstimate.vehicleInfo.year} {request.sharedEstimate.vehicleInfo.make} {request.sharedEstimate.vehicleInfo.model}
              {request.sharedEstimate.vehicleInfo.trim && ` ${request.sharedEstimate.vehicleInfo.trim}`}
            </Text>
          </View>

          {/* Customer Comment */}
          {request.customerComment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Comment</Text>
              <Text style={styles.customerComment}>{request.customerComment}</Text>
            </View>
          )}

          {/* Parts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Parts</Text>
              <TouchableOpacity onPress={addPart} style={styles.addButton}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
                <Text style={styles.addButtonText}>Add Part</Text>
              </TouchableOpacity>
            </View>

            {parts.map((part, index) => (
              <View key={index} style={styles.partItem}>
                <View style={styles.partHeader}>
                  <Text style={styles.partIndex}>Part {index + 1}</Text>
                  <TouchableOpacity onPress={() => removePart(index)}>
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Part description"
                  value={part.description}
                  onChangeText={(text) => updatePart(index, 'description', text)}
                  multiline
                />

                <View style={styles.partRow}>
                  <View style={styles.partField}>
                    <Text style={styles.fieldLabel}>Cost ($)</Text>
                    <TextInput
                      style={styles.numberInput}
                      placeholder="0.00"
                      value={part.cost.toString()}
                      onChangeText={(text) => updatePart(index, 'cost', text)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.partField}>
                    <Text style={styles.fieldLabel}>Warranty</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1 year"
                      value={part.warranty}
                      onChangeText={(text) => updatePart(index, 'warranty', text)}
                    />
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Source URL (optional)"
                  value={part.url || ''}
                  onChangeText={(text) => updatePart(index, 'url', text)}
                />
              </View>
            ))}
          </View>

          {/* Labor Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Labor</Text>
            
            <View style={styles.laborRow}>
              <View style={styles.laborField}>
                <Text style={styles.fieldLabel}>Hours</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="0.0"
                  value={laborHours}
                  onChangeText={setLaborHours}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.laborField}>
                <Text style={styles.fieldLabel}>Rate ($/hour)</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="95"
                  value={laborRate}
                  onChangeText={setLaborRate}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Shop Fees Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Fees</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="25.00"
              value={shopFees}
              onChangeText={setShopFees}
              keyboardType="numeric"
            />
          </View>

          {/* Confidence Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidence Level (%)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="85"
              value={confidence}
              onChangeText={setConfidence}
              keyboardType="numeric"
            />
          </View>

          {/* Cost Summary */}
          {calculatedBreakdown && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Updated Cost Summary</Text>
              <View style={styles.costSummary}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Parts:</Text>
                  <Text style={styles.costValue}>${calculatedBreakdown.parts.total.toFixed(2)}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Labor:</Text>
                  <Text style={styles.costValue}>${calculatedBreakdown.labor.total.toFixed(2)}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Shop Fees:</Text>
                  <Text style={styles.costValue}>${calculatedBreakdown.shopFees.total.toFixed(2)}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Tax (8%):</Text>
                  <Text style={styles.costValue}>${calculatedBreakdown.tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${calculatedBreakdown.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Mechanic Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mechanic Notes *</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Explain your changes and reasoning..."
              value={mechanicNotes}
              onChangeText={setMechanicNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  customerComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  partItem: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  partHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  partIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  partRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  partField: {
    flex: 1,
  },
  laborRow: {
    flexDirection: 'row',
    gap: 12,
  },
  laborField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  costSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
