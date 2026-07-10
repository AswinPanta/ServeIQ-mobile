import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import type { StaffRole, Shift, StaffTask } from '@/types/api';

const ACCENT = '#2563EB';

const ROLE_COLORS: Record<StaffRole, string> = {
  manager: '#8B5CF6',
  front_desk: '#3B82F6',
  housekeeping: '#10B981',
  waiter: '#F59E0B',
  kitchen: '#F97316',
  maintenance: '#EF4444',
};

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: 'Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  maintenance: 'Maintenance',
};

const SHIFT_STATUS_COLORS: Record<string, string> = {
  scheduled: '#3B82F6',
  clocked_in: '#10B981',
  clocked_out: '#6B7280',
  absent: '#EF4444',
};

const TASK_PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981',
};

type TabKey = 'staff' | 'shifts' | 'tasks';

export function HostStaff() {
  const colors = useColors();
  const {
    staff, shifts, staffTasks, properties, activePropertyId,
    updateStaff, updateShift, updateStaffTask, addStaff, addShift,
  } = useHost();

  const [activeTab, setActiveTab] = useState<TabKey>('staff');
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('front_desk');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [myStaffId, setMyStaffId] = useState<string | null>(null); // Simulated current user

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredStaff = staff.filter(s => s.property_id === activePropertyId);
  const filteredShifts = shifts.filter(s => s.property_id === activePropertyId);
  const filteredTasks = staffTasks.filter(t => t.property_id === activePropertyId);

  // Simulate current user being first staff member for clock-in/out demo
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const myStaff = filteredStaff[0] || null;
  const todayStr = formatDateKey(new Date());
  const myTodayShift = filteredShifts.find(s => s.staff_id === myStaff?.id && s.date === todayStr);

  const getWeekDays = (offset: number): Date[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const formatDateReadable = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  const weekDays = getWeekDays(calendarWeekOffset);

  const coverageData = weekDays.map(d => {
    const key = formatDateKey(d);
    const dayShifts = filteredShifts.filter(s => s.date === key);
    return { date: d, key, shifts: dayShifts, count: dayShifts.length };
  });

  const understaffedDays = coverageData.filter(d => d.count < 2);

  const selectedShifts = selectedDay ? filteredShifts.filter(s => s.date === selectedDay) : [];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'staff', label: 'Staff List' },
    { key: 'shifts', label: 'Shifts' },
    { key: 'tasks', label: 'Tasks' },
  ];

  const handleToggleActive = (id: string, current: boolean) => {
    updateStaff(id, { is_active: !current });
  };

  const handleInviteStaff = () => {
    if (!inviteEmail.trim() || !inviteFirstName.trim()) {
      Alert.alert('Validation Error', 'Email and first name are required.');
      return;
    }
    const now = new Date().toISOString();
    addStaff({
      id: `st-${Date.now()}`,
      tenant_id: 'demo-host-1',
      email: inviteEmail.trim(),
      first_name: inviteFirstName.trim(),
      last_name: inviteLastName.trim(),
      phone: invitePhone.trim() || '+977-',
      role: inviteRole,
      property_id: activePropertyId || properties[0]?.id || '',
      is_active: true,
      pos_discount_limit: inviteRole === 'manager' ? 20 : inviteRole === 'front_desk' ? 10 : 0,
      created_at: now,
      updated_at: now,
    });
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInvitePhone('');
    setInviteRole('front_desk');
    setShowInviteForm(false);
    Alert.alert('Invitation Sent', `Invitation email sent to ${inviteEmail.trim()}`);
  };

  const handleShiftStatusChange = (shift: Shift) => {
    const statuses: Shift['status'][] = ['scheduled', 'clocked_in', 'clocked_out', 'absent'];
    const currentIndex = statuses.indexOf(shift.status);
    const nextStatuses = statuses.filter((_, i) => i !== currentIndex);

    Alert.alert(
      'Change Shift Status',
      `${shift.staff_name} — ${shift.date}`,
      nextStatuses.map(status => ({
        text: status.replace('_', ' '),
        onPress: () => updateShift(shift.id, { status }),
      })).concat([{ text: 'Cancel', onPress: () => {} }]),
    );
  };

  const handleAdvanceTask = (task: StaffTask) => {
    const nextStatus: Record<string, StaffTask['status']> = {
      pending: 'in_progress',
      in_progress: 'completed',
    };
    const next = nextStatus[task.status];
    if (next) {
      updateStaffTask(task.id, {
        status: next,
        completed_at: next === 'completed' ? new Date().toISOString() : null,
      });
    }
  };

  const renderTabSelector = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: colors.border, borderRadius: 12, padding: 4 }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: isActive ? colors.surface : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: isActive ? ACCENT : colors.muted,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStaffList = () => (
    <View>
      {/* Invite Staff Form */}
      {showInviteForm && (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 12 }}>Invite Staff Member</Text>
          <View style={{ gap: 10 }}>
            <View className="flex-row gap-2">
              <View style={{ flex: 1, gap: 4 }}>
                <Text className="text-xs text-muted">First Name *</Text>
                <TextInput value={inviteFirstName} onChangeText={setInviteFirstName} placeholder="John" placeholderTextColor={colors.muted}
                  style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.foreground }} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text className="text-xs text-muted">Last Name</Text>
                <TextInput value={inviteLastName} onChangeText={setInviteLastName} placeholder="Doe" placeholderTextColor={colors.muted}
                  style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.foreground }} />
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text className="text-xs text-muted">Email *</Text>
              <TextInput value={inviteEmail} onChangeText={setInviteEmail} placeholder="staff@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none"
                style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.foreground }} />
            </View>
            <View style={{ gap: 4 }}>
              <Text className="text-xs text-muted">Phone</Text>
              <TextInput value={invitePhone} onChangeText={setInvitePhone} placeholder="+977-9841234567" placeholderTextColor={colors.muted} keyboardType="phone-pad"
                style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.foreground }} />
            </View>
            <View style={{ gap: 4 }}>
              <Text className="text-xs text-muted mb-1">Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map(role => (
                  <TouchableOpacity key={role} onPress={() => setInviteRole(role)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8,
                      backgroundColor: inviteRole === role ? ROLE_COLORS[role] : colors.border,
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: inviteRole === role ? '#fff' : colors.foreground }}>
                      {ROLE_LABELS[role]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity onPress={() => setShowInviteForm(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleInviteStaff}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Invite Button */}
      {!showInviteForm && (
        <TouchableOpacity onPress={() => setShowInviteForm(true)}
          style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: ACCENT + '10', borderWidth: 1, borderColor: ACCENT + '30', marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>+ Invite Staff Member</Text>
        </TouchableOpacity>
      )}

      {filteredStaff.length === 0 && !showInviteForm ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No staff members</Text>
        </View>
      ) : (
        filteredStaff.map(s => {
          const isExpanded = expandedStaff === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setExpandedStaff(isExpanded ? null : s.id)}
              activeOpacity={0.7}
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 12,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">
                      {s.first_name} {s.last_name}
                    </Text>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: s.is_active ? '#10B981' : '#EF4444',
                    }} />
                  </View>
                  <View style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    marginTop: 8,
                    backgroundColor: `${ROLE_COLORS[s.role]}20`,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: ROLE_COLORS[s.role] }}>
                      {ROLE_LABELS[s.role]}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: s.is_active ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View className="mt-3 gap-1">
                <Text className="text-sm text-muted">{s.email}</Text>
                <Text className="text-sm text-muted">{s.phone}</Text>
              </View>

              {isExpanded && (
                <View style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm text-muted">POS Discount Limit</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      रू{s.pos_discount_limit.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleActive(s.id, s.is_active)}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: s.is_active ? '#EF4444' : '#10B981',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderMyShiftToday = () => {
    if (!myStaff) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMins = currentHour * 60 + currentMin;

    const isClockedIn = myTodayShift?.status === 'clocked_in';
    const isClockedOut = myTodayShift?.status === 'clocked_out';
    const isScheduled = myTodayShift?.status === 'scheduled' || !myTodayShift;

    const startParts = myTodayShift?.start_time?.split(':').map(Number) || [9, 0];
    const endParts = myTodayShift?.end_time?.split(':').map(Number) || [17, 0];
    const startMins = startParts[0] * 60 + (startParts[1] || 0);
    const endMins = endParts[0] * 60 + (endParts[1] || 0);

    // Calculate elapsed / remaining
    let elapsedStr = '';
    let remainingStr = '';
    if (isClockedIn) {
      const elapsed = currentTimeMins - startMins;
      if (elapsed > 0) {
        const h = Math.floor(elapsed / 60);
        const m = elapsed % 60;
        elapsedStr = `${h}h ${m}m worked`;
      }
      const remaining = endMins - currentTimeMins;
      if (remaining > 0) {
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        remainingStr = `${h}h ${m}m remaining`;
      }
    }

    return (
      <View style={{
        padding: 20, borderRadius: 20, marginBottom: 16,
        backgroundColor: '#1E293B',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
      }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isClockedIn ? '#10B981' : '#6B7280', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: '700' }}>
                {myStaff.first_name.charAt(0)}{myStaff.last_name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                {myStaff.first_name} {myStaff.last_name}
              </Text>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>
                {myTodayShift ? `${myTodayShift.start_time} → ${myTodayShift.end_time}` : 'No shift today'}
              </Text>
            </View>
          </View>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
            backgroundColor: isClockedIn ? '#10B98125' : isClockedOut ? '#6B728025' : '#3B82F625',
          }}>
            <Text style={{
              fontSize: 12, fontWeight: '700',
              color: isClockedIn ? '#10B981' : isClockedOut ? '#6B7280' : '#3B82F6',
            }}>
              {isClockedIn ? 'CLOCKED IN' : isClockedOut ? 'CLOCKED OUT' : 'SCHEDULED'}
            </Text>
          </View>
        </View>

        {/* Clock-in progress bar */}
        {isClockedIn && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{myTodayShift?.start_time}</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{myTodayShift?.end_time}</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#334155', overflow: 'hidden' }}>
              <View style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, Math.round(((currentTimeMins - startMins) / (endMins - startMins)) * 100))}%`,
                backgroundColor: '#10B981',
              }} />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>{elapsedStr}</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{remainingStr}</Text>
            </View>
          </View>
        )}

        {/* Clock-in / Clock-out Buttons */}
        <View className="flex-row gap-3">
          {!isClockedOut && (
            <TouchableOpacity
              onPress={() => {
                if (myTodayShift) {
                  const newStatus = isClockedIn ? 'clocked_out' : 'clocked_in';
                  updateShift(myTodayShift.id, { status: newStatus });
                  Alert.alert(
                    newStatus === 'clocked_in' ? 'Clocked In' : 'Clocked Out',
                    newStatus === 'clocked_in' ? 'You have started your shift.' : 'You have ended your shift.',
                  );
                } else {
                  // Create a new shift for today and clock in
                  const newShift: Shift = {
                    id: `sh-${Date.now()}`,
                    property_id: activePropertyId || myStaff.property_id,
                    staff_id: myStaff.id,
                    staff_name: `${myStaff.first_name} ${myStaff.last_name}`,
                    date: todayStr,
                    start_time: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
                    end_time: '17:00',
                    status: 'clocked_in',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  addShift(newShift);
                  Alert.alert('Shift Started', 'You have started a new shift.');
                }
              }}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                backgroundColor: isClockedIn ? '#EF4444' : '#10B981',
                shadowColor: isClockedIn ? '#EF4444' : '#10B981',
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
                {isClockedIn ? '⬇ CLOCK OUT' : '⬆ CLOCK IN'}
              </Text>
            </TouchableOpacity>
          )}
          {isClockedOut && (
            <View style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#334155' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#94A3B8' }}>
                ✅ Shift complete
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCoverageCalendar = () => (
    <View>
      {/* My Shift Today — Clock-in/out card */}
      {renderMyShiftToday()}

      {/* Understaffed Warning Banner */}
      {understaffedDays.length > 0 && (
        <View style={{
          padding: 12, borderRadius: 12,
          backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B',
          marginBottom: 16,
        }}>
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <View className="flex-1">
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>
                Understaffed Alert
              </Text>
              <Text style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                {understaffedDays.map(d => formatDateReadable(d.date)).join(', ')} — only {Math.min(...understaffedDays.map(d => d.count))} staff scheduled
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Week Navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={() => { setCalendarWeekOffset(v => v - 1); setSelectedDay(null); }}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.muted }}
        >
          <Text style={{ fontSize: 16, color: colors.foreground }}>←</Text>
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-foreground">
          {formatDateReadable(weekDays[0])} — {formatDateReadable(weekDays[6])}
        </Text>
        <TouchableOpacity
          onPress={() => { setCalendarWeekOffset(v => v + 1); setSelectedDay(null); }}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.muted }}
        >
          <Text style={{ fontSize: 16, color: colors.foreground }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAY_NAMES.map(name => (
          <View key={name} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted }}>{name}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row">
        {coverageData.map(d => {
          const isSelected = selectedDay === d.key;
          const isToday = d.key === formatDateKey(new Date());
          let bgColor: string;
          let textColor: string;
          if (d.count >= 3) { bgColor = '#D1FAE5'; textColor = '#065F46'; }
          else if (d.count === 2) { bgColor = '#FEF3C7'; textColor = '#92400E'; }
          else { bgColor = '#FEE2E2'; textColor = '#991B1B'; }

          return (
            <TouchableOpacity
              key={d.key}
              onPress={() => setSelectedDay(isSelected ? null : d.key)}
              activeOpacity={0.7}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 12, marginHorizontal: 4,
                borderRadius: 12,
                backgroundColor: isSelected ? ACCENT : bgColor,
              }}
            >
              <Text style={{
                fontSize: 15, fontWeight: '700',
                color: isSelected ? '#fff' : textColor,
              }}>
                {d.date.getDate()}
              </Text>
              <View style={{
                marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}>
                <Text style={{
                  fontSize: 11, fontWeight: '700',
                  color: isSelected ? '#fff' : textColor,
                }}>
                  {d.count}
                </Text>
              </View>
              {isToday && !isSelected && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#3B82F6', marginTop: 2 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Shift List */}
      {selectedShifts.length > 0 && (
        <View style={{ marginTop: 16, gap: 8 }}>
          <Text className="text-sm font-semibold text-foreground mb-1">
            Shifts for {formatDateReadable(weekDays.find(d => formatDateKey(d) === selectedDay)!)}
          </Text>
          {selectedShifts.map(shift => (
            <TouchableOpacity
              key={shift.id}
              onPress={() => handleShiftStatusChange(shift)}
              activeOpacity={0.7}
              style={{
                padding: 14, borderRadius: 12,
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{shift.staff_name}</Text>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                  backgroundColor: `${SHIFT_STATUS_COLORS[shift.status]}20`,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: SHIFT_STATUS_COLORS[shift.status] }}>
                    {shift.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-muted mt-1">
                {shift.start_time} → {shift.end_time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* All Shifts Summary */}
      <Text className="text-xs text-muted mt-4 mb-2">
        All shifts ({filteredShifts.length})
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1FAE5' }} />
          <Text className="text-xs text-muted">{'>='}3 staff</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FEF3C7' }} />
          <Text className="text-xs text-muted">2 staff</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FEE2E2' }} />
          <Text className="text-xs text-muted">{'<='}1 staff</Text>
        </View>
      </View>
    </View>
  );

  const renderTasks = () => (
    <View>
      {filteredTasks.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No tasks</Text>
        </View>
      ) : (
        filteredTasks.map(task => (
          <TouchableOpacity
            key={task.id}
            onPress={() => handleAdvanceTask(task)}
            activeOpacity={0.7}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 12,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-foreground flex-1 mr-2">
                {task.title}
              </Text>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}20`,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: TASK_PRIORITY_COLORS[task.priority],
                }}>
                  {task.priority}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-muted mb-2">
              Assigned to: {task.assigned_name}
            </Text>

            <View className="flex-row items-center justify-between">
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: `${TASK_STATUS_COLORS[task.status]}20`,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: TASK_STATUS_COLORS[task.status],
                }}>
                  {task.status.replace('_', ' ')}
                </Text>
              </View>
              <Text className="text-xs text-muted">{task.due_date}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {renderTabSelector()}
      {activeTab === 'staff' && renderStaffList()}
      {activeTab === 'shifts' && renderCoverageCalendar()}
      {activeTab === 'tasks' && renderTasks()}
    </ScrollView>
  );
}
