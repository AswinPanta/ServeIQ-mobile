import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/portal-theme';
import type { StaffTask } from '@/types/api';
import { safeGoBack } from "@/lib/utils";
import { TEAL, RED, AMBER, GRAY, BLUE, STATUS, EMERALD, BG, SLATE } from '@/lib/constants/figma-tokens';

const ACCENT = TEAL[600];

const PRIORITY_CONFIG = {
  high: { label: 'High', color: RED[500], bg: RED[100], icon: 'exclamationmark.triangle.fill' },
  medium: { label: 'Medium', color: AMBER[500], bg: AMBER[100], icon: 'exclamationmark.circle.fill' },
  low: { label: 'Low', color: GRAY[500], bg: GRAY[100], icon: 'arrow.down.circle.fill' },
} as const;

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: AMBER[500], bg: AMBER[100] },
  in_progress: { label: 'In Progress', color: BLUE[500], bg: BLUE[100] },
  completed: { label: 'Done', color: STATUS.activeGreen, bg: EMERALD[100] },
} as const;

type StatusTab = 'all' | 'pending' | 'in_progress' | 'completed';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export default function TaskManagementScreen() {
  const colors = useColors();
  const { staffTasks, activePropertyId, staff, addStaffTask, updateStaffTask, removeStaffTask } = useHost();

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');

  const filteredTasks = useMemo(() => {
    let tasks = staffTasks.filter(t => t.property_id === activePropertyId);
    if (statusTab !== 'all') tasks = tasks.filter(t => t.status === statusTab);
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const pa = priorityOrder[a.priority];
      const pb = priorityOrder[b.priority];
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [staffTasks, activePropertyId, statusTab]);

  const propertyStaff = useMemo(() =>
    staff.filter(s => s.property_id === activePropertyId && s.is_active),
    [staff, activePropertyId]
  );

  const taskCounts = useMemo(() => {
    const tasks = staffTasks.filter(t => t.property_id === activePropertyId);
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [staffTasks, activePropertyId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setPriority('medium');
    setDueDate('');
  };

  const handleCreateTask = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    if (!assigneeId) {
      Alert.alert('Validation Error', 'Please select an assignee.');
      return;
    }

    const assignedStaff = propertyStaff.find(s => s.id === assigneeId);
    const now = new Date().toISOString();

    const newTask: StaffTask = {
      id: `task-${Date.now()}`,
      property_id: activePropertyId || 'prop-1',
      assigned_to: assigneeId,
      assigned_name: assignedStaff ? `${assignedStaff.first_name} ${assignedStaff.last_name}` : 'Unknown',
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      due_date: dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    addStaffTask(newTask);
    resetForm();
    setShowForm(false);
    Alert.alert('Task Created', `"${newTask.title}" assigned to ${newTask.assigned_name}`);
  };

  const handleStatusChange = (task: StaffTask, newStatus: 'pending' | 'in_progress' | 'completed') => {
    updateStaffTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  const handleDeleteTask = (task: StaffTask) => {
    Alert.alert(
      'Delete Task',
      `Remove "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeStaffTask(task.id) },
      ]
    );
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDateStr) < today;
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[TYPOGRAPHY.h2, { color: SRS.navy }]}>Tasks</Text>
          <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginTop: 2 }]}>
            {taskCounts.total} tasks · {taskCounts.in_progress} active
          </Text>
        </View>
      </View>

      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setStatusTab(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: statusTab === tab.key ? ACCENT : colors.border,
              },
            ]}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: statusTab === tab.key ? BG.white : colors.foreground,
            }}>
              {tab.label}
              {tab.key !== 'all' && taskCounts[tab.key] > 0 ? ` (${taskCounts[tab.key]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Task Button */}
      {!showForm && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '08' }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="add" size={20} color={ACCENT} />
          <Text style={[styles.addBtnText, { color: ACCENT }]}>Create New Task</Text>
        </TouchableOpacity>
      )}

      {/* Task Creation Form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.card]}>
          <Text style={[TYPOGRAPHY.subtitle, { color: SRS.navy, marginBottom: SPACING.lg, fontWeight: '700' }]}>
            New Task
          </Text>

          <View style={{ gap: SPACING.md }}>
            {/* Title */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Clean Room 105"
                placeholderTextColor={GRAY[400]}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {/* Description */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Task details..."
                placeholderTextColor={GRAY[400]}
                multiline
                numberOfLines={3}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 72, textAlignVertical: 'top' }]}
              />
            </View>

            {/* Assignee */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Assign To *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {propertyStaff.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setAssigneeId(s.id)}
                    style={[
                      styles.assigneeChip,
                      {
                        backgroundColor: assigneeId === s.id ? ACCENT : colors.border,
                      },
                    ]}
                  >
                    <Text style={{
                      fontSize: 12, fontWeight: '600',
                      color: assigneeId === s.id ? BG.white : colors.foreground,
                    }}>
                      {s.first_name} {s.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {propertyStaff.length === 0 && (
                  <Text style={{ fontSize: 12, color: GRAY[400], fontStyle: 'italic' }}>
                    No active staff to assign
                  </Text>
                )}
              </ScrollView>
            </View>

            {/* Priority */}
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.entries(PRIORITY_CONFIG) as ['high' | 'medium' | 'low', typeof PRIORITY_CONFIG['high']][]).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setPriority(key)}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: priority === key ? cfg.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={{
                      fontSize: 12, fontWeight: '600',
                      color: priority === key ? BG.white : colors.foreground,
                    }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder={(() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })()}
                placeholderTextColor={GRAY[400]}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>

          {/* Form Actions */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl }}>
            <TouchableOpacity
              onPress={() => { setShowForm(false); resetForm(); }}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateTask}
              style={[styles.createBtn, { backgroundColor: ACCENT }]}
            >
              <IconSymbol name="check" size={16} color={BG.white} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Task List */}
      <View style={{ marginTop: showForm ? SPACING.lg : 0 }}>
        {filteredTasks.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <IconSymbol name="checklist" size={48} color={GRAY[300]} />
            <Text style={[TYPOGRAPHY.body, { color: GRAY[400], marginTop: SPACING.md }]}>
              No tasks{statusTab !== 'all' ? ' in this status' : ' yet'}
            </Text>
            <Text style={[TYPOGRAPHY.small, { color: GRAY[300], marginTop: 4 }]}>
              {statusTab !== 'all' ? 'Try a different filter' : 'Create your first task to get started'}
            </Text>
          </View>
        ) : (
          filteredTasks.map(task => {
            const priorityCfg = PRIORITY_CONFIG[task.priority];
            const statusCfg = STATUS_CONFIG[task.status];
            const overdue = task.status !== 'completed' && isOverdue(task.due_date);

            return (
              <View
                key={task.id}
                style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: task.status === 'completed' ? 0.65 : 1 }, SHADOWS.card]}
              >
                {/* Top row: priority badge + delete */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.bg }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: priorityCfg.color }}>
                        {priorityCfg.label}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: statusCfg.color }}>
                        {statusCfg.label}
                      </Text>
                    </View>
                    {overdue && (
                      <View style={[styles.statusBadge, { backgroundColor: RED[100] }]}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: RED[500] }}>Overdue</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteTask(task)} style={styles.deleteBtn}>
                    <IconSymbol name="delete" size={16} color={GRAY[400]} />
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={[TYPOGRAPHY.body, { fontWeight: '700', color: SRS.navy, marginBottom: 4 }]}>
                  {task.title}
                </Text>

                {/* Description */}
                {task.description ? (
                  <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginBottom: SPACING.md }]} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}

                {/* Meta row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="person.fill" size={12} color={GRAY[400]} />
                    <Text style={[TYPOGRAPHY.caption, { color: GRAY[500] }]}>{task.assigned_name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="calendar" size={12} color={overdue ? RED[500] : GRAY[400]} />
                    <Text style={[TYPOGRAPHY.caption, { color: overdue ? RED[500] : GRAY[500], fontWeight: overdue ? '600' : '400' }]}>
                      {formatDate(task.due_date)}
                    </Text>
                  </View>
                </View>

                {/* Status actions */}
                {task.status !== 'completed' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {task.status === 'pending' && (
                      <TouchableOpacity
                        onPress={() => handleStatusChange(task, 'in_progress')}
                        style={[styles.actionBtn, { backgroundColor: BLUE[100] }]}
                      >
                        <IconSymbol name="progress" size={12} color={BLUE[500]} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: BLUE[500] }}>Start</Text>
                      </TouchableOpacity>
                    )}
                    {task.status === 'in_progress' && (
                      <TouchableOpacity
                        onPress={() => handleStatusChange(task, 'completed')}
                        style={[styles.actionBtn, { backgroundColor: EMERALD[100] }]}
                      >
                        <IconSymbol name="checkmark" size={12} color={STATUS.activeGreen} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: STATUS.activeGreen }}>Complete</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleStatusChange(task, 'pending')}
                      style={[styles.actionBtn, { backgroundColor: GRAY[100] }]}
                    >
                      <IconSymbol name="refresh" size={12} color={GRAY[500]} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: GRAY[500] }}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {task.status === 'completed' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconSymbol name="success" size={14} color={STATUS.activeGreen} />
                    <Text style={[TYPOGRAPHY.caption, { color: STATUS.activeGreen, fontWeight: '600' }]}>
                      Completed {task.completed_at ? formatDate(task.completed_at) : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.card,
    backgroundColor: SLATE[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    marginRight: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY[500],
  },
  input: {
    padding: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    fontSize: 13,
  },
  assigneeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    marginRight: 8,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  createBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
  },
  taskCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.button,
  },
});
