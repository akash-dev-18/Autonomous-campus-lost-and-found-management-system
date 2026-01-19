import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/auth";
import api from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", email); // OAuth2PasswordRequestForm expects 'username'
      formData.append("password", password);

      const response = await api.post("/api/v1/auth/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { access_token, user } = response.data;
      await login(access_token, user);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Login Failed", error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <View className="w-full max-w-sm">
        <Text className="text-3xl font-bold text-center mb-8 text-gray-900">
          Welcome Back
        </Text>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2 font-medium">Email</Text>
          <TextInput
            className="w-full bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2 font-medium">Password</Text>
          <TextInput
            className="w-full bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className={`w-full bg-blue-600 py-4 rounded-lg flex-row justify-center items-center ${
            loading ? "opacity-70" : ""
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
