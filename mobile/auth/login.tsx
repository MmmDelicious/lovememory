import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Heart, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // TODO: Implement login logic
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google login
    console.log('Google login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Heart size={32} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>Войди в свой аккаунт LoveMemory</Text>
        </Animated.View>

        {/* Login Form */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color="#8C7F7D" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B8A8A4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#8C7F7D" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                placeholderTextColor="#B8A8A4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#8C7F7D" strokeWidth={2} />
                ) : (
                  <Eye size={20} color="#8C7F7D" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#D97A6C', '#E89F93']}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <Text style={styles.loginButtonText}>Входим...</Text>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Войти</Text>
                    <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>или</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Войти через Google</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={BounceIn.delay(400)} style={styles.footer}>
          <Text style={styles.footerText}>Нет аккаунта? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D97A6C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2E9E8',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#4A3F3D',
    paddingVertical: 16,
  },
  passwordToggle: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#D97A6C',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F2E9E8',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#B8A8A4',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F2E9E8',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
  },
});