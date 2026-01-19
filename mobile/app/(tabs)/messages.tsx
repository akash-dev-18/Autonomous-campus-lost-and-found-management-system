import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import api from "../../lib/api";
import { useAuth } from "../../context/auth";
import { useWebSocket } from "../../hooks/useWebSocket";

export default function Messages() {
  const { user } = useAuth();
  const { messages: realtimeMessages, isConnected } = useWebSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/v1/messages/?user_id=${user.id}`);
      setConversations(response.data); 
    } catch (error) {
      console.error("Error fetching messages", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Merge real-time messages
  useEffect(() => {
     if (realtimeMessages.length > 0) {
         // In a real app, you'd merge these intelligently.
         // For now, we simple re-fetch to keep it synced or append.
         // Let's just trigger a re-fetch for simplicity in this MVP.
         fetchConversations();
     }
  }, [realtimeMessages]);

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">Messages</Text>
          <View className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </View>
      
      {conversations.length === 0 && !loading ? (
        <View className="flex-1 justify-center items-center">
             <Text className="text-gray-400">No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchConversations} />}
          renderItem={({ item }) => (
            <View className="bg-gray-50 p-4 rounded-lg mb-2 border border-gray-100">
               <View className="flex-row justify-between">
                   <Text className="font-bold text-gray-800">
                      {item.sender_id === user?.id ? "Me" : "User " + item.sender_id.slice(0,4)}
                   </Text>
                   <Text className="text-xs text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</Text>
               </View>
               <Text className="text-gray-600 mt-1" numberOfLines={1}>{item.content}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
