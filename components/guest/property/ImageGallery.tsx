import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ImageGalleryProps {
  images: string[];
  selectedImageIndex: number;
  onSelectImage: (i: number) => void;
  showAllPhotos: boolean;
  onTogglePhotos: () => void;
  onBack: () => void;
  onShare: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function ImageGallery({
  images,
  selectedImageIndex,
  onSelectImage,
  showAllPhotos,
  onTogglePhotos,
  onBack,
  onShare,
  isFavorite,
  onToggleFavorite,
}: ImageGalleryProps) {
  if (showAllPhotos) {
    return (
      <View style={s.fullContainer}>
        <View style={s.topActions}>
          <TouchableOpacity onPress={onBack} style={s.actionBtn}>
            <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onTogglePhotos} style={s.actionBtn}>
            <Text style={s.collapseText}>Collapse</Text>
          </TouchableOpacity>
        </View>
        <View style={s.fullGrid}>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={s.fullImg} resizeMode="cover" />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={s.gallery}>
      <Image source={{ uri: images[selectedImageIndex] }} style={s.mainImage} resizeMode="cover" />

      {images.length > 1 && (
        <>
          <TouchableOpacity
            onPress={() => onSelectImage(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1)}
            style={[s.galleryNav, { left: 12 }]}
          >
            <IconSymbol name="chevron.left" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelectImage(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1)}
            style={[s.galleryNav, { right: 12 }]}
          >
            <IconSymbol name="chevron.right" size={18} color="#FFF" />
          </TouchableOpacity>
          <View style={s.dotRow}>
            {images.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i === selectedImageIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
            ))}
          </View>
        </>
      )}

      <View style={s.topActions}>
        <TouchableOpacity onPress={onBack} style={s.actionBtn}>
          <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity onPress={onShare} style={s.actionBtn}>
            <IconSymbol name="share" size={18} color="#1A3C5E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={s.actionBtn}>
            <IconSymbol name="heart.fill" size={18} color={isFavorite ? '#EF4444' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      </View>

      {images.length > 1 && (
        <TouchableOpacity onPress={onTogglePhotos} style={s.photoCount}>
          <IconSymbol name="photo" size={12} color="#1A3C5E" />
          <Text style={s.photoCountText}>{showAllPhotos ? 'Collapse' : `${images.length} photos`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  gallery: { position: 'relative', backgroundColor: '#000', height: 320 },
  mainImage: { width: '100%', height: '100%' },
  galleryNav: {
    position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  dotRow: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  topActions: {
    position: 'absolute', top: 48, left: 0, right: 0, flexDirection: 'row',
    justifyContent: 'space-between', paddingHorizontal: 12,
  },
  topRight: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoCount: {
    position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  photoCountText: { fontSize: 11, fontWeight: '600', color: '#1A3C5E' },
  fullContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  fullGrid: { padding: 16, gap: 12 },
  fullImg: { width: '100%', height: 180, borderRadius: 12 },
  collapseText: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
});
