import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/auth';
import api from "../../lib/api";
import * as SecureStore from 'expo-secure-store';

export default function Profile() {
  const { user, logout, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
        setPhone(user.phone_number || "");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
        const response = await api.put("/api/v1/users/me", { phone_number: phone });
        const updatedUser = response.data;
        
        // Update local auth context
        const token = await SecureStore.getItemAsync("token");
        if (token) {
            await login(token, updatedUser); // Refresh user in context
        }
        
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to update profile");
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
        <View className="flex-1 items-center p-6 pt-12">
            <View className="w-24 h-24 bg-gray-200 rounded-full mb-4 items-center justify-center overflow-hidden border-2 border-gray-100">
                {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                    <Text className="text-3xl font-bold text-gray-500">{user?.full_name?.charAt(0) || "U"}</Text>
                )}
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.full_name}</Text>
            <Text className="text-gray-500 mb-8">{user?.email}</Text>

            <View className="w-full mb-8 space-y-4">
                <View>
                    <Text className="text-gray-500 text-sm mb-1 ml-1">Full Name</Text>
                    <View className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-700">{user?.full_name}</Text>
                    </View>
                </View>

                <View>
                    <Text className="text-gray-500 text-sm mb-1 ml-1">Email Address</Text>
                    <View className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-700">{user?.email}</Text>
                    </View>
                </View>

                <View>
                    <Text className="text-gray-500 text-sm mb-1 ml-1">Phone Number</Text>
                    {isEditing ? (
                        <TextInput 
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            className="bg-white p-4 rounded-xl border border-blue-500 text-gray-900"
                            keyboardType="phone-pad"
                        />
                    ) : (
                        <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-row justify-between items-center">
                            <Text className="text-gray-700">{user?.phone_number || "Not set"}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="w-full gap-3">
                {isEditing ? (
                    <View className="flex-row gap-3">
                         <TouchableOpacity
                            className="flex-1 bg-gray-200 py-4 rounded-xl items-center"
                            onPress={() => { setIsEditing(false); setPhone(user?.phone_number || ""); }}
                            disabled={loading}
                        >
                            <Text className="text-gray-700 font-bold text-lg">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-blue-600 py-4 rounded-xl items-center"
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        className="bg-blue-600 w-full py-4 rounded-xl items-center shadow-sm"
                        onPress={() => setIsEditing(true)}
                    >
                        <Text className="text-white font-bold text-lg">Edit Profile</Text>
                    </TouchableOpacity>
                )}

                {!isEditing && (
                    <TouchableOpacity
                        className="bg-red-50 w-full py-4 rounded-xl items-center border border-red-100 mt-4"
                        onPress={logout}
                    >
                        <Text className="text-red-600 font-bold text-lg">Logout</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </ScrollView>
  );
}
