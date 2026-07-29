import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, Pressable, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { StaffRole } from '@/types/api';

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: 'Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen Staff',
  maintenance: 'Maintenance',
};

interface StaffCreatedEmailModalProps {
  visible: boolean;
  onClose: () => void;
  staff: {
    first_name: string;
    last_name: string;
    email: string;
    role: StaffRole;
    department: string;
    position: string;
    temporaryPassword: string;
  };
}

export function StaffCreatedEmailModal({ visible, onClose, staff }: StaffCreatedEmailModalProps) {
  const [copied, setCopied] = useState(false);

  const credentials = [
    { label: 'Username', value: staff.email.split('@')[0] },
    { label: 'Email', value: staff.email, isLink: true },
    { label: 'Temporary Password', value: staff.temporaryPassword, isPassword: true },
    { label: 'Department', value: staff.department || 'General' },
    { label: 'Position', value: staff.position || ROLE_LABELS[staff.role] },
  ];

  const handleCopyAll = async () => {
    const text = [
      `StayEasy — Account Created`,
      ``,
      `Welcome, ${staff.first_name}`,
      ``,
      `Your StayEasy staff account has been created.`,
      `Here are your login credentials.`,
      ``,
      `Username: ${staff.email.split('@')[0]}`,
      `Email: ${staff.email}`,
      `Temporary Password: ${staff.temporaryPassword}`,
      `Department: ${staff.department || 'General'}`,
      `Position: ${staff.position || ROLE_LABELS[staff.role]}`,
    ].join('\n');

    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 16,
            width: '100%',
            maxWidth: 420,
            maxHeight: '85%',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Email Preview Container */}
          <View style={{ margin: 12, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{
                backgroundColor: '#1E293B',
                paddingVertical: 28,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  StayEasy
                </Text>
              </View>

              {/* Success Banner */}
              <View style={{
                backgroundColor: '#10B981',
                paddingVertical: 14,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.5 }}>
                  ✓ ACCOUNT CREATED
                </Text>
              </View>

              {/* Content */}
              <View style={{ padding: 28 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                  Welcome, {staff.first_name}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: '#64748B', marginBottom: 24 }}>
                  Your StayEasy staff account has been created. Here are your login credentials.
                </Text>

                {/* Credentials Table */}
                <View style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 24,
                }}>
                  {credentials.map((cred, index) => (
                    <View
                      key={cred.label}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: index % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                        borderBottomWidth: index < credentials.length - 1 ? 1 : 0,
                        borderBottomColor: '#E2E8F0',
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        color: '#64748B',
                        width: 130,
                        fontWeight: '500',
                      }}>
                        {cred.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: cred.isLink ? '#2563EB' : '#1E293B',
                          flex: 1,
                          fontFamily: cred.isPassword ? 'monospace' : undefined,
                        }}
                      >
                        {cred.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Note */}
                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                }}>
                  <Text style={{ fontSize: 12, lineHeight: 18, color: '#92400E' }}>
                    Please share these credentials securely with the staff member. They should change their password on first login.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCopyAll}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: copied ? '#10B981' : '#0D9488',
                alignItems: 'center',
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                {copied ? '✓ Copied' : 'Copy Credentials'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
