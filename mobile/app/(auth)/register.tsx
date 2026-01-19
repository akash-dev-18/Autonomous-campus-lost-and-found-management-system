import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import api from "../../lib/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", {
        email,
        password,
        full_name: fullName,
        role: "user", // Default role
      });

      Alert.alert("Success", "Account created! Please login.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Registration Failed", error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="bg-white px-6">
      <View className="w-full max-w-sm mx-auto">
        <Text className="text-3xl font-bold text-center mb-8 text-gray-900">
          Create Account
        </Text>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2 font-medium">Full Name</Text>
          <TextInput
            className="w-full bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className={`w-full bg-blue-600 py-4 rounded-lg flex-row justify-center items-center ${
            loading ? "opacity-70" : ""
          }`}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Creating Account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
