import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { CompanyProfileSection } from '@/components/host/settings/CompanyProfileSection';

export default function SettingsCompanyRoute() {
  return (
    <PropertySectionScreen title="Company Profile" icon="business-outline">
      {(property) => <CompanyProfileSection property={property} />}
    </PropertySectionScreen>
  );
}