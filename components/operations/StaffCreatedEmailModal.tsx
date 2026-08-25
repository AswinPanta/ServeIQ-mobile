import React from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, Pressable, ScrollView } from 'react-native';
import type { StaffRole } from '@/types/api';
import { SLATE, TEXT, BG, STATUS, BLUE, AMBER, TEAL } from '@/lib/constants/figma-tokens';

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
  };
}

export function StaffCreatedEmailModal({ visible, onClose, staff }: StaffCreatedEmailModalProps) {
  const details = [
    { label: 'Email', value: staff.email, isLink: true },
    { label: 'Role', value: ROLE_LABELS[staff.role] },
    { label: 'Department', value: staff.department || 'General' },
    { label: 'Position', value: staff.position || ROLE_LABELS[staff.role] },
  ];

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: SLATE[50],
            borderRadius: 16,
            width: '100%',
            maxWidth: 420,
            maxHeight: '85%',
            overflow: 'hidden',
            shadowColor: TEXT.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Email Preview Container */}
          <View style={{ margin: 12, backgroundColor: BG.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: SLATE[200] }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{
                backgroundColor: SLATE[800],
                paddingVertical: 28,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: BG.white, letterSpacing: 0.5 }}>
                  ServeIQ
                </Text>
              </View>

              {/* Success Banner */}
              <View style={{
                backgroundColor: STATUS.activeGreen,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: BG.white, letterSpacing: 1.5 }}>
                  ✓ INVITATION SENT
                </Text>
              </View>

              {/* Content */}
              <View style={{ padding: 28 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: SLATE[800], marginBottom: 8 }}>
                  Welcome, {staff.first_name}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 22, color: SLATE[500], marginBottom: 24 }}>
                  {staff.first_name} {staff.last_name} has been added to your team. Login credentials have been emailed to them.
                </Text>

                {/* Details Table */}
                <View style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: SLATE[200],
                  overflow: 'hidden',
                  marginBottom: 24,
                }}>
                  {details.map((detail, index) => (
                    <View
                      key={detail.label}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: index % 2 === 0 ? SLATE[50] : BG.white,
                        borderBottomWidth: index < details.length - 1 ? 1 : 0,
                        borderBottomColor: SLATE[200],
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        color: SLATE[500],
                        width: 110,
                        fontWeight: '500',
                      }}>
                        {detail.label}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: detail.isLink ? BLUE[600] : SLATE[800],
                        flex: 1,
                      }}>
                        {detail.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Note */}
                <View style={{
                  backgroundColor: AMBER[100],
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: AMBER[500],
                }}>
                  <Text style={{ fontSize: 12, lineHeight: 18, color: AMBER[800] }}>
                    The invitee will sign in with the credentials from that email through the ServeIQ staff login. Ask them to check their inbox (and spam folder) for the welcome email.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: TEAL[600],
                alignItems: 'center',
                shadowColor: TEAL[600],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
