import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, Share, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MapPin, MessageCircle, Share2, CheckCircle, ArrowLeft } from "lucide-react-native";
import api from "../../lib/api";
import { useAuth } from "../../context/auth";
import { Item } from "../../lib/types";

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await api.get(`/api/v1/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error("Error fetching item details:", error);
      Alert.alert("Error", "Could not load item details.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `Check out this ${item.type} item: ${item.title} - ${item.description}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChat = () => {
    if (!item || !user) return;
    if (item.user_id === user.id) {
        Alert.alert("Info", "This is your own item.");
        return;
    }
    router.push(`/chat/${item.user_id}`);
  };

  const handleClaim = async () => {
      // Logic for claiming found items
      // backend might need a specific endpoint like /items/{id}/claim
      // For now we'll assume a resolving flow or just messaging.
      // If the user lost an item, and this is a "found" item, they might want to claim it.
      Alert.alert("Claim Item", "To claim this item, please start a chat with the finder to verify ownership.", [
          { text: "Cancel", style: "cancel" },
          { text: "Chat with Finder", onPress: handleChat }
      ]);
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!item) {
    return <View className="flex-1 justify-center items-center"><Text>Item not found</Text></View>;
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Image */}
      <View className="relative">
          <Image
            source={{ uri: (item.images && item.images.length > 0) ? item.images[0] : "https://placehold.co/400x300?text=No+Image" }}
            className="w-full h-72 bg-gray-200"
            resizeMode="cover"
          />
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full justify-center items-center"
          >
              {(() => { const Icon = ArrowLeft as any; return <Icon size={24} color="white" /> })()}
          </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-8">
        {/* Title & Status */}
        <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
                <Text className="text-2xl font-bold text-gray-900">{item.title}</Text>
                <View className="flex-row items-center mt-2">
                    {(() => { const Icon = MapPin as any; return <Icon size={16} color="#6B7280" /> })()}
                    <Text className="text-gray-500 ml-1">{item.location_found || "Unknown Location"}</Text>
                </View>
            </View>
            <View className={`px-3 py-1 rounded-full ${item.status === 'closed' ? 'bg-gray-200' : (item.type === 'lost' ? 'bg-red-100' : 'bg-green-100')}`}>
                <Text className={`font-bold ${item.status === 'closed' ? 'text-gray-600' : (item.type === 'lost' ? 'text-red-700' : 'text-green-700')}`}>
                    {item.status === 'closed' ? 'RESOLVED' : item.type.toUpperCase()}
                </Text>
            </View>
        </View>

        {/* Description */}
        <Text className="text-gray-600 text-base leading-6 mb-6">
            {item.description}
        </Text>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-8">
            {item.tags?.map((tag, idx) => (
                <View key={idx} className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 capitalize">{tag}</Text>
                </View>
            ))}
        </View>

        {/* Date */}
        <View className="border-t border-gray-100 py-4 mb-20">
            <Text className="text-gray-400 text-sm">Posted on {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex-row gap-3 pb-8">
         <TouchableOpacity 
            onPress={handleShare}
            className="w-14 h-14 bg-gray-100 rounded-xl justify-center items-center"
         >
             {(() => { const Icon = Share2 as any; return <Icon size={24} color="#374151" /> })()}
         </TouchableOpacity>

         {item.user_id !== user?.id ? (
             <>
                <TouchableOpacity 
                    onPress={handleChat}
                    className="flex-1 bg-blue-600 rounded-xl justify-center items-center flex-row"
                >
                    {(() => { const Icon = MessageCircle as any; return <Icon size={20} color="white" /> })()}
                    <Text className="text-white font-bold text-lg ml-2">Chat</Text>
                </TouchableOpacity>

                {item.type === 'found' && item.status === 'active' && (
                     <TouchableOpacity 
                        onPress={handleClaim}
                        className="flex-1 bg-green-600 rounded-xl justify-center items-center flex-row"
                     >
                        {(() => { const Icon = CheckCircle as any; return <Icon size={20} color="white" /> })()}
                        <Text className="text-white font-bold text-lg ml-2">Claim</Text>
                     </TouchableOpacity>
                )}
             </>
         ) : (
            <View className="flex-1 flex-row gap-2">
                <View className="flex-1 bg-gray-100 rounded-xl justify-center items-center p-4">
                    <Text className="text-gray-500 font-bold">Your Item</Text>
                </View>
                {item.status === 'active' && (
                  <>
                    <TouchableOpacity 
                        onPress={() => router.push(`/items/matches/${item.id}`)}
                        className="flex-1 bg-purple-600 rounded-xl justify-center items-center mr-2 p-2"
                    >
                        <Text className="text-white font-bold text-center">AI Matches</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={async () => {
                            try {
                                setLoading(true); 
                                await api.put(`/api/v1/items/${item.id}`, { status: 'closed' });
                                Alert.alert("Success", "Item marked as resolved!");
                                fetchItemDetails(); 
                            } catch (err) {
                                Alert.alert("Error", "Failed to update status");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="flex-1 bg-green-600 rounded-xl justify-center items-center"
                    >
                        <Text className="text-white font-bold text-lg">Resolve</Text>
                    </TouchableOpacity>
                  </>
                )}
            </View>
         )}
      </View>
    </View>
  );
}
