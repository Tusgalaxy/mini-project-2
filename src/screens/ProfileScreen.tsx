import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../config/supabase';
import { User, Mail, Hash, ShieldCheck, LogOut } from 'lucide-react-native';

export const ProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();

      if (authData?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin trang cá nhân!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const isLecturer = profile?.role === 'LECTURER';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#2563EB" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Người dùng VKU'}</Text>
        
        {/* Badge hiển thị Role */}
        <View style={[styles.roleBadge, isLecturer ? styles.lecturerBg : styles.studentBg]}>
          <ShieldCheck size={14} color={isLecturer ? '#D97706' : '#2563EB'} />
          <Text style={[styles.roleText, { color: isLecturer ? '#D97706' : '#2563EB' }]}>
            {isLecturer ? 'Giảng viên / Cán bộ' : 'Sinh viên VKU'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Mail size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email VKU</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
        </View>

        {!isLecturer && (
          <View style={styles.infoRow}>
            <Hash size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mã sinh viên</Text>
              <Text style={styles.infoValue}>{profile?.student_id || 'N/A'}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8, gap: 6 },
  studentBg: { backgroundColor: '#EFF6FF' },
  lecturerBg: { backgroundColor: '#FEF3C7' },
  roleText: { fontSize: 13, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748B' },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#0F172A', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 12, marginTop: 'auto', gap: 8 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});