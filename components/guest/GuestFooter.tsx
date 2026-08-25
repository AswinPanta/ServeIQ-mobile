import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, Image } from 'react-native';
import { useAppLanguage } from '@/hooks/use-app-language';
import { NEUTRAL, SLATE, SRS, BRAND, BG, TEXT, CORAL } from '@/lib/constants/figma-tokens';

const FOOTER_LINKS = {
  Support: ['Help Center', 'AirCover', 'Safety information', 'Supporting people with disabilities', 'Cancellation options'],
  Hosting: ['Try hosting', 'AirCover for Hosts', 'Explore hosting resources', 'Visit our community forum', 'Responsible hosting'],
  ServeIQ: ['Newsroom', 'Features', 'Careers', 'Investors', 'Pricing & Plans'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Sitemap', 'Company details'],
};

export function GuestFooter() {
  const { language, setLanguage, availableLanguages } = useAppLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

  return (
    <View style={s.container}>
      {/* Brand */}
      <View style={s.brandRow}>
        <Image source={require('@/assets/images/serveiq-logo.png')} style={s.logoImage} />
        <Text style={s.brandName}>
          Serve<Text style={s.brandAccent}>IQ</Text>
        </Text>
      </View>

      {/* Tagline */}
      <Text style={s.tagline}>Service with Intelligence and Quality</Text>

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
        <Text style={s.copyright}>© 2026 ServeIQ, Inc. All rights reserved.</Text>
        <View style={s.bottomActions}>
          <Pressable style={s.actionBtn} onPress={() => setShowLangPicker(true)}>
            <Text style={s.actionIcon}>🌐</Text>
            <Text style={s.actionText}>
              {availableLanguages.find(l => l.code === language)?.label ?? 'English'}
            </Text>
          </Pressable>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionText}>$ USD</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowLangPicker(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={s.modalTitle}>Select Language</Text>
            <ScrollView>
              {availableLanguages.map(lang => (
                <Pressable
                  key={lang.code}
                  style={s.langRow}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                >
                  <Text style={[s.langLabel, language === lang.code && s.langLabelActive]}>
                    {lang.label}
                  </Text>
                  {language === lang.code && <Text style={s.langCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: NEUTRAL[50],
    borderTopWidth: 1,
    borderTopColor: SLATE[100],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.navyLight,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: SRS.teal,
  },
  tagline: {
    fontSize: 12,
    color: SLATE[400],
    marginBottom: 24,
    fontStyle: 'italic',
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
    color: BRAND.navyLight,
    marginBottom: 4,
  },
  linkItem: {
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 12,
    color: SLATE[500],
  },
  divider: {
    height: 1,
    backgroundColor: SLATE[200],
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
    color: SLATE[400],
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
    color: SLATE[600],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: BG.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  langLabel: {
    fontSize: 15,
    color: SLATE[700],
  },
  langLabelActive: {
    color: CORAL[500],
    fontWeight: '600',
  },
  langCheck: {
    fontSize: 16,
    color: CORAL[500],
    fontWeight: '700',
  },
});
