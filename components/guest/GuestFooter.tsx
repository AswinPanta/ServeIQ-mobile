import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useAppLanguage } from '@/hooks/use-app-language';

const FOOTER_LINKS = {
  Support: ['Help Center', 'AirCover', 'Safety information', 'Supporting people with disabilities', 'Cancellation options'],
  Hosting: ['Try hosting', 'AirCover for Hosts', 'Explore hosting resources', 'Visit our community forum', 'Responsible hosting'],
  StayEasy: ['Newsroom', 'Features', 'Careers', 'Investors', 'Pricing & Plans'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Sitemap', 'Company details'],
};

export function GuestFooter() {
  const { language, setLanguage, availableLanguages } = useAppLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A3C5E',
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
    borderBottomColor: '#F1F5F9',
  },
  langLabel: {
    fontSize: 15,
    color: '#334155',
  },
  langLabelActive: {
    color: '#E63946',
    fontWeight: '600',
  },
  langCheck: {
    fontSize: 16,
    color: '#E63946',
    fontWeight: '700',
  },
});
