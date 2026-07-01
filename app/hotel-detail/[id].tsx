import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Hotel Detail Screen: {id}</Text>
    </View>
  );
}