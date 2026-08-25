import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Dumbbell, Utensils, User } from 'lucide-react-native';

/* Borda de vidro translúcida para header e tab bar, alinhada ao hero. */
const GLASS_BORDER = 'rgba(255, 255, 255, 0.10)';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: GLASS_BORDER,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontFamily: 'Poppins_700Bold',
          fontSize: 18,
          color: Colors.text,
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: GLASS_BORDER,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Dieta',
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
