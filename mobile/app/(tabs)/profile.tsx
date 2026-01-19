import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/auth';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
       <View className="w-24 h-24 bg-gray-200 rounded-full mb-4 items-center justify-center overflow-hidden">
           {user?.avatar ? (
               <Image source={{ uri: user.avatar }} className="w-full h-full" />
           ) : (
                <Text className="text-2xl font-bold text-gray-500">{user?.full_name?.charAt(0) || "U"}</Text>
           )}
       </View>
       
       <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.full_name}</Text>
       <Text className="text-gray-500 mb-8">{user?.email}</Text>

       <TouchableOpacity
         className="bg-red-50 w-full py-4 rounded-xl items-center border border-red-100"
         onPress={logout}
       >
           <Text className="text-red-600 font-bold text-lg">Logout</Text>
       </TouchableOpacity>
    </View>
  );
}
