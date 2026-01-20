import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../context/auth';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
      return <View className="flex-1 justify-center items-center"><Text>Loading...</Text></View>;
  }

  if (user) {
      return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
