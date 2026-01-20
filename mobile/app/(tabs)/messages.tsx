import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, MessageSquare } from "lucide-react-native";
import api from "../../lib/api";
import { useAuth } from "../../context/auth";
import { useWebSocket } from "../../hooks/useWebSocket";

// Types
type Conversation = {
    user: { id: string; full_name: string; avatar?: string; email: string };
    last_message: { content: string; created_at: string; is_read: boolean };
    unread_count: number;
};

export default function Messages() {
  const { user } = useAuth();
  const { messages: realtimeMessages } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const router = useRouter();

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/v1/messages/conversations`);
      // Adapt the response if needed. 
      // If backend returns list of dictionaries, ensure it matches Conversation type.
      // Backend returns: List[dict] from get_conversations_list
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
         fetchConversations();
     }
  }, [realtimeMessages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white border-b border-gray-100"
      onPress={() => router.push(`/chat/${item.user.id}`)}
    >
      <View className="w-12 h-12 bg-gray-200 rounded-full justify-center items-center">
        {item.user.avatar ? (
            <Image source={{ uri: item.user.avatar }} className="w-12 h-12 rounded-full" />
        ) : (
             <View className="w-full h-full bg-gray-300 rounded-full justify-center items-center">
                <Text className="font-bold text-gray-600">{item.user.full_name[0]}</Text>
             </View>
        )}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between">
          <Text className="font-bold text-gray-900">{item.user.full_name}</Text>
          <Text className="text-xs text-gray-500">
            {new Date(item.last_message.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text className="text-gray-600 mt-1" numberOfLines={1}>
          {item.last_message.content}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View className="bg-blue-600 rounded-full w-6 h-6 justify-center items-center ml-2">
           <Text className="text-white text-xs font-bold">{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-100 bg-white pt-12">
          <Text className="text-2xl font-bold">Messages</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.user.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-500">No messages yet</Text>
          </View>
        }
      />

      <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => setShowUserSearch(true)}
      >
        {(() => { const Icon = MessageSquare as any; return <Icon size={24} color="white" /> })()}
      </TouchableOpacity>

      <Modal visible={showUserSearch} animationType="slide" presentationStyle="pageSheet">
         <UserSearchModal onClose={() => setShowUserSearch(false)} onSelect={(userId) => {
             setShowUserSearch(false);
             router.push(`/chat/${userId}`);
         }} />
      </Modal>
    </View>
  );
}

// Simple User Search Modal Component
function UserSearchModal({ onClose, onSelect }: { onClose: () => void, onSelect: (id: string) => void }) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) { setUsers([]); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/v1/users/"); 
                // Using 'any' for the user object to avoid strict type checks on missing fields
                const filtered = res.data.filter((u:any) => 
                     (u.full_name || "").toLowerCase().includes(query.toLowerCase()) || 
                     (u.email || "").toLowerCase().includes(query.toLowerCase())
                );
                setUsers(filtered);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <View className="flex-1 bg-white p-4 pt-10">
            <View className="flex-row justify-between items-center mb-4 mt-2">
                <Text className="text-xl font-bold">New Chat</Text>
                <TouchableOpacity onPress={onClose}><Text className="text-blue-600 font-bold">Close</Text></TouchableOpacity>
            </View>
            <TextInput 
                className="bg-gray-100 p-3 rounded-lg mb-4"
                placeholder="Search users by name or email..."
                value={query}
                onChangeText={setQuery}
                autoFocus
            />
            {loading && <ActivityIndicator />}
            <FlatList 
                data={users}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => onSelect(item.id)}>
                        <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center mr-3">
                             {item.avatar ? <Image source={{ uri: item.avatar }} className="w-10 h-10 rounded-full" /> : <Text className="font-bold">{item.full_name ? item.full_name[0] : "?"}</Text>}
                        </View>
                        <View>
                            <Text className="font-bold">{item.full_name}</Text>
                            <Text className="text-gray-500 text-xs">{item.email}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}
