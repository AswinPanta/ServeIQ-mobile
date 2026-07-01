import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { MOCK_BOOKING_HISTORY, type BookingHistoryItem } from '@/lib/mock/booking-data';

interface UserReview {
  id: string;
  hotelName: string;
  hotelCity: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
}



export default function ProfileScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'bookings'>('reviews');
  const [userReviews, setUserReviews] = useState<UserReview[]>([
    {
      id: '1',
      hotelName: 'Grand Hotel Kathmandu',
      hotelCity: 'Kathmandu',
      rating: 5,
      title: 'Excellent stay!',
      comment: 'Excellent hotel with great service and beautiful views! Highly recommend for anyone visiting Kathmandu.',
      date: '2024-06-15',
      photos: ['https://via.placeholder.com/300x300?text=Room+Photo'],
      status: 'approved',
    },
    {
      id: '2',
      hotelName: 'Lake View Resort',
      hotelCity: 'Pokhara',
      rating: 4,
      title: 'Beautiful location',
      comment: 'Amazing views of the lake. The rooms are clean and comfortable. Staff was helpful.',
      date: '2024-05-20',
      photos: ['https://via.placeholder.com/300x300?text=Lake+View'],
      status: 'approved',
    },
    {
      id: '3',
      hotelName: 'Heritage Palace',
      hotelCity: 'Bhaktapur',
      rating: 3,
      title: 'Average experience',
      comment: 'Good location but rooms need renovation. Breakfast could be better.',
      date: '2024-04-10',
      photos: [],
      status: 'pending',
    },
  ]);

  const [bookings, setBookings] = useState<BookingHistoryItem[]>(MOCK_BOOKING_HISTORY);

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          setUserReviews(userReviews.filter((r) => r.id !== reviewId));
          Alert.alert('Success', 'Review deleted successfully');
        },
      },
    ]);
  };

  const handleEditReview = (reviewId: string) => {
    Alert.alert('Edit Review', 'Review editing feature coming soon');
  };

  const handleCancelBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const now = new Date();
    const deadline = new Date(booking.cancellationDeadline);
    const isWithinFreeWindow = now < deadline;

    let message = '';
    let refundAmount = 0;

    if (booking.cancellationPolicy === 'strict') {
      message = 'This booking is non-refundable. No refund will be issued.';
      refundAmount = 0;
    } else if (isWithinFreeWindow) {
      message = 'Free cancellation — full refund will be issued.';
      refundAmount = booking.totalPrice;
    } else {
      const penalty = Math.round(booking.totalPrice * 0.25);
      refundAmount = booking.totalPrice - penalty;
      message = `Cancellation fee: Rs ${penalty.toLocaleString()} (25%). Refund: Rs ${refundAmount.toLocaleString()}.`;
    }

    Alert.alert(
      'Cancel Booking',
      `${message}\n\nAre you sure you want to cancel?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === bookingId
                  ? { ...b, status: 'cancelled' as const, refundAmount }
                  : b
              )
            );
            Alert.alert(
              'Booking Cancelled',
              refundAmount > 0
                ? `Refund of Rs ${refundAmount.toLocaleString()} will be processed within 5-7 business days.`
                : 'No refund applicable for this cancellation.'
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const renderReviewItem = ({ item }: { item: UserReview }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{item.hotelName}</Text>
          <Text className="text-xs text-muted">{item.hotelCity}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-lg">⭐</Text>
          <Text className="font-bold text-foreground">{item.rating}</Text>
        </View>
      </View>

      <View
        className={cn(
          'self-start rounded-full px-3 py-1 mb-2',
          item.status === 'approved'
            ? 'bg-success/20'
            : item.status === 'pending'
            ? 'bg-warning/20'
            : 'bg-error/20'
        )}
      >
        <Text
          className={cn(
            'text-xs font-semibold',
            item.status === 'approved'
              ? 'text-success'
              : item.status === 'pending'
              ? 'text-warning'
              : 'text-error'
          )}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <Text className="font-semibold text-foreground mb-1">{item.title}</Text>
      <Text className="text-sm text-foreground leading-relaxed mb-2 line-clamp-2">
        {item.comment}
      </Text>

      {item.photos.length > 0 && (
        <View className="flex-row gap-2 mb-3">
          {item.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              className="w-12 h-12 rounded-lg bg-surface"
            />
          ))}
        </View>
      )}

      <Text className="text-xs text-muted mb-3">{item.date}</Text>

      <View className="flex-row gap-2 pt-3 border-t border-border">
        <TouchableOpacity
          onPress={() => handleEditReview(item.id)}
          className="flex-1 py-2 rounded-lg bg-primary/10 items-center"
        >
          <Text className="text-xs font-semibold text-primary">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteReview(item.id)}
          className="flex-1 py-2 rounded-lg bg-error/10 items-center"
        >
          <Text className="text-xs font-semibold text-error">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBookingItem = ({ item }: { item: BookingHistoryItem }) => (
    <View className="bg-surface rounded-lg overflow-hidden mb-3 border border-border">
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{item.hotelName}</Text>
            <Text className="text-xs text-muted">{item.hotelCity}</Text>
          </View>
          <View
            className={cn(
              'rounded-full px-3 py-1',
              item.status === 'upcoming'
                ? 'bg-primary/20'
                : item.status === 'cancelled'
                ? 'bg-error/20'
                : 'bg-success/20'
            )}
          >
            <Text
              className={cn(
                'text-xs font-semibold',
                item.status === 'upcoming'
                  ? 'text-primary'
                  : item.status === 'cancelled'
                  ? 'text-error'
                  : 'text-success'
              )}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View className="gap-2 mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted">📅</Text>
            <Text className="text-sm text-foreground">
              {item.checkIn} to {item.checkOut}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted">🛏️</Text>
            <Text className="text-sm text-foreground">{item.roomType}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted">🌙</Text>
            <Text className="text-sm text-foreground">{item.nights} Nights</Text>
          </View>
          <View className="flex-row items-center justify-between pt-2 border-t border-border">
            <Text className="text-sm text-muted">Total Price:</Text>
            <Text className="text-lg font-bold text-primary">NPR {item.totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        {item.status === 'cancelled' && 'refundAmount' in item && (
          <Text style={{ fontSize: 12, color: colors.success, marginTop: 4 }}>
            Refund: Rs {(item as any).refundAmount?.toLocaleString() || '0'}
          </Text>
        )}

        {item.status === 'upcoming' && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Modify', 'Booking modification feature coming soon')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Modify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCancelBooking(item.id)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: `${colors.error}10`,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.error }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 py-6 border-b border-border">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-3xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{user?.name || 'User'}</Text>
              <Text className="text-sm text-muted">{user?.email}</Text>
              <Text className="text-xs text-muted mt-1">Member since June 2024</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4 flex-row gap-3">
          <View className="flex-1 bg-surface rounded-lg p-4 items-center border border-border">
            <Text className="text-2xl font-bold text-primary">{userReviews.length}</Text>
            <Text className="text-xs text-muted mt-1">Reviews</Text>
          </View>
          <View className="flex-1 bg-surface rounded-lg p-4 items-center border border-border">
            <Text className="text-2xl font-bold text-primary">{bookings.length}</Text>
            <Text className="text-xs text-muted mt-1">Bookings</Text>
          </View>
          <View className="flex-1 bg-surface rounded-lg p-4 items-center border border-border">
            <Text className="text-2xl font-bold text-primary">
              {userReviews.length > 0
                ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                : '0'}
            </Text>
            <Text className="text-xs text-muted mt-1">Avg Rating</Text>
          </View>
        </View>

        <View className="px-6 py-4 flex-row gap-3 border-b border-border">
          <TouchableOpacity
            onPress={() => setActiveTab('reviews')}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg border-2',
              activeTab === 'reviews'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface'
            )}
          >
            <Text
              className={cn(
                'text-sm font-semibold text-center',
                activeTab === 'reviews' ? 'text-primary' : 'text-muted'
              )}
            >
              My Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('bookings')}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg border-2',
              activeTab === 'bookings'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface'
            )}
          >
            <Text
              className={cn(
                'text-sm font-semibold text-center',
                activeTab === 'bookings' ? 'text-primary' : 'text-muted'
              )}
            >
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 py-4 flex-1">
          {activeTab === 'reviews' ? (
            <>
              {userReviews.length > 0 ? (
                <FlatList
                  data={userReviews}
                  keyExtractor={(item) => item.id}
                  renderItem={renderReviewItem}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-lg text-muted mb-2">No reviews yet</Text>
                  <Text className="text-sm text-muted text-center">
                    Write a review about your stay to help other guests
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {bookings.length > 0 ? (
                <FlatList
                  data={bookings}
                  keyExtractor={(item) => item.id}
                  renderItem={renderBookingItem}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-lg text-muted mb-2">No bookings yet</Text>
                  <Text className="text-sm text-muted text-center">
                    Start exploring and book your next stay
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View className="px-6 py-4 border-t border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Settings</Text>
          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">⚙️</Text>
              <Text className="text-base text-foreground">Account Settings</Text>
            </View>
            <Text className="text-lg text-muted">›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">🔔</Text>
              <Text className="text-base text-foreground">Notifications</Text>
            </View>
            <Text className="text-lg text-muted">›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">❓</Text>
              <Text className="text-base text-foreground">Help & Support</Text>
            </View>
            <Text className="text-lg text-muted">›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            className="py-3 px-4 rounded-lg bg-error/10 border border-error flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">🚪</Text>
              <Text className="text-base font-semibold text-error">Logout</Text>
            </View>
            <Text className="text-lg text-error">›</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
