import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONTS, RADIUS } from '@/constants/portal-theme';
import { BG, GRAY, BRAND, SLATE } from '@/lib/constants/figma-tokens';

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface FigmaBottomNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
}

export function FigmaBottomNav({
  tabs,
  activeTab,
  onTabPress,
  style,
}: FigmaBottomNavProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              {tab.icon}
            </View>
            <Text
              style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: BG.white,
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(46, 134, 171, 0.1)',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: BRAND.navyLight,
    fontFamily: FONTS.inter.semiBold,
  },
  labelInactive: {
    color: SLATE[400],
    fontFamily: FONTS.inter.medium,
  },
});
