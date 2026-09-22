import React from 'react';
import { View } from 'react-native';
import { safeGoBack } from '@/lib/utils';
import { PaymentCheckoutModal } from '@/components/feature/payment-checkout-modal';
import { EsewaFormCheckout } from '@/components/feature/esewa-form-checkout';
import { EsewaMockCheckout } from '@/components/feature/esewa-mock-checkout';
import { SdkPaymentCheckout } from '@/components/feature/sdk-payment-checkout';
import { useBookingFlow } from '@/hooks/use-booking-flow';
import { BookingHeader, ProgressHeader, StepRooms, StepDetails, StepPayment, BottomBar, LoginGate } from '@/components/booking/steps';
import { styles } from '@/components/booking/styles';

export default function BookingFlowScreen() {
  const flow = useBookingFlow();

  if (!flow.user) {
    return (
      <View style={styles.container}>
        <BookingHeader onBack={() => safeGoBack()} />
        <LoginGate
          onLogin={flow.openLogin}
          onRegister={flow.openRegister}
          onBack={() => safeGoBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BookingHeader onBack={() => safeGoBack()} />

      <ProgressHeader stepLabels={flow.stepLabels} displayStep={flow.displayStep} />

      {flow.step === 0 && (
        <StepRooms
          isLoading={flow.isLoading}
          roomsError={flow.roomsError}
          availableRooms={flow.availableRooms}
          selectedRooms={flow.selectedRooms}
          nights={flow.nights}
          currency={flow.currency}
          onRetry={flow.onRetry}
          onToggleRoom={flow.onToggleRoom}
          onUpdateQuantity={flow.onUpdateQuantity}
        />
      )}
      {flow.step === 1 && (
        <StepDetails
          selectedRooms={flow.selectedRooms}
          nights={flow.nights}
          currency={flow.currency}
          guestInfo={flow.guestInfo}
          guestErrors={flow.guestErrors}
          onFieldChange={flow.onFieldChange}
          onClearError={flow.onClearError}
          onChangeRoom={flow.onChangeRoom}
        />
      )}
      {flow.step === 2 && (
        <StepPayment
          appliedPromo={flow.appliedPromo}
          promoCode={flow.promoCode}
          onPromoCodeChange={flow.onPromoCodeChange}
          onApplyPromo={flow.onApplyPromo}
          promoLoading={flow.promoLoading}
          onClearPromo={flow.onClearPromo}
          selectedRooms={flow.selectedRooms}
          nights={flow.nights}
          currency={flow.currency}
          promoDiscount={flow.promoDiscount}
          total={flow.total}
          checkIn={flow.checkIn}
          paymentMethod={flow.paymentMethod}
          onSelectPaymentMethod={flow.onSelectPaymentMethod}
          paymentMode={flow.paymentMode}
          onSelectPaymentMode={flow.onSelectPaymentMode}
          advanceAmount={flow.advanceAmount}
          onChangeAdvanceAmount={flow.onChangeAdvanceAmount}
        />
      )}

      <BottomBar
        step={flow.step}
        total={flow.total}
        currency={flow.currency}
        isSubmitting={flow.isSubmitting}
        isProcessing={flow.isProcessing}
        onBack={flow.onBack}
        onNext={flow.onNext}
        onComplete={flow.onComplete}
      />

      {/* Hosted gateway checkout — opens only for real payments */}
      {flow.checkout && !!flow.checkout.url && (
        <PaymentCheckoutModal
          visible
          paymentUrl={flow.checkout.url}
          returnUrlPrefix={flow.returnUrlPrefix}
          gatewayName={flow.checkout.gateway}
          onComplete={flow.handleCheckoutComplete}
          onCancel={flow.handleCheckoutCancel}
        />
      )}

      {/* eSewa sandbox checkout — only when the backend returns no live form
          (merchant credentials absent); mimics the wallet flow locally while
          confirm still verifies server-side. */}
      {flow.checkout && !flow.checkout.url && flow.checkout.gateway === 'eSewa' && (
        <EsewaMockCheckout
          visible
          amount={flow.total}
          currency={flow.currency}
          onComplete={flow.handleCheckoutComplete}
          onCancel={flow.handleCheckoutCancel}
        />
      )}

      {/* eSewa live form checkout — the backend returned an HMAC-signed
          form_url + form_fields, so we auto-POST them in a WebView and hand
          the redirect's `data` back to confirm. */}
      {flow.esewaCheckout && (
        <EsewaFormCheckout
          visible
          formUrl={flow.esewaCheckout.formUrl}
          formFields={flow.esewaCheckout.formFields}
          returnUrlPrefix={flow.returnUrlPrefix}
          onComplete={flow.handleEsewaComplete}
          onCancel={flow.handleEsewaCancel}
        />
      )}

      {/* Native-SDK gateway checkout — Stripe PaymentSheet / Razorpay sheet.
          Opens only for real payments in a development build. */}
      {flow.sdkCheckout && (
        <SdkPaymentCheckout
          visible
          gateway={flow.sdkCheckout.gateway}
          options={flow.sdkCheckout.options}
          onComplete={flow.handleSdkComplete}
          onCancel={flow.handleSdkCancel}
        />
      )}
    </View>
  );
}
