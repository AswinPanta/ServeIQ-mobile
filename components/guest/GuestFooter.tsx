import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FOOTER_LINKS = {
  Support: ['Help Center', 'AirCover', 'Safety information', 'Supporting people with disabilities', 'Cancellation options'],
  Hosting: ['Try hosting', 'AirCover for Hosts', 'Explore hosting resources', 'Visit our community forum', 'Responsible hosting'],
  StayEasy: ['Newsroom', 'Features', 'Careers', 'Investors', 'Pricing & Plans'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Sitemap', 'Company details'],
};

export function GuestFooter() {
  return (
    <View style={s.container}>
      {/* Brand */}
      <View style={s.brandRow}>
        <View style={s.logoDot} />
        <Text style={s.brandName}>
          Stay<Text style={s.brandAccent}>Easy</Text>
        </Text>
      </View>

      {/* Links Grid */}
      <View style={s.linksGrid}>
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <View key={section} style={s.linkColumn}>
            <Text style={s.sectionTitle}>{section}</Text>
            {links.map((link) => (
              <TouchableOpacity key={link} style={s.linkItem}>
                <Text style={s.linkText}>{link}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Bottom Row */}
      <View style={s.bottomRow}>
        <Text style={s.copyright}>© 2026 StayEasy, Inc. All rights reserved.</Text>
        <View style={s.bottomActions}>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>🌐</Text>
            <Text style={s.actionText}>English (US)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionText}>$ USD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E86AB',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3C5E',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#2E86AB',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  linkColumn: {
    width: '45%',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3C5E',
    marginBottom: 4,
  },
  linkItem: {
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyright: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});
