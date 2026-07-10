import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <View className="mb-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <View className="flex-row items-center gap-1.5 mb-3">
          {breadcrumb.map((item, i) => (
            <View key={i} className="flex-row items-center gap-1.5">
              {i > 0 && <Text className="text-muted-foreground text-xs">›</Text>}
              <Text className={cn(
                'text-xs',
                item.href ? 'text-muted-foreground' : 'text-foreground font-medium'
              )}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 min-w-0">
          <Text className="text-2xl font-bold text-foreground tracking-tight">{title}</Text>
          {description && <Text className="text-sm text-muted-foreground mt-1">{description}</Text>}
        </View>
        {actions && <View className="flex-row items-center gap-3 flex-shrink-0">{actions}</View>}
      </View>
    </View>
  );
}
