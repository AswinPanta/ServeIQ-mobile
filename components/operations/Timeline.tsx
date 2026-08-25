import { View, Text } from 'react-native';
import { SLATE } from '@/lib/constants/figma-tokens';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Timeline({ events, emptyMessage = 'No recent activity' }: TimelineProps) {
  if (events.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 13, color: SLATE[400] }}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingLeft: 8 }}>
      {events.map((event, idx) => (
        <View key={event.id} style={{ flexDirection: 'row', minHeight: 48 }}>
          <View style={{ alignItems: 'center', width: 28 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: event.color + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11 }}>{event.icon}</Text>
            </View>
            {idx < events.length - 1 && (
              <View style={{ flex: 1, width: 2, backgroundColor: SLATE[200], marginTop: 4 }} />
            )}
          </View>
          <View style={{ flex: 1, paddingLeft: 10, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>{event.title}</Text>
              <Text style={{ fontSize: 11, color: SLATE[400] }}>{relativeTime(event.time)}</Text>
            </View>
            {event.description && (
              <Text style={{ fontSize: 12, color: SLATE[500], marginTop: 2 }}>{event.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
