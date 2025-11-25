import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../../../styles/designSystem';

// Types
interface OptionItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  isActive?: boolean;
}

interface ChatInputOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
  communicationMode?: 'ai' | 'mechanic';
}

const ChatInputOptionsMenu: React.FC<ChatInputOptionsMenuProps> = ({
  visible,
  onClose,
  onOptionSelect,
  communicationMode = 'ai',
}) => {
  // Platform-specific attachment options with AI/Human toggle
  const attachmentOptions = useMemo(() => {
    const baseOptions: OptionItem[] = Platform.OS === 'web' 
      ? [
          { id: 'upload', label: 'Upload', icon: 'cloud-upload', color: DesignSystem.colors.primary },
        ]
      : [
          { id: 'camera', label: 'Camera', icon: 'camera', color: DesignSystem.colors.primary },
          { id: 'photos', label: 'Photos', icon: 'images', color: DesignSystem.colors.primary },
          { id: 'files', label: 'Files', icon: 'document', color: DesignSystem.colors.primary },
        ];
    
    // Add AI/Human communication options
    const communicationOptions: OptionItem[] = [
      { 
        id: 'ai_mode', 
        label: 'AI Assistant', 
        icon: 'sparkles', 
        color: communicationMode === 'ai' ? DesignSystem.colors.success : DesignSystem.colors.gray600,
        isActive: communicationMode === 'ai'
      },
      { 
        id: 'human_mode', 
        label: 'Talk to Mechanic', 
        icon: 'person', 
        color: communicationMode === 'mechanic' ? DesignSystem.colors.success : DesignSystem.colors.gray600,
        isActive: communicationMode === 'mechanic'
      },
    ];
    
    return [...baseOptions, ...communicationOptions];
  }, [communicationMode]);

  const handleOptionPress = (optionId: string) => {
    onOptionSelect(optionId);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          {attachmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuItem,
                option.isActive && styles.menuItemActive
              ]}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(option.id)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={option.color} 
              />
              <Text style={[
                styles.menuItemText,
                option.isActive && styles.menuItemTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end' as const,
    paddingBottom: 100, // Space above input area
  },
  
  menuContainer: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.lg,
    paddingVertical: DesignSystem.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 48,
  },
  
  menuItemActive: {
    backgroundColor: DesignSystem.colors.gray50,
  },
  
  menuItemText: {
    marginLeft: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray800,
    fontWeight: '500' as const,
  },
  
  menuItemTextActive: {
    color: DesignSystem.colors.success,
    fontWeight: '600' as const,
  },
};

export default React.memo(ChatInputOptionsMenu);
