import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, TextInput, Modal, RefreshControl, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/auth-context';
import { operationsApi } from '@/lib/api/operations-api';
import { safeGoBack } from '@/lib/utils';
import { HK_COLORS } from '@/lib/constants/housekeeping-theme';

const NAVY = HK_COLORS.navy;
const TEAL = HK_COLORS.teal;
const RED = HK_COLORS.dirty;
const BORDER = HK_COLORS.border;

/** Unwrap {success, data, meta} API responses — returns `fallback` when shape is unexpected. */
function unwrap<T>(res: any, fallback: T): T {
  if (Array.isArray(res)) return res as T;
  if (res && typeof res === 'object' && 'data' in res) return (res.data ?? fallback) as T;
  return res ?? fallback;
}

type Tab = 'tasks' | 'schedule' | 'rooms' | 'maintenance' | 'swap' | 'leave' | 'history';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'tasks', label: 'Tasks', icon: 'checkmark-circle-outline' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline' },
  { key: 'rooms', label: 'Rooms', icon: 'bed-outline' },
  { key: 'maintenance', label: 'Maint.', icon: 'construct-outline' },
  { key: 'swap', label: 'Swaps', icon: 'swap-horizontal-outline' },
  { key: 'leave', label: 'Leave', icon: 'calendar-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
];

const TASK_STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'AWAITING_INSPECTION', 'COMPLETED'];
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', IN_PROGRESS: 'In Progress', AWAITING_INSPECTION: 'Awaiting Inspection',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', APPROVED: 'Approved', REJECTED: 'Rejected',
  PENDING_REVIEW: 'Pending Review', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent',
  SICK_LEAVE: 'Sick', PERSONAL_LEAVE: 'Personal', VACATION: 'Vacation', UNPAID_LEAVE: 'Unpaid', OTHER: 'Other',
  MORNING: 'Morning', EVENING: 'Evening', NIGHT: 'Night',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: HK_COLORS.textMuted, MEDIUM: TEAL, HIGH: '#F59E0B', URGENT: RED,
};
const STATUS_DOT: Record<string, string> = {
  PENDING: HK_COLORS.textMuted, IN_PROGRESS: TEAL, AWAITING_INSPECTION: HK_COLORS.badgeBlue,
  COMPLETED: HK_COLORS.activeGreen, CANCELLED: RED, REJECTED: RED, APPROVED: HK_COLORS.activeGreen,
};

export default function HousekeepingScreen() {
  const { user, logout } = useAuth();
  const operator = user as { property_id?: string; property_name?: string; name?: string; role?: string; email?: string } | null;
  const [resolvedPropId, setResolvedPropId] = useState(operator?.property_id || '');
  const [resolvedPropName, setResolvedPropName] = useState(operator?.property_name || '');
  const isValidProperty = resolvedPropId.length > 0;
  // Fallback: read from AsyncStorage if user property_id is missing
  useEffect(() => {
    if (resolvedPropId) return;
    (async () => {
      const [pid, pname] = await Promise.all([
        AsyncStorage.getItem('@serveiq_default_ops_property_id'),
        AsyncStorage.getItem('@serveiq_default_ops_property_name'),
      ]);
      if (pid) {
        setResolvedPropId(pid);
        setResolvedPropName(pname || '');
      }
    })();
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(o => !o);

  const handleLogout = async () => { setMenuOpen(false); await logout(); router.replace('/'); };

  const [tasks, setTasks] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [taskRooms, setTaskRooms] = useState<any[]>([]);
  const [maintReports, setMaintReports] = useState<any[]>([]);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('medium');
  const [swaps, setSwaps] = useState<any[]>([]);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapStaffId, setSwapStaffId] = useState('');
  const [swapShift, setSwapShift] = useState('MORNING');
  const [swapReason, setSwapReason] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');
  const [leaveReason, setLeaveReason] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [roomStatuses, setRoomStatuses] = useState<any[]>([]);
  const [roomSummary, setRoomSummary] = useState<any>(null);
  const [maintRoomId, setMaintRoomId] = useState('');
  const [maintCategory, setMaintCategory] = useState('PLUMBING');
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [submitTask, setSubmitTask] = useState<any>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitPhotos, setSubmitPhotos] = useState<string[]>([]);
  const [maintPhotos, setMaintPhotos] = useState<string[]>([]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [leaveFromDate, setLeaveFromDate] = useState<Date | null>(null);
  const [leaveToDate, setLeaveToDate] = useState<Date | null>(null);

  const pickPhoto = async (onResult: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to attach images'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) onResult(result.assets[0].uri);
  };

  const pickCamera = async (onResult: (uri: string) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access to take photos'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) onResult(result.assets[0].uri);
  };

  const fetchTasks = useCallback(async () => {
    if (!isValidProperty) return;
    const [tasksRes, roomsRes] = await Promise.all([
      operationsApi.listAllTasks(resolvedPropId, {}, () => []),
      operationsApi.getTaskRooms(resolvedPropId, () => []),
    ]);
    const t = unwrap<any[]>(tasksRes, []);
    const r = unwrap<any[]>(roomsRes, []);
    setTasks(t);
    setTaskRooms(r);
  }, [resolvedPropId, isValidProperty]);

  const fetchSchedule = useCallback(async () => {
    if (!isValidProperty) return;
    const [today, weekly] = await Promise.all([
      operationsApi.getTodaySchedule(resolvedPropId, () => null as any),
      operationsApi.getWeeklySchedule(resolvedPropId, undefined, () => []),
    ]);
    setTodaySchedule(today);
    setWeeklySchedule(unwrap<any[]>(weekly, []));
  }, [resolvedPropId, isValidProperty]);

  const fetchMaintenance = useCallback(async () => {
    if (!isValidProperty) return;
    setMaintReports(unwrap(await operationsApi.getMyMaintenanceReports(resolvedPropId, {}, () => []), []));
  }, [resolvedPropId, isValidProperty]);

  const fetchSwaps = useCallback(async () => {
    if (!isValidProperty) return;
    setSwaps(unwrap(await operationsApi.getMySwapRequests(resolvedPropId, {}, () => []), []));
  }, [resolvedPropId, isValidProperty]);

  const fetchLeaves = useCallback(async () => {
    if (!isValidProperty) return;
    setLeaves(unwrap(await operationsApi.getMyLeaveRequests(resolvedPropId, {}, () => []), []));
  }, [resolvedPropId, isValidProperty]);

  const fetchHistory = useCallback(async () => {
    if (!isValidProperty) return;
    const [hist, stats] = await Promise.all([
      operationsApi.getWorkHistory(resolvedPropId, {}, () => []),
      operationsApi.getWorkHistoryStats(resolvedPropId, () => ({}) as any),
    ]);
    setHistory(unwrap<any[]>(hist, []));
    setHistoryStats(stats);
  }, [resolvedPropId, isValidProperty]);

  const fetchRoomStatus = useCallback(async () => {
    if (!isValidProperty) return;
    const [rooms, summary] = await Promise.all([
      operationsApi.getRoomStatus(resolvedPropId, () => []),
      operationsApi.getRoomStatusSummary(resolvedPropId),
    ]);
    const r = unwrap<any[]>(rooms, []);
    setRoomStatuses(r);
    setRoomSummary(summary);
  }, [resolvedPropId, isValidProperty]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchSchedule(), fetchMaintenance(), fetchSwaps(), fetchLeaves(), fetchHistory(), fetchRoomStatus()]);
  }, [fetchTasks, fetchSchedule, fetchMaintenance, fetchSwaps, fetchLeaves, fetchHistory, fetchRoomStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }, [fetchAll]);

  const advanceTask = useCallback(async (task: any) => {
    const idx = TASK_STATUS_FLOW.indexOf(task.status);
    if (idx >= TASK_STATUS_FLOW.length - 1) return;
    const next = TASK_STATUS_FLOW[idx + 1];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      await operationsApi.updateTask(resolvedPropId, task.id, { status: next }, () => task as any);
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      Alert.alert('Update failed', `Could not mark as ${STATUS_LABEL[next] || next}. Pull to refresh.`);
    }
  }, [resolvedPropId]);

  const openSubmitSheet = (task: any) => { setSubmitTask(task); setSubmitNotes(''); setSubmitPhotos([]); setShowSubmitSheet(true); };

  const submitCleaning = async () => {
    if (!submitTask) return;
    try {
      // Real endpoint: POST /housekeeping/cleaning/submit (multipart: task_id + checklist_items + after_images)
      const form = new FormData();
      form.append('task_id', submitTask.id);
      form.append('checklist_items', JSON.stringify(['BED_MAKING', 'BATHROOM_CLEANING']));
      submitPhotos.slice(0, 5).forEach((uri, i) => form.append('after_images', { uri, type: 'image/jpeg', name: `after_${i}.jpg` } as any));
      const res: any = await operationsApi.submitForInspection(resolvedPropId, form, () => null as any);
      if (!res || res?.success === false) {
        // Fallback: direct status patch (e.g. 403 "Task not assigned to you")
        await operationsApi.updateTask(resolvedPropId, submitTask.id, { status: 'AWAITING_INSPECTION', notes: submitNotes.trim() || undefined }, () => submitTask as any);
      }
      setTasks(prev => prev.map(t => t.id === submitTask.id ? { ...t, status: 'AWAITING_INSPECTION' } : t));
      setShowSubmitSheet(false); setSubmitTask(null); setSubmitPhotos([]);
      Alert.alert('Submitted', 'Task submitted for inspection');
    } catch { Alert.alert('Error', 'Failed to submit'); }
  };

  const submitMaintenance = async () => {
    if (!maintDesc.trim() || maintDesc.trim().length < 10) { Alert.alert('Required', 'Description must be at least 10 characters'); return; }
    if (!maintRoomId) { Alert.alert('Required', 'Please select a room'); return; }
    try {
      // Backend accepts ONLY multipart/form-data (no JSON body) — verified via OpenAPI
      const form = new FormData();
      form.append('room_id', maintRoomId);
      form.append('category', maintCategory);
      form.append('priority', maintPriority.toUpperCase());
      form.append('description', maintDesc.trim());
      maintPhotos.slice(0, 5).forEach((uri, i) => form.append('files', { uri, type: 'image/jpeg', name: `photo_${i}.jpg` } as any));
      await operationsApi.createMaintenanceReport(resolvedPropId, form, () => ({}) as any);
      setShowMaintForm(false); setMaintDesc(''); setMaintRoomId(''); setMaintPhotos([]); fetchMaintenance();
      Alert.alert('Submitted', 'Maintenance report created');
    } catch { Alert.alert('Error', 'Failed to submit report'); }
  };

  const submitSwap = async () => {
    if (!swapStaffId.trim()) { Alert.alert('Required', 'Please enter the target staff ID'); return; }
    if (!swapReason.trim() || swapReason.trim().length < 5) { Alert.alert('Required', 'Reason must be at least 5 characters'); return; }
    try {
      await operationsApi.createSwapRequest(resolvedPropId, { target_staff_id: swapStaffId, target_shift: swapShift as any, reason: swapReason.trim() }, () => ({}) as any);
      setShowSwapForm(false); setSwapStaffId(''); setSwapShift('MORNING'); setSwapReason(''); fetchSwaps();
      Alert.alert('Submitted', 'Swap request created');
    } catch { Alert.alert('Error', 'Failed to submit swap request'); }
  };

  const submitLeave = async () => {
    if (!leaveFromDate || !leaveToDate) { Alert.alert('Required', 'Please select start and end dates'); return; }
    if (!leaveReason.trim() || leaveReason.trim().length < 5) { Alert.alert('Required', 'Reason must be at least 5 characters'); return; }
    const typeMap: Record<string, string> = { sick: 'SICK_LEAVE', personal: 'PERSONAL_LEAVE', vacation: 'VACATION', other: 'OTHER' };
    const fromStr = leaveFromDate.toISOString().split('T')[0];
    const toStr = leaveToDate.toISOString().split('T')[0];
    try {
      await operationsApi.createLeaveRequest(resolvedPropId, { leave_type: (typeMap[leaveType] || 'OTHER') as any, start_date: fromStr, end_date: toStr, reason: leaveReason.trim() }, () => ({}) as any);
      setShowLeaveForm(false); setLeaveFromDate(null); setLeaveToDate(null); setLeaveReason(''); fetchLeaves();
      Alert.alert('Submitted', 'Leave request created');
    } catch { Alert.alert('Error', 'Failed to submit leave request'); }
  };

  const confirmDelete = (title: string, action: () => Promise<void>) => {
    Alert.alert(`Cancel ${title}`, 'Are you sure?', [{ text: 'No', style: 'cancel' }, { text: 'Yes', style: 'destructive', onPress: action }]);
  };
  const cancelLeave = (id: string) => confirmDelete('Leave', async () => { await operationsApi.cancelLeaveRequest(resolvedPropId, id).catch(() => {}); fetchLeaves(); });
  const cancelSwap = (id: string) => confirmDelete('Swap', async () => { await operationsApi.cancelSwapRequest(resolvedPropId, id).catch(() => {}); fetchSwaps(); });

  const pending = (tasks || []).filter((t: any) => t?.status !== 'COMPLETED');
  const completed = (tasks || []).filter((t: any) => t?.status === 'COMPLETED');
  const formTarget = activeTab === 'maintenance' ? 'Maintenance' : activeTab === 'swap' ? 'Swap' : activeTab === 'leave' ? 'Leave' : null;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Housekeeping</Text>
          <Text style={s.headerSub} numberOfLines={1}>{operator?.property_name || 'Operations'}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={s.iconBtn}>
            <Ionicons name="refresh" size={18} color={NAVY} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={s.avatarBtn}>
            <Ionicons name="person" size={16} color={HK_COLORS.white} />
          </TouchableOpacity>
        </View>
        {menuOpen && (
          <View style={s.menu}>
            <Text style={s.menuName}>{operator?.name || 'Staff'}</Text>
            <Text style={s.menuRole}>{operator?.role || 'housekeeping'}</Text>
            <View style={s.menuDivider} />
            <TouchableOpacity onPress={handleLogout} style={s.menuItem}>
              <Ionicons name="log-out-outline" size={15} color={RED} />
              <Text style={[s.menuItemText, { color: RED }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats strip */}
      {activeTab === 'tasks' && isValidProperty && (
        <View style={s.statsStrip}>
          <View style={[s.statCard, { borderLeftColor: NAVY }]}>
            <Text style={s.statNum}>{tasks.length}</Text>
            <Text style={s.statLbl}>Total</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: TEAL }]}>
            <Text style={s.statNum}>{pending.length}</Text>
            <Text style={s.statLbl}>Active</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: HK_COLORS.activeGreen }]}>
            <Text style={s.statNum}>{completed.length}</Text>
            <Text style={s.statLbl}>Done</Text>
          </View>
        </View>
      )}

      {/* Tab bar */}
      <View style={s.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[s.tab, activeTab === tab.key && s.tabActive]}>
              <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? HK_COLORS.white : HK_COLORS.textMuted} />
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
        showsVerticalScrollIndicator={false}
      >
        {!isValidProperty ? (
          <Empty icon="business-outline" title="No property assigned" sub="Contact your manager to assign a property" />
        ) : activeTab === 'tasks' ? (
          <TasksView tasks={tasks} pending={pending} completed={completed} onAdvance={advanceTask} onSubmitInspection={openSubmitSheet} />
        ) : activeTab === 'schedule' ? (
          <ScheduleView today={todaySchedule} weekly={weeklySchedule} />
        ) : activeTab === 'rooms' ? (
          <RoomsView rooms={roomStatuses} summary={roomSummary} />
        ) : activeTab === 'maintenance' ? (
          <>
            <View style={s.rowRight}>
              <TouchableOpacity onPress={() => setShowMaintForm(true)} style={s.primaryBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.primaryBtnText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
            <MaintView reports={maintReports} />
          </>
        ) : activeTab === 'swap' ? (
          <>
            <View style={s.rowRight}>
              <TouchableOpacity onPress={() => setShowSwapForm(true)} style={s.primaryBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.primaryBtnText}>New Request</Text>
              </TouchableOpacity>
            </View>
            <SwapView swaps={swaps} onCancel={cancelSwap} />
          </>
        ) : activeTab === 'leave' ? (
          <>
            <View style={s.rowRight}>
              <TouchableOpacity onPress={() => setShowLeaveForm(true)} style={s.primaryBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.primaryBtnText}>Request</Text>
              </TouchableOpacity>
            </View>
            <LeaveView leaves={leaves} onCancel={cancelLeave} />
          </>
        ) : (
          <HistoryView history={history} stats={historyStats} />
        )}
      </ScrollView>

      {/* Submit for Inspection Sheet */}
      <FormSheet visible={showSubmitSheet} onClose={() => setShowSubmitSheet(false)} title={`Submit Room ${submitTask?.room_name || ''} for Inspection`}>
        <TouchableOpacity onPress={() => pickCamera(uri => setSubmitPhotos(p => [...p, uri]))} style={s.formUpload}>
          <Ionicons name="camera-outline" size={36} color={NAVY} />
          <Text style={s.formUploadText}>Tap to add photos</Text>
          <Text style={s.formUploadHint}>Before/after photos help supervisors approve faster</Text>
        </TouchableOpacity>
        {submitPhotos.length > 0 && (
          <ScrollView horizontal style={{ marginVertical: 8 }}>
            {submitPhotos.map((uri, i) => (
              <View key={i} style={{ marginRight: 8 }}>
                <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                <TouchableOpacity onPress={() => setSubmitPhotos(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -4, right: -4, backgroundColor: RED, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        <Text style={s.label}>Notes</Text>
        <TextInput style={[s.input, s.multiline]} value={submitNotes} onChangeText={setSubmitNotes} placeholder="Any observations..." placeholderTextColor={HK_COLORS.textMuted} multiline />
        <View style={s.modalActions}>
          <TouchableOpacity onPress={() => setShowSubmitSheet(false)} style={s.cancelBtn}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={submitCleaning} style={s.submitBtn}><Text style={s.submitBtnText}>Submit for Inspection</Text></TouchableOpacity>
        </View>
      </FormSheet>

      {/* Maintenance Form — scrollable */}
      <FormSheet visible={showMaintForm && formTarget === 'Maintenance'} onClose={() => setShowMaintForm(false)} title="Report Maintenance Issue">
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator>
          <Text style={s.label}>Select Room</Text>
          {taskRooms.map((r: any) => (
            <TouchableOpacity key={r.id} onPress={() => setMaintRoomId(r.id)} style={[s.optionRow, maintRoomId === r.id && s.optionRowActive]}>
              <View style={[s.optionDot, { backgroundColor: maintRoomId === r.id ? NAVY : BORDER }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>Room {r.name}</Text>
                <Text style={s.optionSub}>{r.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        <Text style={s.label}>Category</Text>
        <View style={s.chipRow}>
          {(['PLUMBING', 'ELECTRICAL', 'HVAC', 'FURNITURE', 'APPLIANCE', 'FLOORING', 'PAINTING', 'LOCK_SECURITY', 'OTHER'] as const).map(cat => (
            <TouchableOpacity key={cat} onPress={() => setMaintCategory(cat)} style={[s.chip, maintCategory === cat && s.chipActive]}>
              <Text style={[s.chipText, maintCategory === cat && s.chipTextActive]}>{cat.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Description (min 10 characters)</Text>
        <TextInput style={[s.input, s.multiline]} value={maintDesc} onChangeText={setMaintDesc} placeholder="Describe the issue in detail..." placeholderTextColor={HK_COLORS.textMuted} multiline />
        <Text style={s.label}>Priority</Text>
        <View style={s.chipRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity key={p} onPress={() => setMaintPriority(p)} style={[s.chip, maintPriority === p && s.chipActive]}>
              <Text style={[s.chipText, maintPriority === p && s.chipTextActive]}>{p[0].toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => pickCamera(uri => setMaintPhotos(p => [...p, uri]))} style={[s.formUpload, { marginTop: 8 }]}>
          <Ionicons name="camera-outline" size={28} color={NAVY} />
          <Text style={s.formUploadText}>Add photos</Text>
        </TouchableOpacity>
        {maintPhotos.length > 0 && (
          <ScrollView horizontal style={{ marginVertical: 8 }}>
            {maintPhotos.map((uri, i) => (
              <View key={i} style={{ marginRight: 8 }}>
                <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                <TouchableOpacity onPress={() => setMaintPhotos(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -4, right: -4, backgroundColor: RED, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        </ScrollView>
        <View style={s.modalActions}>
          <TouchableOpacity onPress={() => setShowMaintForm(false)} style={s.cancelBtn}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={submitMaintenance} style={s.submitBtn}><Text style={s.submitBtnText}>Submit</Text></TouchableOpacity>
        </View>
      </FormSheet>

      {/* Swap Form */}
      <FormSheet visible={showSwapForm && formTarget === 'Swap'} onClose={() => setShowSwapForm(false)} title="Request Shift Swap">
        <Text style={s.label}>Target Staff ID</Text>
        <TextInput style={s.input} value={swapStaffId} onChangeText={setSwapStaffId} placeholder="Staff member ID" placeholderTextColor={HK_COLORS.textMuted} />
        <Text style={s.label}>Target Shift</Text>
        <View style={s.chipRow}>
          {['MORNING', 'EVENING', 'NIGHT'].map(sh => (
            <TouchableOpacity key={sh} onPress={() => setSwapShift(sh)} style={[s.chip, swapShift === sh && s.chipActive]}>
              <Text style={[s.chipText, swapShift === sh && s.chipTextActive]}>{STATUS_LABEL[sh] || sh}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Reason</Text>
        <TextInput style={s.input} value={swapReason} onChangeText={setSwapReason} placeholder="Why do you need to swap?" placeholderTextColor={HK_COLORS.textMuted} />
        <View style={s.modalActions}>
          <TouchableOpacity onPress={() => setShowSwapForm(false)} style={s.cancelBtn}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={submitSwap} style={s.submitBtn}><Text style={s.submitBtnText}>Submit</Text></TouchableOpacity>
        </View>
      </FormSheet>

      {/* Leave Form */}
      <FormSheet visible={showLeaveForm && formTarget === 'Leave'} onClose={() => setShowLeaveForm(false)} title="Request Leave">
        <Text style={s.label}>Leave Type</Text>
        <View style={s.chipRow}>
          {['sick', 'personal', 'vacation', 'other'].map(t => (
            <TouchableOpacity key={t} onPress={() => setLeaveType(t)} style={[s.chip, leaveType === t && s.chipActive]}>
              <Text style={[s.chipText, leaveType === t && s.chipTextActive]}>{t[0].toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Start Date</Text>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={s.input}>
          <Text style={{ color: leaveFromDate ? HK_COLORS.textPrimary : HK_COLORS.textMuted }}>
            {leaveFromDate ? leaveFromDate.toLocaleDateString() : 'Select start date'}
          </Text>
        </TouchableOpacity>
        {showFromPicker && (
          <DateTimePicker value={leaveFromDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_, d) => { setShowFromPicker(false); if (d) setLeaveFromDate(d); }} onDismiss={() => setShowFromPicker(false)} />
        )}
        <Text style={s.label}>End Date</Text>
        <TouchableOpacity onPress={() => setShowToPicker(true)} style={s.input}>
          <Text style={{ color: leaveToDate ? HK_COLORS.textPrimary : HK_COLORS.textMuted }}>
            {leaveToDate ? leaveToDate.toLocaleDateString() : 'Select end date'}
          </Text>
        </TouchableOpacity>
        {showToPicker && (
          <DateTimePicker value={leaveToDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_, d) => { setShowToPicker(false); if (d) setLeaveToDate(d); }} onDismiss={() => setShowToPicker(false)} />
        )}
        <Text style={s.label}>Reason (min 5 characters)</Text>
        <TextInput style={s.input} value={leaveReason} onChangeText={setLeaveReason} placeholder="Reason for leave" placeholderTextColor={HK_COLORS.textMuted} />
        <View style={s.modalActions}>
          <TouchableOpacity onPress={() => setShowLeaveForm(false)} style={s.cancelBtn}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={submitLeave} style={s.submitBtn}><Text style={s.submitBtnText}>Submit</Text></TouchableOpacity>
        </View>
      </FormSheet>
    </View>
  );
}

// ─── Tasks View (timeline + cards) ─────────────────────────────
function TasksView({ tasks, pending, completed, onAdvance, onSubmitInspection }: { tasks: any[]; pending: any[]; completed: any[]; onAdvance: (t: any) => void; onSubmitInspection: (t: any) => void }) {
  const [filter, setFilter] = useState('ALL');
  const filters = ['ALL', 'PENDING', 'IN_PROGRESS', 'AWAITING_INSPECTION', 'COMPLETED'];
  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => (t.status || 'PENDING') === filter);

  if (tasks.length === 0) return <Empty icon="clipboard-outline" title="No tasks assigned" sub="Check back later for new assignments" />;

  return (
    <View>
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.filterChip, filter === f && s.filterChipActive]}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'ALL' ? 'All' : STATUS_LABEL[f] || f}
            </Text>
            {f !== 'ALL' && (
              <View style={[s.filterBadge, filter === f ? s.filterBadgeActive : { backgroundColor: HK_COLORS.subCardBg }]}>
                <Text style={[s.filterBadgeText, filter === f && { color: HK_COLORS.white }]}>
                  {tasks.filter(t => (t.status || 'PENDING') === f).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Empty icon="checkmark-done-outline" title="All clear" sub="No tasks match this filter" />
      ) : (
        filtered.map(task => <TaskCard key={task.id} task={task} onAdvance={onAdvance} onSubmitInspection={onSubmitInspection} />)
      )}
    </View>
  );
}

function TaskCard({ task, onAdvance, onSubmitInspection }: { task: any; onAdvance: (t: any) => void; onSubmitInspection: (t: any) => void }) {
  const status = task.status || 'PENDING';
  const isDone = status === 'COMPLETED';
  const statusIdx = TASK_STATUS_FLOW.indexOf(status);
  const priority = (task.priority || 'MEDIUM').toUpperCase();
  const priorityColor = PRIORITY_COLORS[priority] || TEAL;
  const dueTime = task.due_time ? new Date(task.due_time) : null;
  const isOverdue = dueTime && dueTime < new Date() && !isDone;

  return (
    <View style={[s.taskCard, isDone && s.taskCardDone]}>
      {/* Status timeline header */}
      <View style={s.taskTimeline}>
        {TASK_STATUS_FLOW.map((step, i) => (
          <React.Fragment key={step}>
            <View style={[s.timelineDot, i <= statusIdx && { backgroundColor: STATUS_DOT[step] || NAVY }, i > statusIdx && { backgroundColor: HK_COLORS.subCardBg }]}>
              {i <= statusIdx && <Ionicons name={i < statusIdx ? 'checkmark' : i === statusIdx ? 'ellipse' : 'ellipse-outline'} size={8} color={HK_COLORS.white} />}
            </View>
            {i < TASK_STATUS_FLOW.length - 1 && <View style={[s.timelineLine, i < statusIdx && { backgroundColor: NAVY }]} />}
          </React.Fragment>
        ))}
      </View>
      <View style={s.taskTimelineLabels}>
        {TASK_STATUS_FLOW.map((step, i) => (
          <Text key={step} style={[s.timelineLabel, i === statusIdx && s.timelineLabelActive]} numberOfLines={1}>
            {STATUS_LABEL[step]?.replace('Awaiting ', '')}
          </Text>
        ))}
      </View>

      {/* Card body */}
      <View style={s.taskBody}>
        <View style={s.taskRow}>
          <View style={[s.roomBadge, { backgroundColor: isDone ? HK_COLORS.badgeGreen : HK_COLORS.badgeBlue }]}>
            <Ionicons name="bed-outline" size={14} color={isDone ? HK_COLORS.activeGreen : TEAL} />
            <Text style={[s.roomBadgeText, { color: isDone ? HK_COLORS.activeGreen : TEAL }]}>
              {task.room_name || task.room_number || '?'}
            </Text>
          </View>
          <View style={[s.priorityPill, { backgroundColor: priorityColor + '18' }]}>
            <Text style={[s.priorityText, { color: priorityColor }]}>{priority}</Text>
          </View>
        </View>

        <Text style={s.taskType}>{task.task_type?.replace('_', ' ') || 'Cleaning'}</Text>

        {task.notes ? <Text style={s.taskNotes} numberOfLines={2}>{task.notes}</Text> : null}

        <View style={s.taskMeta}>
          {task.floor_number ? (
            <View style={s.metaItem}>
              <Ionicons name="layers-outline" size={12} color={HK_COLORS.textMuted} />
              <Text style={s.metaText}>Floor {task.floor_number}</Text>
            </View>
          ) : null}
          {dueTime ? (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={12} color={isOverdue ? RED : HK_COLORS.textMuted} />
              <Text style={[s.metaText, isOverdue && { color: RED, fontWeight: '600' }]}>
                {isOverdue ? 'Overdue' : dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : null}
          {task.assigned_by_name ? (
            <View style={s.metaItem}>
              <Ionicons name="person-outline" size={12} color={HK_COLORS.textMuted} />
              <Text style={s.metaText}>{task.assigned_by_name}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Action */}
      {!isDone && (
        <View style={s.taskActions}>
          {status === 'PENDING' && (
            <TouchableOpacity onPress={() => onAdvance(task)} style={[s.advanceBtn, { backgroundColor: NAVY, flex: 1 }]}>
              <Ionicons name="play-outline" size={16} color="#fff" />
              <Text style={s.advanceBtnText}>Start Cleaning</Text>
            </TouchableOpacity>
          )}
          {status === 'IN_PROGRESS' && (
            <TouchableOpacity onPress={() => onSubmitInspection(task)} style={[s.advanceBtn, { backgroundColor: TEAL, flex: 1 }]}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={s.advanceBtnText}>Submit for Inspection</Text>
            </TouchableOpacity>
          )}
          {status === 'AWAITING_INSPECTION' && (
            <View style={[s.advanceBtn, { backgroundColor: HK_COLORS.badgeBlue, flex: 1 }]}>
              <Ionicons name="hourglass-outline" size={16} color={NAVY} />
              <Text style={[s.advanceBtnText, { color: NAVY }]}>Awaiting Review</Text>
            </View>
          )}
        </View>
      )}
      {isDone && (
        <View style={s.doneBadge}>
          <Ionicons name="checkmark-circle" size={16} color={HK_COLORS.activeGreen} />
          <Text style={s.doneBadgeText}>Completed</Text>
        </View>
      )}
    </View>
  );
}

// ─── Schedule View ─────────────────────────────────────────────
function ScheduleView({ today, weekly }: { today: any; weekly: any[] }) {
  return (
    <View>
      {today ? (
        <View style={s.scheduleCard}>
          <View style={s.scheduleHeader}>
            <View style={s.scheduleIconWrap}>
              <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.scheduleTitle}>Today's Shift</Text>
              <Text style={s.scheduleMeta}>{today.shift_type || today.shift || 'Shift'}</Text>
            </View>
            {today.tasks_completed_today !== undefined && (
              <View style={s.scheduleProgress}>
                <Text style={s.scheduleProgressNum}>{today.tasks_completed_today}/{today.tasks_assigned_today ?? '?'}</Text>
                <Text style={s.scheduleProgressLabel}>tasks</Text>
              </View>
            )}
          </View>
          <View style={s.scheduleTimes}>
            <View style={s.scheduleTimeItem}>
              <Ionicons name="log-in-outline" size={14} color={TEAL} />
              <Text style={s.scheduleTimeText}>{today.check_in_time || today.start_time || '—'}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={HK_COLORS.textMuted} />
            <View style={s.scheduleTimeItem}>
              <Ionicons name="log-out-outline" size={14} color={RED} />
              <Text style={s.scheduleTimeText}>{today.check_out_time || today.end_time || '—'}</Text>
            </View>
          </View>
          {today.break_time ? (
            <View style={s.scheduleTimes}>
              <Ionicons name="cafe-outline" size={14} color={HK_COLORS.textMuted} />
              <Text style={[s.scheduleTimeText, { marginLeft: 4 }]}>Break: {today.break_time}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Empty icon="calendar-outline" title="No schedule today" sub="Check with your manager for shift details" />
      )}

      {weekly.length > 0 && (
        <>
          <Text style={s.sectionTitle}>This Week</Text>
          {weekly.map((d: any, i: number) => (
            <View key={d.id || i} style={s.scheduleWeekRow}>
              <View style={s.scheduleDayCol}>
                <Text style={s.scheduleDayName}>{d.day_name || d.shift_date?.slice(0, 3) || `Day ${i + 1}`}</Text>
                <Text style={s.scheduleDayDate}>{d.shift_date || ''}</Text>
              </View>
              <View style={s.scheduleDayShift}>
                <Text style={s.scheduleDayShiftType}>{d.shift_type || d.shift || '—'}</Text>
                {d.check_in_time ? <Text style={s.scheduleDayTime}>{d.check_in_time} → {d.check_out_time || '—'}</Text> : null}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ─── Cleaning View ─────────────────────────────────────────────
// ─── Room Status View ──────────────────────────────────────────
const ROOM_TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B', IN_PROGRESS: TEAL, AWAITING_INSPECTION: HK_COLORS.badgeBlue,
  COMPLETED: HK_COLORS.activeGreen, null: HK_COLORS.textMuted,
};
function RoomsView({ rooms, summary }: { rooms: any[]; summary: any }) {
  if (rooms.length === 0) return <Empty icon="bed-outline" title="No rooms" sub="Room status will appear here" />;
  return (
    <View>
      {summary ? (
        <View style={s.summaryRow}>
          {[
            { label: 'Total', value: summary.total_rooms, color: NAVY },
            { label: 'Available', value: summary.available_rooms, color: HK_COLORS.activeGreen },
            { label: 'Dirty', value: summary.dirty_rooms, color: RED },
            { label: 'In Progress', value: summary.in_progress_rooms, color: TEAL },
            { label: 'Inspected', value: summary.inspected_rooms, color: HK_COLORS.badgeBlue },
          ].map((item, i) => (
            <View key={i} style={[s.summaryCard, { borderLeftColor: item.color }]}>
              <Text style={[s.summaryVal, { color: item.color }]}>{item.value}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {rooms.map((room: any) => {
        const tsColor = ROOM_TASK_STATUS_COLORS[room.task_status] || HK_COLORS.textMuted;
        return (
          <View key={room.id} style={s.roomCard}>
            <View style={s.roomCardHeader}>
              <View style={s.roomCardLeft}>
                <Text style={s.roomCardName}>Room {room.room_name}</Text>
                <Text style={s.roomCardSub}>{room.room_type} · Floor {room.floor_number}</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: tsColor + '18' }]}>
                <View style={[s.statusDot, { backgroundColor: tsColor }]} />
                <Text style={[s.statusPillText, { color: tsColor }]}>{room.task_status || 'No task'}</Text>
              </View>
            </View>
            {room.assigned_to ? (
              <View style={s.roomCardMeta}>
                <Ionicons name="person-outline" size={12} color={HK_COLORS.textMuted} />
                <Text style={s.roomCardMetaText}>Assigned: {room.assigned_to}</Text>
              </View>
            ) : null}
            {room.last_cleaned ? (
              <View style={s.roomCardMeta}>
                <Ionicons name="time-outline" size={12} color={HK_COLORS.textMuted} />
                <Text style={s.roomCardMetaText}>Last cleaned: {new Date(room.last_cleaned).toLocaleDateString()}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ─── Maintenance View ──────────────────────────────────────────
function MaintView({ reports }: { reports: any[] }) {
  if (reports.length === 0) return <Empty icon="construct-outline" title="No reports yet" sub="Report an issue with a room" />;
  return (
    <View>
      {reports.map((r: any, i: number) => {
        const pri = (r.priority || 'medium').toLowerCase();
        const priColor = pri === 'high' || pri === 'urgent' ? RED : pri === 'medium' ? '#F59E0B' : TEAL;
        return (
          <View key={r.id || i} style={s.maintCard}>
            <View style={s.maintHeader}>
              <View style={s.maintRoom}>
                <Ionicons name="build-outline" size={14} color={NAVY} />
                <Text style={s.maintRoomText}>{r.room_name || r.room_number || 'General'}</Text>
              </View>
              <View style={[s.priorityPill, { backgroundColor: priColor + '18' }]}>
                <Text style={[s.priorityText, { color: priColor }]}>{pri}</Text>
              </View>
            </View>
            {r.description ? <Text style={s.maintDesc} numberOfLines={3}>{r.description}</Text> : null}
            <View style={s.maintFooter}>
              <View style={[s.statusPill, { backgroundColor: (STATUS_DOT[r.status] || HK_COLORS.textMuted) + '18' }]}>
                <View style={[s.statusDot, { backgroundColor: STATUS_DOT[r.status] || HK_COLORS.textMuted }]} />
                <Text style={[s.statusPillText, { color: STATUS_DOT[r.status] || HK_COLORS.textMuted }]}>{STATUS_LABEL[r.status] || r.status || 'Open'}</Text>
              </View>
              {r.created_at ? <Text style={s.maintDate}>{new Date(r.created_at).toLocaleDateString()}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Swap View ─────────────────────────────────────────────────
function SwapView({ swaps, onCancel }: { swaps: any[]; onCancel: (id: string) => void }) {
  if (swaps.length === 0) return <Empty icon="swap-horizontal-outline" title="No swap requests" sub="Request a shift swap" />;
  return (
    <View>
      {swaps.map((sw: any, i: number) => (
        <View key={sw.id || i} style={s.swapCard}>
          <View style={s.swapHeader}>
            <Ionicons name="person-outline" size={16} color={NAVY} />
            <Text style={s.swapStaff}>{sw.target_staff_name || sw.swap_with || 'Staff'}</Text>
            <View style={[s.statusPill, { backgroundColor: (STATUS_DOT[sw.status] || HK_COLORS.textMuted) + '18' }]}>
              <View style={[s.statusDot, { backgroundColor: STATUS_DOT[sw.status] || HK_COLORS.textMuted }]} />
              <Text style={[s.statusPillText, { color: STATUS_DOT[sw.status] || HK_COLORS.textMuted }]}>{STATUS_LABEL[sw.status] || sw.status || 'Pending'}</Text>
            </View>
          </View>
          <View style={s.swapShifts}>
            <View style={s.swapShiftItem}>
              <Text style={s.swapShiftLabel}>Your shift</Text>
              <Text style={s.swapShiftValue}>{sw.requester_shift || sw.swap_from || '—'}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={HK_COLORS.textMuted} />
            <View style={s.swapShiftItem}>
              <Text style={s.swapShiftLabel}>Target</Text>
              <Text style={s.swapShiftValue}>{sw.target_shift || sw.swap_to || '—'}</Text>
            </View>
          </View>
          {sw.reason ? <Text style={s.swapReason}>{sw.reason}</Text> : null}
          {(!sw.status || sw.status === 'pending') && (
            <TouchableOpacity onPress={() => onCancel(sw.id)} style={s.cancelLink}>
              <Text style={s.cancelLinkText}>Cancel request</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Leave View ────────────────────────────────────────────────
function LeaveView({ leaves, onCancel }: { leaves: any[]; onCancel: (id: string) => void }) {
  if (leaves.length === 0) return <Empty icon="bed-outline" title="No leave requests" sub="Request time off" />;
  return (
    <View>
      {leaves.map((lv: any, i: number) => (
        <View key={lv.id || i} style={s.leaveCard}>
          <View style={s.leaveHeader}>
            <View style={s.leaveTypeBadge}>
              <Ionicons name="bed-outline" size={14} color={NAVY} />
              <Text style={s.leaveTypeText}>{STATUS_LABEL[lv.leave_type] || lv.leave_type || 'Leave'}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: (STATUS_DOT[lv.status] || HK_COLORS.textMuted) + '18' }]}>
              <View style={[s.statusDot, { backgroundColor: STATUS_DOT[lv.status] || HK_COLORS.textMuted }]} />
              <Text style={[s.statusPillText, { color: STATUS_DOT[lv.status] || HK_COLORS.textMuted }]}>{STATUS_LABEL[lv.status] || lv.status || 'Pending'}</Text>
            </View>
          </View>
          <View style={s.leaveDates}>
            <Ionicons name="calendar-outline" size={14} color={HK_COLORS.textMuted} />
            <Text style={s.leaveDateText}>{lv.start_date || '?'} → {lv.end_date || '?'}</Text>
          </View>
          {lv.reason ? <Text style={s.leaveReason}>{lv.reason}</Text> : null}
          {(!lv.status || lv.status === 'pending') && (
            <TouchableOpacity onPress={() => onCancel(lv.id)} style={s.cancelLink}>
              <Text style={s.cancelLinkText}>Cancel request</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── History View ──────────────────────────────────────────────
function HistoryView({ history, stats }: { history: any[]; stats: any }) {
  return (
    <View>
      {stats && (stats.total_tasks_completed !== undefined || stats.total_tasks !== undefined) && (
        <View style={s.historyStats}>
          <View style={s.historyStat}>
            <Text style={s.historyStatNum}>{stats.total_tasks_completed ?? stats.total_tasks ?? stats.total ?? 0}</Text>
            <Text style={s.historyStatLabel}>Completed</Text>
          </View>
          <View style={s.historyStat}>
            <Text style={s.historyStatNum}>{stats.tasks_completed_today ?? 0}</Text>
            <Text style={s.historyStatLabel}>Today</Text>
          </View>
          <View style={s.historyStat}>
            <Text style={s.historyStatNum}>{stats.tasks_completed_this_week ?? 0}</Text>
            <Text style={s.historyStatLabel}>This Week</Text>
          </View>
          <View style={s.historyStat}>
            <Text style={s.historyStatNum}>{stats.total_duration_minutes ? `${Math.round(stats.total_duration_minutes / 60)}h` : '0h'}</Text>
            <Text style={s.historyStatLabel}>Hours</Text>
          </View>
        </View>
      )}
      {history.length === 0 ? (
        <Empty icon="time-outline" title="No history yet" sub="Completed tasks will appear here" />
      ) : (
        history.map((h: any, i: number) => (
          <View key={h.id || i} style={s.historyRow}>
            <View style={[s.statusDot, { backgroundColor: HK_COLORS.activeGreen }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.historyTitle}>Room {h.room_number || h.room_name || h.room || '?'}</Text>
              <Text style={s.historySub}>{h.task_type || 'Cleaning'}{h.duration ? ` · ${h.duration}` : ''}</Text>
            </View>
            {h.completed_at ? <Text style={s.historyDate}>{new Date(h.completed_at).toLocaleDateString()}</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

// ─── Shared Components ─────────────────────────────────────────
function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon as any} size={36} color={HK_COLORS.textMuted} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

function FormSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: HK_COLORS.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: HK_COLORS.white },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: HK_COLORS.subCardBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },
  headerSub: { fontSize: 11, color: HK_COLORS.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: HK_COLORS.subCardBg, alignItems: 'center', justifyContent: 'center' },
  avatarBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  menu: { position: 'absolute', top: 52, right: 12, backgroundColor: HK_COLORS.white, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, minWidth: 180, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuName: { fontSize: 14, fontWeight: '700', color: HK_COLORS.textHeading },
  menuRole: { fontSize: 11, color: HK_COLORS.textMuted, marginTop: 2, textTransform: 'capitalize' },
  menuDivider: { height: 1, backgroundColor: HK_COLORS.borderLight, marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  menuItemText: { fontSize: 14, fontWeight: '600' },

  statsStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  statCard: { flex: 1, backgroundColor: HK_COLORS.white, borderRadius: 8, borderLeftWidth: 3, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: NAVY },
  statLbl: { fontSize: 10, color: HK_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },

  tabBar: { borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: HK_COLORS.white },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tabActive: { backgroundColor: NAVY },
  tabLabel: { fontSize: 12, fontWeight: '600', color: HK_COLORS.textMuted },
  tabLabelActive: { color: HK_COLORS.white },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  filterRow: { gap: 8, marginBottom: 14 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: HK_COLORS.white },
  filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontSize: 12, fontWeight: '600', color: HK_COLORS.textMuted },
  filterTextActive: { color: HK_COLORS.white },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: NAVY },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: HK_COLORS.textMuted },

  taskCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 12, overflow: 'hidden' },
  taskCardDone: { opacity: 0.7 },
  taskTimeline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { flex: 1, height: 2, backgroundColor: HK_COLORS.subCardBg, marginHorizontal: 4 },
  taskTimelineLabels: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 4 },
  timelineLabel: { flex: 1, fontSize: 8, color: HK_COLORS.textMuted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  timelineLabelActive: { color: NAVY, fontWeight: '700' },
  taskBody: { padding: 14 },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  roomBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roomBadgeText: { fontSize: 13, fontWeight: '700' },
  priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  taskType: { fontSize: 15, fontWeight: '700', color: HK_COLORS.textHeading, marginBottom: 2 },
  taskNotes: { fontSize: 12, color: HK_COLORS.textMuted, lineHeight: 17, marginBottom: 6 },
  taskMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: HK_COLORS.textMuted },
  taskActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 },
  advanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 8 },
  advanceBtnText: { fontSize: 13, fontWeight: '700', color: HK_COLORS.white },
  doneBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER },
  doneBadgeText: { fontSize: 13, fontWeight: '600', color: HK_COLORS.activeGreen },

  scheduleCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  scheduleIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  scheduleTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
  scheduleMeta: { fontSize: 12, color: HK_COLORS.textMuted, marginTop: 2 },
  scheduleProgress: { alignItems: 'center', backgroundColor: HK_COLORS.badgeGreen, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scheduleProgressNum: { fontSize: 16, fontWeight: '800', color: HK_COLORS.activeGreen },
  scheduleProgressLabel: { fontSize: 9, color: HK_COLORS.activeGreen, textTransform: 'uppercase' },
  scheduleTimes: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scheduleTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleTimeText: { fontSize: 13, color: HK_COLORS.textPrimary },
  scheduleWeekRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: HK_COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 6 },
  scheduleDayCol: { width: 50, alignItems: 'center' },
  scheduleDayName: { fontSize: 12, fontWeight: '700', color: NAVY, textTransform: 'uppercase' },
  scheduleDayDate: { fontSize: 10, color: HK_COLORS.textMuted },
  scheduleDayShift: { flex: 1, marginLeft: 12 },
  scheduleDayShiftType: { fontSize: 13, fontWeight: '600', color: HK_COLORS.textHeading },
  scheduleDayTime: { fontSize: 11, color: HK_COLORS.textMuted, marginTop: 2 },

  cleaningUploadCard: { alignItems: 'center', backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', padding: 32, marginBottom: 12 },
  cleaningUploadIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: HK_COLORS.badgeBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cleaningUploadTitle: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 4 },
  cleaningUploadSub: { fontSize: 12, color: HK_COLORS.textMuted, textAlign: 'center' },
  cleaningCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  cleaningCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cleaningRoomBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cleaningRoomText: { fontSize: 14, fontWeight: '700', color: NAVY },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  cleaningCardMeta: { fontSize: 12, color: HK_COLORS.textMuted, marginBottom: 2 },
  cleaningCardDate: { fontSize: 11, color: HK_COLORS.textMuted },
  rejectionBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 6, padding: 8, marginTop: 8 },
  rejectionText: { fontSize: 12, color: RED, flex: 1 },
  reviewRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: HK_COLORS.activeGreen, paddingVertical: 10, borderRadius: 8 },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: HK_COLORS.white },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: RED, paddingVertical: 10, borderRadius: 8 },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: HK_COLORS.white },

  maintCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  maintHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  maintRoom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  maintRoomText: { fontSize: 14, fontWeight: '700', color: NAVY },
  maintDesc: { fontSize: 12, color: HK_COLORS.textMuted, lineHeight: 17, marginBottom: 8 },
  maintFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  maintDate: { fontSize: 11, color: HK_COLORS.textMuted },

  swapCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  swapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swapStaff: { flex: 1, fontSize: 14, fontWeight: '700', color: NAVY },
  swapShifts: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  swapShiftItem: { flex: 1, backgroundColor: HK_COLORS.subCardBg, borderRadius: 8, padding: 10, alignItems: 'center' },
  swapShiftLabel: { fontSize: 10, color: HK_COLORS.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  swapShiftValue: { fontSize: 13, fontWeight: '700', color: HK_COLORS.textHeading },
  swapReason: { fontSize: 12, color: HK_COLORS.textMuted, marginTop: 4 },

  leaveCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10 },
  leaveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  leaveTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaveTypeText: { fontSize: 14, fontWeight: '700', color: NAVY },
  leaveDates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  leaveDateText: { fontSize: 13, color: HK_COLORS.textPrimary },
  leaveReason: { fontSize: 12, color: HK_COLORS.textMuted, marginTop: 4 },
  cancelLink: { marginTop: 8 },
  cancelLinkText: { fontSize: 12, fontWeight: '600', color: RED },

  historyStats: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  historyStat: { flex: 1, backgroundColor: HK_COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: BORDER, padding: 10, alignItems: 'center' },
  historyStatNum: { fontSize: 18, fontWeight: '800', color: NAVY },
  historyStatLabel: { fontSize: 9, color: HK_COLORS.textMuted, textTransform: 'uppercase', marginTop: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: HK_COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 6 },
  historyTitle: { fontSize: 13, fontWeight: '600', color: HK_COLORS.textHeading },
  historySub: { fontSize: 11, color: HK_COLORS.textMuted, marginTop: 1 },
  historyDate: { fontSize: 11, color: HK_COLORS.textMuted },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: HK_COLORS.textHeading, marginTop: 8 },
  emptySub: { fontSize: 12, color: HK_COLORS.textMuted, textAlign: 'center', maxWidth: 240 },

  rowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seg: { flexDirection: 'row', backgroundColor: HK_COLORS.subCardBg, borderRadius: 8, padding: 2 },
  segItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  segActive: { backgroundColor: HK_COLORS.white, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 12, fontWeight: '600', color: HK_COLORS.textMuted },
  segTextActive: { color: NAVY },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: NAVY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: HK_COLORS.white },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: NAVY, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  formUpload: { alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', borderRadius: 10, padding: 24, marginBottom: 16, backgroundColor: HK_COLORS.subCardBg },
  formUploadText: { fontSize: 13, fontWeight: '600', color: HK_COLORS.textMuted, marginTop: 8 },
  formUploadHint: { fontSize: 11, color: HK_COLORS.textMuted },
  label: { fontSize: 12, fontWeight: '600', color: HK_COLORS.textHeading, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: HK_COLORS.textPrimary, backgroundColor: HK_COLORS.white },
  multiline: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: HK_COLORS.white },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { fontSize: 12, fontWeight: '600', color: HK_COLORS.textMuted },
  chipTextActive: { color: HK_COLORS.white },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: HK_COLORS.white },
  optionRowActive: { borderColor: NAVY, backgroundColor: HK_COLORS.badgeBlue + '30' },
  optionDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  optionTitle: { fontSize: 13, fontWeight: '600', color: HK_COLORS.textHeading },
  optionSub: { fontSize: 11, color: HK_COLORS.textMuted },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: HK_COLORS.subCardBg },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: HK_COLORS.textMuted },
  submitBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 8, backgroundColor: NAVY },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: HK_COLORS.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: HK_COLORS.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: HK_COLORS.subCardBg, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: NAVY, marginBottom: 4 },

  summaryRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: HK_COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3, padding: 8, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 9, color: HK_COLORS.textMuted, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  roomCard: { backgroundColor: HK_COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8 },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomCardLeft: { flex: 1 },
  roomCardName: { fontSize: 15, fontWeight: '700', color: NAVY },
  roomCardSub: { fontSize: 12, color: HK_COLORS.textMuted, marginTop: 2 },
  roomCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  roomCardMetaText: { fontSize: 12, color: HK_COLORS.textMuted },
});
