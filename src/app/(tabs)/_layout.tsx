import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, Font, Icon } from '@/constants/theme';
import { Home, Dumbbell, Utensils, Droplets, User } from 'lucide-react-native';

export default function TabsLayout() {
  // Cross-fade calmo ao trocar de aba; desligado quando o usuário pede
  // "Reduzir movimento" no sistema (exigência de acessibilidade nativa).
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        animation: reduceMotion ? 'none' : 'fade',
        sceneStyle: { backgroundColor: Colors.background },
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: Colors.border,
          borderBottomWidth: 1,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontFamily: Font.semibold,
          fontSize: 18,
          color: Colors.text,
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Font.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          headerTitle: 'VitalTrack',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={Icon.stroke} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} strokeWidth={Icon.stroke} />,
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Dieta',
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} strokeWidth={Icon.stroke} />,
        }}
      />
      <Tabs.Screen
        name="water"
        options={{
          title: 'Hidratação',
          tabBarIcon: ({ color, size }) => <Droplets color={color} size={size} strokeWidth={Icon.stroke} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={Icon.stroke} />,
        }}
      />
    </Tabs>
  );
}
