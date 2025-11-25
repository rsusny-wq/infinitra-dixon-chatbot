import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface Invoice {
  id: string
  invoiceNumber: string
  serviceRecordId: string
  diagnosticSessionId?: string
  conversationId?: string
  vehicleName: string
  date: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  mechanic: {
    name: string
    shop: string
    address: string
    phone: string
    email: string
  }
  diagnosticInfo?: {
    originalIssue: string
    aiConfidence: number
    guidanceLevel: 'generic' | 'basic' | 'vin'
    mechanicReview: 'approved' | 'modified' | 'rejected'
    finalDiagnosis: string
  }
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
    category: 'labor' | 'parts' | 'diagnostic' | 'other'
  }[]
  subtotal: number
  tax: number
  total: number
  paymentMethod?: string
  paymentDate?: Date
  notes?: string
}

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>([
    {
      id: 'inv-001',
      invoiceNumber: 'DSR-2024-001',
      serviceRecordId: 'service_001',
      diagnosticSessionId: 'session_001',
      conversationId: 'conv_456',
      vehicleName: '2018 Toyota Camry',
      date: new Date('2024-12-15'),
      dueDate: new Date('2025-01-15'),
      status: 'paid',
      mechanic: {
        name: 'Mike Johnson',
        shop: 'AutoCare Plus',
        address: '123 Main St, Anytown, ST 12345',
        phone: '(555) 123-4567',
        email: 'mike@autocareplus.com'
      },
      diagnosticInfo: {
        originalIssue: 'Brakes making squealing noise when stopping',
        aiConfidence: 87,
        guidanceLevel: 'vin',
        mechanicReview: 'approved',
        finalDiagnosis: 'Worn brake pads and brake fluid leak - confirmed by inspection'
      },
      items: [
        {
          description: 'AI Diagnostic Analysis',
          quantity: 1,
          unitPrice: 25.00,
          total: 25.00,
          category: 'diagnostic'
        },
        {
          description: 'Brake Pad Replacement (Front)',
          quantity: 1,
          unitPrice: 180.00,
          total: 180.00,
          category: 'labor'
        },
        {
          description: 'Premium Brake Pads Set',
          quantity: 1,
          unitPrice: 85.00,
          total: 85.00,
          category: 'parts'
        }
      ],
      subtotal: 290.00,
      tax: 23.20,
      total: 313.20,
      paymentMethod: 'Credit Card',
      paymentDate: new Date('2024-12-15'),
      notes: 'Service completed successfully. Customer satisfied with AI diagnostic accuracy.'
    }
  ])

  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'sent' | 'overdue' | 'cancelled'>('all')

  const filteredInvoices = invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#16a34a'
      case 'sent': return '#3b82f6'
      case 'overdue': return '#dc2626'
      case 'cancelled': return '#6b7280'
      default: return '#f59e0b'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle'
      case 'sent': return 'mail'
      case 'overdue': return 'warning'
      case 'cancelled': return 'close-circle'
      default: return 'time'
    }
  }

  const getGuidanceIcon = (level: string) => {
    switch (level) {
      case 'generic': return 'flash'
      case 'basic': return 'car'
      case 'vin': return 'scan'
      default: return 'help-circle'
    }
  }

  const getGuidanceColor = (level: string) => {
    switch (level) {
      case 'generic': return '#16a34a'
      case 'basic': return '#ea580c'
      case 'vin': return '#7c3aed'
      default: return '#6b7280'
    }
  }

  const getReviewColor = (review: string) => {
    switch (review) {
      case 'approved': return '#16a34a'
      case 'modified': return '#f59e0b'
      case 'rejected': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    Alert.alert('Invoice Details', `Viewing invoice ${invoice.invoiceNumber}`)
  }

  const totalPaid = filteredInvoices
    .filter(inv => inv.paymentDate)
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalOwed = filteredInvoices
    .filter(inv => !inv.paymentDate)
    .reduce((sum, inv) => sum + inv.total, 0)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>Enhanced Invoices</Text>
          <Text style={styles.subtitleText}>With AI Diagnostic Integration</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => Alert.alert('Search', 'Invoice search functionality')}
        >
          <Ionicons name="search" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
            ${totalPaid.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount Owed</Text>
          <Text style={[styles.summaryValue, { color: totalOwed > 0 ? '#dc2626' : '#16a34a' }]}>
            ${totalOwed.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Invoice List */}
      <ScrollView style={styles.invoicesList}>
        {filteredInvoices.map((invoice) => (
          <TouchableOpacity 
            key={invoice.id} 
            style={styles.invoiceCard}
            onPress={() => handleViewInvoice(invoice)}
          >
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceInfo}>
                <View style={styles.invoiceTitleRow}>
                  <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(invoice.status) as any} 
                      size={12} 
                      color="#ffffff" 
                    />
                    <Text style={styles.statusText}>
                      {invoice.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.vehicleName}>{invoice.vehicleName}</Text>
                <Text style={styles.shopName}>{invoice.mechanic.shop}</Text>
              </View>
              
              <View style={styles.invoiceAmount}>
                <Text style={styles.totalAmount}>${invoice.total.toFixed(2)}</Text>
                <Text style={styles.dateText}>
                  {invoice.date.toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Diagnostic Integration Info */}
            {invoice.diagnosticInfo && (
              <View style={styles.diagnosticSection}>
                <View style={styles.diagnosticHeader}>
                  <Ionicons name="medical" size={14} color="#3b82f6" />
                  <Text style={styles.diagnosticTitle}>AI Diagnostic Integration</Text>
                </View>
                
                <View style={styles.diagnosticDetails}>
                  <View style={styles.diagnosticRow}>
                    <Text style={styles.diagnosticLabel}>Original Issue:</Text>
                    <Text style={styles.diagnosticValue} numberOfLines={2}>
                      {invoice.diagnosticInfo.originalIssue}
                    </Text>
                  </View>
                  
                  <View style={styles.diagnosticRow}>
                    <Text style={styles.diagnosticLabel}>AI Confidence:</Text>
                    <View style={styles.confidenceContainer}>
                      <View style={styles.confidenceBar}>
                        <View 
                          style={[
                            styles.confidenceFill, 
                            { width: `${invoice.diagnosticInfo.aiConfidence}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.confidenceText}>
                        {invoice.diagnosticInfo.aiConfidence}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.diagnosticRow}>
                    <Text style={styles.diagnosticLabel}>Guidance Level:</Text>
                    <View style={styles.guidanceBadge}>
                      <Ionicons 
                        name={getGuidanceIcon(invoice.diagnosticInfo.guidanceLevel) as any} 
                        size={12} 
                        color={getGuidanceColor(invoice.diagnosticInfo.guidanceLevel)} 
                      />
                      <Text style={[
                        styles.guidanceText,
                        { color: getGuidanceColor(invoice.diagnosticInfo.guidanceLevel) }
                      ]}>
                        {invoice.diagnosticInfo.guidanceLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.diagnosticRow}>
                    <Text style={styles.diagnosticLabel}>Mechanic Review:</Text>
                    <View style={[
                      styles.reviewBadge,
                      { backgroundColor: getReviewColor(invoice.diagnosticInfo.mechanicReview) }
                    ]}>
                      <Text style={styles.reviewText}>
                        {invoice.diagnosticInfo.mechanicReview.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748b',
  },
  searchButton: {
    padding: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  invoicesList: {
    flex: 1,
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  vehicleName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  shopName: {
    fontSize: 12,
    color: '#64748b',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  diagnosticSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  diagnosticDetails: {
    gap: 6,
  },
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  diagnosticValue: {
    fontSize: 12,
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
    gap: 6,
  },
  confidenceBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  guidanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  guidanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reviewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reviewText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
})
