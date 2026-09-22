import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, BackendRoomOption, BackendStaffOption, TaskType, TaskPriorityBE } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { hostApi } from '@/lib/api/host-api';
import { GRAY, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '@/constants/portal-theme';
import { AMBER, PURPLE, STATUS, BG, BLUE, RED, TEAL } from '@/lib/constants/figma-tokens';
import { HK_COLORS, HK_STATUS_TEXT, HK_STATUS_BG, HK_PRIORITY_COLORS } from '@/lib/constants/housekeeping-theme';

interface Props { property: Property }

type HKFilter = 'all' | 'DIRTY' | 'CLEANING' | 'AVAILABLE' | 'MAINTENANCE';
type HKTabs = 'rooms' | 'tasks';

const STATUS_COLORS: Record<string, string> = {
  DIRTY: AMBER[500], CLEANING: PURPLE[500], AVAILABLE: STATUS.activeGreen, MAINTENANCE: RED[500],
};

const STATUS_FLOW: Record<string, string[]> = {
  DIRTY: ['CLEANING'],
  CLEANING: ['AVAILABLE', 'DIRTY'],
  AVAILABLE: ['DIRTY', 'MAINTENANCE'],
  MAINTENANCE: ['DIRTY'],
};

const TASK_TYPES = ['Room Cleaning', 'Linen Change', 'Deep Cleaning', 'Inspection', 'Restock Amenities', 'Maintenance Check'];
// Same order as TASK_TYPES — maps display labels to backend TaskType enum values
const TASK_TYPE_ENUM: TaskType[] = ['ROOM_CLEANING', 'LINEN_CHANGE', 'DEEP_CLEANING', 'INSPECTION', 'RESTOCK_AMENITIES', 'MAINTENANCE_CHECK'];
const PRIORITIES = ['Low', 'Normal', 'High'] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface HKTask {
  id: string;
  roomId: string;
  roomName: string;
  floor: number;
  type: string;
  priority: string;
  status: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
}

function generateMockTasks(rooms: any[]): HKTask[] {
  const tasks: HKTask[] = [];
  const staffNames = ['Kiran Gurung', 'Sita Rai', 'Hari Tamang', 'Gita Shrestha'];
  const statuses = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'];
  const dirtyRooms = rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING');
  dirtyRooms.forEach((r, i) => {
    tasks.push({
      id: `hk-${i + 1}`,
      roomId: r.id,
      roomName: r.room_name,
      floor: r.floor_number,
      type: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
      priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assignedTo: staffNames[Math.floor(Math.random() * staffNames.length)],
      notes: '',
      createdAt: new Date().toISOString(),
    });
  });
  return tasks;
}

export function PropertyHousekeeping({ property }: Props) {
  const { getFilteredRooms, getFilteredStaff } = useHost();
  const rooms = getFilteredRooms(property.id);
  const staff = getFilteredStaff(property.id);

  const [activeTab, setActiveTab] = useState<HKTabs>('rooms');
  const [statusFilter, setStatusFilter] = useState<HKFilter>('all');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [taskPriority, setTaskPriority] = useState<string>('Normal');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HKTask | null>(null);
  const [serverRooms, setServerRooms] = useState<BackendRoomOption[]>([]);
  const [serverStaff, setServerStaff] = useState<BackendStaffOption[]>([]);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const tasks = useMemo(() => generateMockTasks(rooms), [rooms.length]);

  // Real picker options for task creation (GET /properties/{id}/tasks/rooms +
  // /tasks/housekeeping-staff) — CreateTaskRequest requires UUID room_id and
  // assigned_staff_id. Falls back to locally loaded rooms/staff when the
  // backend hasn't returned options (e.g. offline or demo property).
  useEffect(() => {
    if (!UUID_RE.test(property.id)) return;
    let cancelled = false;
    Promise.all([
      hostApi.getTaskRoomOptions(property.id),
      hostApi.getTaskHKStaffOptions(property.id),
    ])
      .then(([rms, stf]) => {
        if (cancelled) return;
        setServerRooms(rms);
        setServerStaff(stf);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [property.id]);

  const roomOptions: BackendRoomOption[] = serverRooms.length > 0
    ? serverRooms
    : rooms.map(r => ({ id: r.id, name: r.room_name, status: r.status as BackendRoomOption['status'] }));
  const staffOptions: BackendStaffOption[] = serverStaff.length > 0
    ? serverStaff
    : staff.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }));

  const handleCreateTask = async () => {
    if (!selectedRoom || !selectedRoomId) { Alert.alert('Error', 'Please select a room'); return; }
    if (!taskAssigneeId) { Alert.alert('Error', 'Please select a staff member'); return; }
    const taskTypeBE = TASK_TYPE_ENUM[TASK_TYPES.indexOf(taskType)] || 'ROOM_CLEANING';
    const priorityBE = taskPriority === 'High' ? 'HIGH' : taskPriority === 'Low' ? 'LOW' : 'MEDIUM';
    const dueIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // due in 24h
    const reset = () => {
      setShowCreateTask(false);
      setSelectedRoom(null);
      setSelectedRoomId(null);
      setTaskAssignee('');
      setTaskAssigneeId('');
      setTaskNotes('');
    };
    if (!UUID_RE.test(property.id)) {
      Alert.alert('Demo Mode', 'Connect a real property to create server-side tasks.');
      reset();
      return;
    }
    setCreatingTask(true);
    try {
      // Throwing fallback = no silent success: network failures surface here too
      await hostApi.createTaskBE(property.id, {
        room_id: selectedRoomId,
        task_type: taskTypeBE,
        priority: priorityBE as TaskPriorityBE,
        assigned_staff_id: taskAssigneeId,
        due_time: dueIso,
        notes: taskNotes.trim() || null,
      }, () => { throw new Error('unreachable'); });
      Alert.alert('Task Created', `Room ${selectedRoom} assigned to ${taskAssignee}.`);
      reset();
    } catch (e) {
      Alert.alert('Could Not Create Task', (e as Error)?.message || 'Please try again.');
    } finally {
      setCreatingTask(false);
    }
  };

  const stats = useMemo(() => {
    const dirty = rooms.filter(r => r.status === 'DIRTY').length;
    const cleaning = rooms.filter(r => r.status === 'CLEANING').length;
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
    const total = rooms.length;
    const pendingTasks = tasks.filter(t => t.status === 'Dirty' || t.status === 'In Progress').length;
    return { dirty, cleaning, available, maintenance, total, pendingTasks };
  }, [rooms, tasks]);

  const filteredRooms = useMemo(() => {
    if (statusFilter === 'all') return rooms;
    const status = statusFilter === 'DIRTY' ? 'DIRTY' : statusFilter === 'CLEANING' ? 'CLEANING' : statusFilter === 'AVAILABLE' ? 'AVAILABLE' : 'MAINTENANCE';
    return rooms.filter(r => r.status === status);
  }, [rooms, statusFilter]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    const statusMap: Record<string, string> = { DIRTY: 'Dirty', CLEANING: 'In Progress', AVAILABLE: 'Cleaned', MAINTENANCE: 'Inspected' };
    const target = statusMap[statusFilter] || statusFilter;
    return tasks.filter(t => t.status === target);
  }, [tasks, statusFilter]);

  const handleStatusChange = (roomId: string, newStatus: string) => {
    Alert.alert('Update Status', `Change room status to ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => {} },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['rooms', 'tasks'] as HKTabs[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Ionicons name={tab === 'rooms' ? 'bed' : 'checkmark-done'} size={14} color={activeTab === tab ? TEAL[600] : GRAY[400]} />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'rooms' ? 'Room Status' : 'Tasks'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Dirty', value: stats.dirty, color: AMBER[500], filter: 'DIRTY' as HKFilter },
            { label: 'Cleaning', value: stats.cleaning, color: PURPLE[500], filter: 'CLEANING' as HKFilter },
            { label: 'Clean', value: stats.available, color: STATUS.activeGreen, filter: 'AVAILABLE' as HKFilter },
            { label: 'Maintenance', value: stats.maintenance, color: RED[500], filter: 'MAINTENANCE' as HKFilter },
          ].map((stat, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setStatusFilter(statusFilter === stat.filter ? 'all' : stat.filter)}
              style={[
                styles.statCard,
                SHADOWS.card,
                statusFilter === stat.filter && { borderColor: stat.color, borderWidth: 2 },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={i === 0 ? 'alert-circle' : i === 1 ? 'hourglass' : i === 2 ? 'checkmark-circle' : 'construct'} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <Text style={styles.filterTitle}>
            {activeTab === 'rooms' ? `${filteredRooms.length} rooms` : `${filteredTasks.length} tasks`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
            <TouchableOpacity
              onPress={() => setShowFilterPicker(!showFilterPicker)}
              style={styles.filterBtn}
            >
              <Text style={styles.filterBtnText}>
                {statusFilter === 'all' ? 'All Status' : statusFilter.replace('_', ' ')}
              </Text>
              <Ionicons name="chevron-down" size={12} color={GRAY[400]} />
            </TouchableOpacity>
            {activeTab === 'tasks' && (
              <TouchableOpacity
                onPress={() => setShowCreateTask(true)}
                style={styles.addTaskBtn}
              >
                <Ionicons name="add" size={14} color={BG.white} />
                <Text style={styles.addTaskBtnText}>New Task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Picker */}
        {showFilterPicker && (
          <View style={styles.filterDropdown}>
            {(['all', 'DIRTY', 'CLEANING', 'AVAILABLE', 'MAINTENANCE'] as HKFilter[]).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => { setStatusFilter(f); setShowFilterPicker(false); }}
                style={[styles.filterDropdownItem, statusFilter === f && styles.filterDropdownActive]}
              >
                <Text style={[styles.filterDropdownText, statusFilter === f && styles.filterDropdownTextActive]}>
                  {f === 'all' ? 'All Status' : f.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Rooms View */}
        {activeTab === 'rooms' && (
          <>
            {filteredRooms.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="sparkles-outline" size={48} color={GRAY[300]} />
                <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[400] }}>
                  {statusFilter === 'all' ? 'No rooms found' : `No ${statusFilter.toLowerCase()} rooms`}
                </Text>
              </View>
            ) : (
              filteredRooms.map(r => (
                <View key={r.id} style={[styles.roomCard, SHADOWS.card]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>Room {r.room_name}</Text>
                      <Text style={styles.roomFloor}>Floor {r.floor_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[r.status] || GRAY[300]) + '18' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] || GRAY[500] }]}>
                        {r.status}
                      </Text>
                    </View>
                  </View>

                  {/* Status Flow Buttons */}
                  <View style={styles.statusFlow}>
                    {(STATUS_FLOW[r.status] || []).map(newStatus => (
                      <TouchableOpacity
                        key={newStatus}
                        onPress={() => handleStatusChange(r.id, newStatus)}
                        style={[styles.flowBtn, { borderColor: STATUS_COLORS[newStatus] || GRAY[300] }]}
                      >
                        <Text style={[styles.flowBtnText, { color: STATUS_COLORS[newStatus] || GRAY[500] }]}>
                          → {newStatus}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Tasks View */}
        {activeTab === 'tasks' && (
          <>
            {filteredTasks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="clipboard-outline" size={48} color={GRAY[300]} />
                <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[400] }}>No tasks found</Text>
              </View>
            ) : (
              filteredTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => setSelectedTask(task)}
                  style={[styles.taskCard, SHADOWS.card]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{task.type}</Text>
                      <Text style={styles.taskRoom}>Room {task.roomName} · Floor {task.floor}</Text>
                      <Text style={styles.taskAssignee}>Assigned to {task.assignedTo}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={[styles.priorityBadge, { backgroundColor: (HK_PRIORITY_COLORS[task.priority] || GRAY[300]) + '18' }]}>
                        <Text style={[styles.priorityText, { color: HK_PRIORITY_COLORS[task.priority] || GRAY[500] }]}>
                          {task.priority}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: (HK_STATUS_BG[task.status] || GRAY[100]) }]}>
                        <Text style={[styles.statusText, { color: HK_STATUS_TEXT[task.status] || GRAY[500] }]}>
                          {task.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal visible={showCreateTask} transparent animationType="slide" onRequestClose={() => setShowCreateTask(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, SHADOWS.card]}>
            <Text style={styles.modalTitle}>Create Housekeeping Task</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: 8 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Room</Text>
                <TouchableOpacity
                  onPress={() => setShowRoomPicker(!showRoomPicker)}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ fontSize: 13, color: selectedRoom ? GRAY[800] : GRAY[400] }}>
                    {selectedRoom || 'Select room'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={GRAY[400]} />
                </TouchableOpacity>
                {showRoomPicker && (
                  <View style={styles.pickerDropdown}>
                    {roomOptions.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => { setSelectedRoom(r.name); setSelectedRoomId(r.id); setShowRoomPicker(false); }}
                        style={styles.pickerItem}
                      >
                        <Text style={[styles.pickerText, selectedRoomId === r.id && styles.pickerTextActive]}>Room {r.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {roomOptions.length === 0 && (
                      <View style={styles.pickerItem}>
                        <Text style={styles.pickerText}>No rooms available</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Task Type</Text>
                <TouchableOpacity
                  onPress={() => setShowTypePicker(!showTypePicker)}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ fontSize: 13, color: GRAY[800] }}>{taskType}</Text>
                  <Ionicons name="chevron-down" size={14} color={GRAY[400]} />
                </TouchableOpacity>
                {showTypePicker && (
                  <View style={styles.pickerDropdown}>
                    {TASK_TYPES.map(t => (
                      <TouchableOpacity key={t} onPress={() => { setTaskType(t); setShowTypePicker(false); }} style={styles.pickerItem}>
                        <Text style={[styles.pickerText, taskType === t && styles.pickerTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PRIORITIES.map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setTaskPriority(p)}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: taskPriority === p ? (HK_PRIORITY_COLORS[p] || GRAY[300]) : GRAY[100],
                          borderColor: taskPriority === p ? (HK_PRIORITY_COLORS[p] || GRAY[300]) : GRAY[200],
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: taskPriority === p ? BG.white : GRAY[600] }}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity
                  onPress={() => setShowAssigneePicker(!showAssigneePicker)}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ fontSize: 13, color: taskAssignee ? GRAY[800] : GRAY[400] }}>
                    {taskAssignee || 'Select staff member'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={GRAY[400]} />
                </TouchableOpacity>
                {showAssigneePicker && (
                  <View style={styles.pickerDropdown}>
                    {staffOptions.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => { setTaskAssignee(s.name); setTaskAssigneeId(s.id); setShowAssigneePicker(false); }}
                        style={styles.pickerItem}
                      >
                        <Text style={[styles.pickerText, taskAssigneeId === s.id && styles.pickerTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {staffOptions.length === 0 && (
                      <View style={styles.pickerItem}>
                        <Text style={styles.pickerText}>No staff available</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  value={taskNotes}
                  onChangeText={setTaskNotes}
                  placeholder="Additional instructions..."
                  placeholderTextColor={GRAY[400]}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
              <TouchableOpacity onPress={() => setShowCreateTask(false)} style={[styles.cancelBtn]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: GRAY[600] }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateTask}
                disabled={creatingTask}
                style={[styles.createBtn, creatingTask && { opacity: 0.6 }]}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>{creatingTask ? 'Creating…' : 'Create Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <Modal visible={!!selectedTask} transparent animationType="fade" onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, SHADOWS.card]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedTask?.type}</Text>
                <Text style={styles.modalSubtitle}>Room {selectedTask?.roomName} · Floor {selectedTask?.floor}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color={GRAY[500]} />
              </TouchableOpacity>
            </View>
            {selectedTask && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: HK_STATUS_BG[selectedTask.status] || GRAY[100] }]}>
                    <Text style={[styles.statusText, { color: HK_STATUS_TEXT[selectedTask.status] || GRAY[500] }]}>
                      {selectedTask.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: (HK_PRIORITY_COLORS[selectedTask.priority] || GRAY[300]) + '18' }]}>
                    <Text style={[styles.priorityText, { color: HK_PRIORITY_COLORS[selectedTask.priority] || GRAY[500] }]}>
                      {selectedTask.priority}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned To</Text>
                  <Text style={styles.detailValue}>{selectedTask.assignedTo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTask.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: GRAY[100], backgroundColor: BG.white, paddingHorizontal: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: TEAL[600] },
  tabText: { fontSize: 13, fontWeight: '500', color: GRAY[400] },
  tabTextActive: { fontWeight: '700', color: TEAL[600] },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '22%', backgroundColor: BG.white, borderRadius: RADIUS.card + 6,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: GRAY[100],
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: GRAY[400], marginTop: 2 },

  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterTitle: { fontSize: 14, fontWeight: '600', color: GRAY[700] },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: BG.white, borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200],
  },
  filterBtnText: { fontSize: 12, fontWeight: '500', color: GRAY[600] },
  filterDropdown: {
    backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200],
    marginBottom: 12, ...SHADOWS.card,
  },
  filterDropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: GRAY[50] },
  filterDropdownActive: { backgroundColor: BLUE.tint },
  filterDropdownText: { fontSize: 13, color: GRAY[700] },
  filterDropdownTextActive: { fontWeight: '700', color: BLUE[600] },

  addTaskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: TEAL[600],
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.input,
  },
  addTaskBtnText: { fontSize: 12, fontWeight: '600', color: BG.white },

  roomCard: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: GRAY[100],
  },
  roomName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  roomFloor: { fontSize: 12, color: GRAY[400], marginTop: 2 },

  taskCard: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: GRAY[100],
  },
  taskTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  taskRoom: { fontSize: 12, color: GRAY[400], marginTop: 2 },
  taskAssignee: { fontSize: 12, color: GRAY[500], marginTop: 4 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  priorityText: { fontSize: 11, fontWeight: '600' },

  statusFlow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  flowBtn: { borderWidth: 1, borderRadius: RADIUS.input, paddingHorizontal: 10, paddingVertical: 6 },
  flowBtnText: { fontSize: 12, fontWeight: '600' },

  priorityChip: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.input, borderWidth: 1, alignItems: 'center',
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: BG.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32, maxHeight: '88%',
  },
  modalCard: { backgroundColor: BG.white, borderRadius: RADIUS.card + 8, width: '100%', maxWidth: 400, maxHeight: '80%', alignSelf: 'center', marginVertical: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GRAY[900] },
  modalSubtitle: { fontSize: 13, color: GRAY[400], marginTop: 2 },
  modalClose: { width: 32, height: 32, borderRadius: 8, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20, gap: 16 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: GRAY[100], alignItems: 'center' },
  modalFooterText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },

  label: { fontSize: 12, fontWeight: '600', color: GRAY[600] },
  input: {
    borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.input,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, color: GRAY[900],
  },
  pickerDropdown: {
    backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200],
    maxHeight: 200, overflow: 'hidden',
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: GRAY[50] },
  pickerText: { fontSize: 13, color: GRAY[700] },
  pickerTextActive: { fontWeight: '700', color: TEAL[600] },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: GRAY[50] },
  detailLabel: { fontSize: 13, color: GRAY[500] },
  detailValue: { fontSize: 14, fontWeight: '600', color: GRAY[900] },

  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: RADIUS.button, borderWidth: 1, borderColor: GRAY[200], alignItems: 'center',
  },
  createBtn: {
    flex: 1, paddingVertical: 13, borderRadius: RADIUS.button, backgroundColor: TEAL[600], alignItems: 'center',
  },
});
