import { useColorScheme } from 'react-native';

export function useColors() {
  const scheme = useColorScheme();
  return { scheme, colors: { primary: '#007AFF' } };
}