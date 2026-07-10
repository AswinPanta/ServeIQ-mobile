import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export function Pagination({ page, totalPages, totalItems, onPageChange, pageSize = 25 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 2;
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    if (left > 0) { pages.push(0); if (left > 1) pages.push('ellipsis'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) pages.push('ellipsis'); pages.push(totalPages - 1); }

    return pages;
  };

  return (
    <View className="flex-row items-center justify-between mt-4">
      <Text className="text-xs text-muted-foreground">
        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} of {totalItems}
      </Text>
      <View className="flex-row items-center gap-1">
        <TouchableOpacity
          onPress={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-30"
        >
          <Text className="text-muted-foreground text-sm">‹</Text>
        </TouchableOpacity>
        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <Text key={`e${i}`} className="h-8 w-8 text-center text-xs text-muted-foreground leading-8">...</Text>
          ) : (
            <TouchableOpacity
              key={p}
              onPress={() => onPageChange(p)}
              className={cn(
                'h-8 w-8 rounded-lg items-center justify-center',
                p === page ? 'bg-primary' : ''
              )}
            >
              <Text className={cn('text-xs font-medium', p === page ? 'text-primary-foreground' : 'text-muted-foreground')}>
                {p + 1}
              </Text>
            </TouchableOpacity>
          ),
        )}
        <TouchableOpacity
          onPress={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-30"
        >
          <Text className="text-muted-foreground text-sm">›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
