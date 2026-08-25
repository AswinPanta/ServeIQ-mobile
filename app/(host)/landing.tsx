import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from "@/constants/portal-theme";
import { safeGoBack } from "@/lib/utils";
import { BRAND, WARM, TEXT, BG, CLOUD, GRAY as GRAYTokens } from '@/lib/constants/figma-tokens';
;
;

const BRAND_NAVY = BRAND.navyDark;
const BRAND_GOLD = WARM.gold;
const BRAND_CREAM = WARM.ivory;
const BRAND_TERRACOTTA = WARM.terracotta;
const BRAND_SAND = WARM.cream;
const BRAND_DARK = TEXT.ink;

const faqData = [
  { q: "Can I list a room I rent, not own?", a: "Yes — anyone with the legal right to rent out a property can host, including tenants with permission, property managers, and authorized representatives." },
  { q: "Are guests screened before they can book?", a: "Verified guests carry a badge on their profile, and we encourage hosts to prioritize them. The final call on who stays is always yours." },
  { q: "How does payout timing work?", a: "Completed stays are credited to your host wallet right away. Withdrawals are processed weekly, covering the previous Monday-through-Sunday period." },
  { q: "Can I change my price or availability later?", a: "Anytime. Pricing, calendar availability, and booking preferences are fully adjustable from your dashboard." },
  { q: "What happens if a guest cancels?", a: "Refunds follow whichever cancellation policy you've set — Flexible, Moderate, or Strict. The refunded amount goes back to the guest's wallet." },
  { q: "Can I message a guest before they book?", a: "Yes, through in-platform chat. Sharing personal contact details before a confirmed booking isn't allowed." },
];

const whyChoose = [
  { icon: "verified", title: "Verified properties", desc: "Every listing is manually reviewed and verified by our quality team before going live." },
  { icon: "star", title: "Curated experiences", desc: "Hand-picked hotels, villas and stays across 195+ countries for every type of traveller." },
  { icon: "notifications", title: "24/7 support", desc: "Dedicated support in 12 languages, wherever you are in the world." },
];

const hostingBenefits = [
  { num: "01", title: "Nothing taken off the top", desc: "No commission, no listing fee, no quiet deductions. Whatever a guest pays lands in your account in full.", accent: BRAND_TERRACOTTA },
  { num: "02", title: "Run it your way", desc: "Change your rate tonight, block off next weekend, accept or decline a booking on your own schedule.", accent: BRAND_NAVY },
  { num: "03", title: "Earn more, not just list", desc: "You're placed in front of identity-checked travelers, and we actively push your listing through our own marketing.", accent: WARM.bronzeLight },
];

const processSteps = [
  { step: "1", title: "Open an account", desc: "Sign up with email, phone, or a social login. Identity verification usually clears in under two minutes.", stat: "~2 MIN" },
  { step: "2", title: "Publish your listing", desc: "Add photos, amenities, house rules, and a price. Your space goes live and becomes searchable immediately.", stat: "~10 MIN" },
  { step: "3", title: "Get paid", desc: "Earnings land in your host wallet the moment a stay wraps up. Withdraw weekly to your linked bank account.", stat: "WEEKLY" },
];

export default function HostLandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* HERO */}
        <View style={s.hero}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backLink}>
            <IconSymbol name="arrow.back" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          <View style={s.heroContent}>
            <Text style={s.heroBadge}>
              <Text style={s.heroBadgeDot}>● </Text>
              Hosting · Open enrollment
            </Text>
            <Text style={s.heroTitle}>
              Your place,{"\n"}
              <Text style={s.heroTitleAccent}>your terms</Text>,{"\n"}
              zero cut.
            </Text>
            <Text style={s.heroDesc}>
              List your space, set your own price, and keep every rupee you earn. No commission, no fine print.
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register?portal=host")} style={s.heroCta}>
              <Text style={s.heroCtaText}>List your space</Text>
              <IconSymbol name="arrow.forward" size={14} color={BRAND_DARK} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(auth)/login?portal=host")} style={s.heroLoginLink}>
              <Text style={s.heroLoginText}>Already a host? <Text style={s.heroLoginStrong}>Log in</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WHY HOST HERE */}
        <View style={s.benefitsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>WHY HOST HERE</Text>
            <Text style={s.sectionTitle}>
              {"Hosting that doesn\u2019t take a cut\nto take an interest."}
            </Text>
          </View>

          {hostingBenefits.map((item) => (
            <View key={item.num} style={s.benefitCard}>
              <View style={[s.benefitBar, { backgroundColor: item.accent }]} />
              <Text style={[s.benefitNum, { color: item.accent }]}>{item.num}</Text>
              <Text style={s.benefitTitle}>{item.title}</Text>
              <Text style={s.benefitDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* WHY CHOOSE */}
        <View style={s.chooseSection}>
          <Text style={s.chooseLabel}>FOR YOUR FUTURE GUESTS</Text>
          <Text style={s.chooseTitle}>Why choose ServeIQ?</Text>

          {whyChoose.map((item) => (
            <View key={item.title} style={s.chooseCard}>
              <View style={s.chooseIconWrap}>
                <IconSymbol name={item.icon as any} size={18} color={BRAND_DARK} />
              </View>
              <Text style={s.chooseCardTitle}>{item.title}</Text>
              <Text style={s.chooseCardDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* PROCESS */}
        <View style={s.processSection}>
          <Text style={s.processLabel}>THE PROCESS</Text>
          <Text style={s.processTitle}>From empty room to first booking.</Text>
          <Text style={s.processSub}>Three steps, no waiting on approval calls.</Text>

          {processSteps.map((item) => (
            <View key={item.step} style={s.processStep}>
              <Text style={s.processNum}>{item.step}</Text>
              <Text style={s.processStepTitle}>{item.title}</Text>
              <Text style={s.processStepDesc}>{item.desc}</Text>
              <Text style={s.processStat}>{item.stat}</Text>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={s.faqSection}>
          <Text style={s.faqLabel}>BEFORE YOU LIST</Text>
          <Text style={s.faqTitle}>Common questions</Text>

          {faqData.map((item, i) => (
            <View key={i} style={s.faqItem}>
              <TouchableOpacity onPress={() => setOpenFaq(openFaq === i ? null : i)} style={s.faqQuestion}>
                <Text style={s.faqQText}>{item.q}</Text>
                <Text style={s.faqToggle}>{openFaq === i ? "×" : "+"}</Text>
              </TouchableOpacity>
              {openFaq === i && <Text style={s.faqAnswer}>{item.a}</Text>}
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={s.ctaSection}>
          <Text style={s.ctaTitle}>Your first guest is closer than you think.</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register?portal=host")} style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>List your space</Text>
            <IconSymbol name="arrow.forward" size={14} color={BRAND_DARK} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG.white },
  scroll: { paddingBottom: 120 },

  /* HERO */
  hero: { backgroundColor: BRAND_NAVY, paddingTop: 24, paddingBottom: 80, paddingHorizontal: 24 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  heroContent: {},
  heroBadge: { color: WARM.apricot, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 16 },
  heroBadgeDot: { fontSize: 7, color: WARM.apricot },
  heroTitle: { color: BG.white, fontSize: 36, fontWeight: '800', lineHeight: 40, marginBottom: 16 },
  heroTitleAccent: { color: WARM.peach },
  heroDesc: { color: CLOUD.vapor, fontSize: 15, lineHeight: 22, marginBottom: 28, maxWidth: 360 },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND_GOLD, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999, alignSelf: 'flex-start' },
  heroCtaText: { color: BRAND_DARK, fontWeight: '700', fontSize: 15 },
  heroLoginLink: { marginTop: 16 },
  heroLoginText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroLoginStrong: { color: BG.white, fontWeight: '700' },

  /* BENEFITS */
  benefitsSection: { backgroundColor: BRAND_CREAM, paddingVertical: 64, paddingHorizontal: 24 },
  sectionHeader: { alignItems: 'center', marginBottom: 40 },
  sectionLabel: { color: BRAND_TERRACOTTA, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  sectionTitle: { color: BRAND_NAVY, fontSize: 28, fontWeight: '700', textAlign: 'center', lineHeight: 34 },
  benefitCard: { backgroundColor: BG.white, borderRadius: 16, padding: 32, marginBottom: 16, borderWidth: 1, borderColor: BRAND_SAND },
  benefitBar: { width: '100%', height: 4, borderRadius: 2, marginBottom: 20 },
  benefitNum: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', marginBottom: 16 },
  benefitTitle: { color: BRAND_NAVY, fontSize: 20, fontWeight: '600', marginBottom: 10 },
  benefitDesc: { color: GRAY[600], fontSize: 14, lineHeight: 22 },

  /* CHOOSE */
  chooseSection: { backgroundColor: BRAND_GOLD, paddingVertical: 64, paddingHorizontal: 24 },
  chooseLabel: { color: BRAND_DARK, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  chooseTitle: { color: BRAND_DARK, fontSize: 28, fontWeight: '700', marginBottom: 32 },
  chooseCard: { backgroundColor: BRAND_DARK, borderRadius: 16, padding: 28, marginBottom: 12 },
  chooseIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND_GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chooseCardTitle: { color: BG.white, fontSize: 18, fontWeight: '600', marginBottom: 6 },
  chooseCardDesc: { color: WARM.taupe, fontSize: 13, lineHeight: 20 },

  /* PROCESS */
  processSection: { backgroundColor: BRAND_NAVY, paddingVertical: 64, paddingHorizontal: 24 },
  processLabel: { color: WARM.apricot, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  processTitle: { color: BG.white, fontSize: 26, fontWeight: '700', marginBottom: 4 },
  processSub: { color: WARM.sand, fontSize: 14, marginBottom: 32 },
  processStep: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  processNum: { color: BRAND_GOLD, fontSize: 28, fontStyle: 'italic', marginBottom: 8 },
  processStepTitle: { color: BG.white, fontSize: 18, fontWeight: '500', marginBottom: 4 },
  processStepDesc: { color: WARM.sand, fontSize: 13, lineHeight: 20 },
  processStat: { color: WARM.peach, fontSize: 11, fontFamily: 'monospace', marginTop: 8 },

  /* FAQ */
  faqSection: { paddingVertical: 64, paddingHorizontal: 24 },
  faqLabel: { color: BRAND_TERRACOTTA, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  faqTitle: { color: BRAND_NAVY, fontSize: 26, fontWeight: '700', marginBottom: 24 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20 },
  faqQText: { fontSize: 16, fontWeight: '500', color: BRAND_NAVY, flex: 1 },
  faqToggle: { color: BRAND_TERRACOTTA, fontSize: 18 },
  faqAnswer: { color: GRAY[600], fontSize: 14, lineHeight: 22, paddingBottom: 20 },

  /* CTA */
  ctaSection: { marginHorizontal: 24, backgroundColor: BRAND_NAVY, borderRadius: 20, padding: 40 },
  ctaTitle: { color: BG.white, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND_GOLD, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999, alignSelf: 'flex-start' },
  ctaBtnText: { color: BRAND_DARK, fontWeight: '700', fontSize: 15 },
});