import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyPricingDiscounts } from '@/components/host/screens/PropertyPricingDiscounts';

export default function PricingRoute() {
  return (
    <PropertySectionScreen title="Pricing" icon="pricetags-outline">
      {(property) => <PropertyPricingDiscounts property={property} />}
    </PropertySectionScreen>
  );
}