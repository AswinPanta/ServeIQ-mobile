import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import { TEAL, BRAND, BLUE, RED, PURPLE, AMBER, STATUS, BG, SLATE, BORDER, GRAY, EMERALD } from '@/lib/constants/figma-tokens';

const ACCENT = TEAL[600];
const NAVY = BRAND.navy;

type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type ApprovalType = 'discount' | 'refund' | 'upgrade' | 'comp';

interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  guestName: string;
  roomNumber: string;
  details: string;
  requestedBy: string;
  amount?: number;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
}

const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'ap-1', type: 'discount', status: 'pending', guestName: 'Aarav Sharma', roomNumber: '301',
    details: '15% off 3-night stay', requestedBy: 'Front Desk — Sita',
    amount: 4500, reason: 'VIP guest, returning customer',
    createdAt: '2026-07-28T10:30:00',
  },
  {
    id: 'ap-2', type: 'refund', status: 'pending', guestName: 'Maya Thapa', roomNumber: '205',
    details: 'Full refund — NPR 12,000', requestedBy: 'Guest via app',
    amount: 12000, reason: 'Guest reported AC not working for entire stay',
    createdAt: '2026-07-28T09:15:00',
  },
  {
    id: 'ap-3', type: 'upgrade', status: 'pending', guestName: 'John Williams', roomNumber: '102',
    details: 'Standard → Deluxe (complimentary)', requestedBy: 'Front Desk — Ram',
    reason: 'Honeymoon couple, celebrating anniversary',
    createdAt: '2026-07-28T08:00:00',
  },
  {
    id: 'ap-4', type: 'comp', status: 'pending', guestName: 'Li Wei Chen', roomNumber: '405',
    details: 'Complimentary dinner for 2 — NPR 5,000', requestedBy: 'Manager — Hari',
    amount: 5000, reason: 'Service recovery — noisy neighbor complaint unresolved',
    createdAt: '2026-07-27T22:00:00',
  },
  {
    id: 'ap-5', type: 'discount', status: 'approved', guestName: 'Priya Gurung', roomNumber: '108',
    details: '10% off weekend stay', requestedBy: 'Front Desk — Sita',
    amount: 1800, reason: 'Corporate rate match',
    createdAt: '2026-07-27T14:00:00', reviewedAt: '2026-07-27T14:30:00',
  },
  {
    id: 'ap-6', type: 'refund', status: 'rejected', guestName: 'David Kim', roomNumber: '302',
    details: '50% refund — NPR 6,000', requestedBy: 'Guest via phone',
    amount: 6000, reason: 'Requested refund for early checkout — policy states no refund within 24h',
    createdAt: '2026-07-27T11:00:00', reviewedAt: '2026-07-27T11:45:00',
  },
];

const TYPE_CONFIG: Record<ApprovalType, { label: string; icon: string; color: string }> = {
  discount: { label: 'Discount', icon: 'percent', color: BLUE[500] },
  refund: { label: 'Refund', icon: 'payment', color: RED[500] },
  upgrade: { label: 'Room Upgrade', icon: 'upgrade', color: PURPLE[500] },
  comp: { label: 'Complimentary', icon: 'redeem', color: AMBER[500] },
};

export default function ApprovalsScreen() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);
  const [filter, setFilter] = useState<'all' | ApprovalStatus>('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [managerCode, setManagerCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return approvals;
    return approvals.filter(a => a.status === filter);
  }, [approvals, filter]);

  const counts = useMemo(() => ({
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }), [approvals]);

  const handleApproveReject = (id: string, action: 'approved' | 'rejected') => {
    setPendingAction({ id, action });
    setShowCodeInput(true);
    setManagerCode('');
  };

  const confirmAction = () => {
    if (managerCode !== '1234') {
      Alert.alert('Invalid Code', 'Manager authorization code is incorrect.');
      return;
    }
    if (!pendingAction) return;
    setApprovals(prev => prev.map(a =>
      a.id === pendingAction.id
        ? { ...a, status: pendingAction.action, reviewedAt: new Date().toISOString() }
        : a
    ));
    setShowCodeInput(false);
    setPendingAction(null);
    setManagerCode('');
    setSelectedApproval(null);
    Alert.alert(
      pendingAction.action === 'approved' ? 'Approved' : 'Rejected',
      `Request has been ${pendingAction.action}.`
    );
  };

  const getTypeConfig = (type: ApprovalType) => TYPE_CONFIG[type];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={NAVY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Approvals</Text>
          <Text style={s.headerSub}>{counts.pending} pending request{counts.pending !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {[
          { key: 'pending' as const, label: 'Pending', count: counts.pending },
          { key: 'approved' as const, label: 'Approved', count: counts.approved },
          { key: 'rejected' as const, label: 'Rejected', count: counts.rejected },
          { key: 'all' as const, label: 'All', count: approvals.length },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[s.filterTab, filter === tab.key && s.filterTabActive]}
          >
            <Text style={[s.filterTabText, filter === tab.key && s.filterTabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[s.filterBadge, filter === tab.key && s.filterBadgeActive]}>
                <Text style={[s.filterBadgeText, filter === tab.key && s.filterBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="success" size={48} color={STATUS.activeGreen} />
            <Text style={s.emptyTitle}>All clear!</Text>
            <Text style={s.emptyDesc}>
              {filter === 'pending' ? 'No pending approvals' : `No ${filter} requests`}
            </Text>
          </View>
        ) : (
          filtered.map(req => {
            const tc = getTypeConfig(req.type);
            return (
              <TouchableOpacity
                key={req.id}
                onPress={() => setSelectedApproval(selectedApproval?.id === req.id ? null : req)}
                style={[s.approvalCard, req.status !== 'pending' && s.approvalCardReviewed]}
                activeOpacity={0.7}
              >
                <View style={s.approvalHeader}>
                  <View style={[s.typeBadge, { backgroundColor: tc.color + '15' }]}>
                    <IconSymbol name={tc.icon as any} size={14} color={tc.color} />
                    <Text style={[s.typeText, { color: tc.color }]}>{tc.label}</Text>
                  </View>
                  <View style={[s.statusBadge, req.status === 'approved' ? s.statusApproved : req.status === 'rejected' ? s.statusRejected : s.statusPending]}>
                    <Text style={[s.statusText, req.status === 'approved' ? s.statusTextApproved : req.status === 'rejected' ? s.statusTextRejected : s.statusTextPending]}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={s.guestName}>{req.guestName} — Room {req.roomNumber}</Text>
                <Text style={s.details}>{req.details}</Text>
                <Text style={s.reason} numberOfLines={selectedApproval?.id === req.id ? undefined : 2}>
                  {"\u201C"}{req.reason}{"\u201D"}
                </Text>

                {selectedApproval?.id === req.id && (
                  <View style={s.expandedSection}>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Requested by</Text>
                      <Text style={s.infoValue}>{req.requestedBy}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Time</Text>
                      <Text style={s.infoValue}>{new Date(req.createdAt).toLocaleString()}</Text>
                    </View>
                    {req.amount && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Amount</Text>
                        <Text style={[s.infoValue, { color: RED[500] }]}>NPR {req.amount.toLocaleString()}</Text>
                      </View>
                    )}

                    {req.status === 'pending' && (
                      <View style={s.actionRow}>
                        <TouchableOpacity
                          onPress={() => handleApproveReject(req.id, 'rejected')}
                          style={s.rejectBtn}
                        >
                          <IconSymbol name="close" size={14} color={BG.white} />
                          <Text style={s.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleApproveReject(req.id, 'approved')}
                          style={s.approveBtn}
                        >
                          <IconSymbol name="check" size={14} color={BG.white} />
                          <Text style={s.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {req.reviewedAt && (
                      <Text style={s.reviewedText}>
                        Reviewed {new Date(req.reviewedAt).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Manager Code Modal */}
      {showCodeInput && (
        <View style={s.modalOverlay}>
          <View style={s.modalBackdrop} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Manager Authorization</Text>
            <Text style={s.modalDesc}>
              Enter manager code to {pendingAction?.action === 'approved' ? 'approve' : 'reject'} this request.
            </Text>
            <TextInput
              placeholder="Enter 4-digit code"
              placeholderTextColor={SLATE[400]}
              value={managerCode}
              onChangeText={setManagerCode}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              style={s.codeInput}
            />
            <View style={s.modalActions}>
              <TouchableOpacity onPress={() => { setShowCodeInput(false); setPendingAction(null); }} style={s.modalCancelBtn}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAction} style={s.modalConfirmBtn}>
                <Text style={s.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const PF = FONTS.playfairDisplay.bold;
const IR = FONTS.inter.regular;
const IM = FONTS.inter.medium;
const IB = FONTS.inter.bold;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.card },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
    backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: BORDER.inactive,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: PF },
  headerSub: { fontSize: 12, color: GRAY[500], fontFamily: IR },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BG.white, gap: 8, borderBottomWidth: 1, borderBottomColor: BORDER.inactive },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: BG.card },
  filterTabActive: { backgroundColor: ACCENT },
  filterTabText: { fontSize: 12, fontWeight: '600', color: GRAY[500], fontFamily: IM },
  filterTabTextActive: { color: BG.white },
  filterBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: BORDER.inactive, alignItems: 'center', justifyContent: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: GRAY[500], fontFamily: IB },
  filterBadgeTextActive: { color: BG.white },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: NAVY, fontFamily: PF },
  emptyDesc: { fontSize: 13, color: GRAY[400], fontFamily: IR },

  approvalCard: { padding: 16, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: BORDER.inactive, gap: 6 },
  approvalCardReviewed: { opacity: 0.7 },
  approvalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '600', fontFamily: IB },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: IB },
  statusTextPending: { color: AMBER[600] },
  statusTextApproved: { color: EMERALD[600] },
  statusTextRejected: { color: RED[600] },

  guestName: { fontSize: 15, fontWeight: '700', color: NAVY, fontFamily: IM },
  details: { fontSize: 13, color: GRAY[700], fontFamily: IR },
  reason: { fontSize: 12, color: GRAY[500], fontStyle: 'italic', fontFamily: IR },

  expandedSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: 10, gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 12, color: GRAY[400], fontFamily: IR },
  infoValue: { fontSize: 12, fontWeight: '600', color: NAVY, fontFamily: IM },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: RED[500] },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: BG.white, fontFamily: IB },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: BG.white, fontFamily: IB },
  reviewedText: { fontSize: 11, color: GRAY[400], fontFamily: IR, marginTop: 4 },

  modalOverlay: { ...StyleSheet.absoluteFill, zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '85%', backgroundColor: BG.white, borderRadius: 16, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: PF },
  modalDesc: { fontSize: 13, color: GRAY[500], fontFamily: IR },
  codeInput: { borderWidth: 1, borderColor: BORDER.inactive, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: NAVY, textAlign: 'center', letterSpacing: 8, fontFamily: IB },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: BORDER.inactive, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: GRAY[500], fontFamily: IM },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: BG.white, fontFamily: IB },
});
