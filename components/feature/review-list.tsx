import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  photos?: string[];
  verified?: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  onWriteReview: () => void;
}

export function ReviewList({ reviews, onWriteReview }: ReviewListProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return (
      <View key={rating} className="flex-row items-center gap-2 mb-2">
        <Text className="text-xs text-muted w-6">{rating}★</Text>
        <View className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text className="text-xs text-muted w-8 text-right">{count}</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <TouchableOpacity
      onPress={() => setSelectedReview(item)}
      activeOpacity={0.8}
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-lg font-bold text-primary">
              {item.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-foreground">{item.author}</Text>
              {item.verified && <Text className="text-xs">✓</Text>}
            </View>
            <Text className="text-xs text-muted">{item.date}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-lg">⭐</Text>
          <Text className="font-bold text-foreground">{item.rating}</Text>
        </View>
      </View>

      <Text className="font-semibold text-foreground mb-1">{item.title}</Text>

      <Text className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">
        {item.comment}
      </Text>

      {item.photos && item.photos.length > 0 && (
        <View className="flex-row gap-2 mb-3">
          {item.photos.slice(0, 3).map((photo, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: photo }}
                className="w-16 h-16 rounded-lg bg-surface"
              />
              {index === 2 && item.photos!.length > 3 && (
                <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    +{item.photos!.length - 3}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View className="flex-row gap-4 pt-3 border-t border-border">
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text className="text-lg">👍</Text>
          <Text className="text-xs text-muted">Helpful</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text className="text-lg">👎</Text>
          <Text className="text-xs text-muted">Not helpful</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <View className="bg-surface rounded-lg p-4 mb-4">
        <View className="flex-row items-end gap-4 mb-4">
          <View>
            <Text className="text-5xl font-bold text-foreground">{averageRating}</Text>
            <Text className="text-xs text-muted">out of 5</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} className="text-lg">
                  {star <= Math.round(Number(averageRating)) ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
            <Text className="text-xs text-muted mt-1">{reviews.length} reviews</Text>
          </View>
        </View>

        {renderRatingBar(5, ratingDistribution[5])}
        {renderRatingBar(4, ratingDistribution[4])}
        {renderRatingBar(3, ratingDistribution[3])}
        {renderRatingBar(2, ratingDistribution[2])}
        {renderRatingBar(1, ratingDistribution[1])}
      </View>

      <TouchableOpacity
        onPress={onWriteReview}
        className="bg-primary rounded-lg p-4 mb-4 flex-row items-center justify-center gap-2"
      >
        <Text className="text-lg">✏️</Text>
        <Text className="text-base font-semibold text-white">Write a Review</Text>
      </TouchableOpacity>

      {reviews.length > 0 ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="items-center justify-center py-8">
          <Text className="text-lg text-muted mb-2">No reviews yet</Text>
          <Text className="text-sm text-muted text-center">
            Be the first to share your experience!
          </Text>
        </View>
      )}

      {selectedReview && selectedReview.photos && selectedReview.photos.length > 0 && (
        <Modal
          visible={!!selectedReview}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedReview(null)}
        >
          <View className="flex-1 bg-black items-center justify-center">
            <TouchableOpacity
              onPress={() => setSelectedReview(null)}
              className="absolute top-12 right-6 z-10 w-10 h-10 items-center justify-center bg-white/20 rounded-full"
            >
              <Text className="text-2xl text-white">✕</Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const currentIndex = Math.round(contentOffsetX / 400);
                setSelectedPhotoIndex(currentIndex);
              }}
            >
              {selectedReview.photos.map((photo, index) => (
                <View key={index} className="w-96 h-full items-center justify-center">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            <View className="absolute bottom-6 bg-black/60 rounded-full px-4 py-2">
              <Text className="text-white text-sm font-semibold">
                {selectedPhotoIndex + 1} / {selectedReview.photos.length}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
