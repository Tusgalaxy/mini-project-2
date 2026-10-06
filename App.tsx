import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/config/supabase';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AuthScreen } from './src/screens/AuthScreen';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra phiên đăng nhập hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe sự thay đổi trạng thái Auth (Đăng nhập / Đăng xuất)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session && session.user ? (
        <TabNavigator />
      ) : (
        <AuthScreen onAuthSuccess={() => {}} />
      )}
    </NavigationContainer>
  );
}