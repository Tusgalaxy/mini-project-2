import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../config/supabase';
import { User, Lock, Mail, Hash, ArrowLeft } from 'lucide-react-native';

export const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate định dạng email VKU
  const validateVKUEmail = (emailInput: string) => {
    return /^[a-zA-Z0-9._%+-]+@vku\.udn\.vn$/i.test(emailInput.trim());
  };

  // 1. Xử lý Đăng ký tài khoản mới (Không qua OTP)
  const handleSignUp = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !fullName) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    if (!validateVKUEmail(cleanEmail)) {
      Alert.alert('Lỗi Email', 'Vui lòng sử dụng Email VKU chính thức (@vku.udn.vn)!');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải chứa ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId || 'N/A',
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Thành công',
        'Tạo tài khoản VKU thành công! Chuyển sang màn hình đăng nhập.',
        [{ text: 'Đồng ý', onPress: () => setMode('LOGIN') }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi đăng ký', err.message || 'Không thể tạo tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý Đăng nhập
  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập Email và Mật khẩu!');
      return;
    }

    if (!validateVKUEmail(cleanEmail)) {
      Alert.alert('Lỗi Email', 'Vui lòng dùng Email VKU chính thức (@vku.udn.vn)!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        Alert.alert('Đăng nhập thất bại', 'Email hoặc Mật khẩu không chính xác!');
        return;
      }

      onAuthSuccess();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Quên mật khẩu
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !validateVKUEmail(cleanEmail)) {
      Alert.alert('Thông báo', 'Vui lòng nhập đúng Email VKU chính thức!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;

      Alert.alert('Đã gửi yêu cầu', `Link khôi phục mật khẩu đã được gửi tới ${cleanEmail}.`);
      setMode('LOGIN');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        {mode === 'FORGOT_PASSWORD' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setMode('LOGIN')}>
            <ArrowLeft size={20} color="#2563EB" />
            <Text style={styles.backText}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>
          {mode === 'LOGIN' && 'Đăng Nhập VKU'}
          {mode === 'SIGNUP' && 'Đăng Ký Tài Khoản'}
          {mode === 'FORGOT_PASSWORD' && 'Quên Mật Khẩu'}
        </Text>

        <Text style={styles.subtitle}>
          {mode === 'FORGOT_PASSWORD'
            ? 'Nhập Email VKU để lấy lại mật khẩu'
            : 'Sử dụng Email sinh viên/giảng viên (@vku.udn.vn)'}
        </Text>

        {mode === 'SIGNUP' && (
          <>
            <View style={styles.inputContainer}>
              <User size={20} color="#64748B" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Hash size={20} color="#64748B" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mã sinh viên (Bỏ trống nếu là Giảng viên)"
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="characters"
              />
            </View>
          </>
        )}

        <View style={styles.inputContainer}>
          <Mail size={20} color="#64748B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email VKU (...@vku.udn.vn)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {mode !== 'FORGOT_PASSWORD' && (
          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748B" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        )}

        {mode === 'LOGIN' && (
          <TouchableOpacity style={styles.forgotBtn} onPress={() => setMode('FORGOT_PASSWORD')}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={
            mode === 'LOGIN'
              ? handleLogin
              : mode === 'SIGNUP'
              ? handleSignUp
              : handleForgotPassword
          }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'LOGIN' && 'Đăng Nhập'}
              {mode === 'SIGNUP' && 'Đăng Ký Tài Khoản'}
              {mode === 'FORGOT_PASSWORD' && 'Gửi Yêu Cầu'}
            </Text>
          )}
        </TouchableOpacity>

        {mode !== 'FORGOT_PASSWORD' && (
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
          >
            <Text style={styles.switchText}>
              {mode === 'LOGIN' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 3 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: '#2563EB', fontSize: 14, fontWeight: '500', marginLeft: 6 },
  title: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, marginBottom: 14, height: 48 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
  button: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#2563EB', fontSize: 14, fontWeight: '500' },
});