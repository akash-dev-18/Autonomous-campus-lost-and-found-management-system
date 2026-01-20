import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth";
import { useWebSocket } from "../../hooks/useWebSocket";
import api from "../../lib/api";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); // This is the OTHER user's ID
  const { user } = useAuth();
  const router = useRouter();
  const { sendMessage, messages: realtimeMessages } = useWebSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    fetchUserProfile();
  }, [id]);

  useEffect(() => {
    // Append real-time messages if they belong to this conversation
    if (realtimeMessages.length > 0) {
      const lastMsg = realtimeMessages[realtimeMessages.length - 1];
      if (
        (lastMsg.sender_id === id && lastMsg.receiver_id === user?.id) ||
        (lastMsg.sender_id === user?.id && lastMsg.receiver_id === id)
      ) {
         // Avoid duplicates if possible, or just append
         // specific check: is this message already in state?
         setMessages(prev => {
             const exists = prev.some(m => m.id === lastMsg.id || (m.content === lastMsg.content && m.created_at === lastMsg.created_at));
             if (exists) return prev;
             return [...prev, lastMsg];
         });
      }
    }
  }, [realtimeMessages, id, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const fetchUserProfile = async () => {
      try {
          const res = await api.get(`/api/v1/users/${id}`);
          setOtherUser(res.data);
      } catch (err) {
          console.error("Failed to fetch user profile", err);
      }
  };

  const fetchMessages = async () => {
    try {
      // Use the correct endpoint for conversation history
      const response = await api.get(`/api/v1/messages/conversations/${id}`);
      // Ensure we sort by date if backend doesn't (though usually it does)
      const sorted = response.data.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
    } catch (error) {
       console.log("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const content = inputText.trim();
    setInputText("");

    // Optimistic Update
    const tempMsg: Message = {
        id: Date.now().toString(),
        content,
        sender_id: user!.id,
        receiver_id: id as string,
        created_at: new Date().toISOString(),
        is_read: false
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
        sendMessage(id as string, content);
        // create in backend too? usually WS handles it or we call API.
        // The previous frontend `handleSendMessage` uses `api.post` AND `ws`.
        await api.post("/api/v1/messages/", {
            receiver_id: id,
            content: content
        });
    } catch (err) {
        console.error("Failed to send", err);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-100 bg-white pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
            {(() => { const Icon = ArrowLeft as any; return <Icon size={24} color="#000"/> })()}
        </TouchableOpacity>
        <View>
            <Text className="font-bold text-lg">{otherUser?.full_name || "Chat"}</Text>
            <Text className="text-xs text-gray-500">Student ID: {otherUser?.student_id || "..."}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        className="flex-1"
        renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
                <View className={`mb-3 max-w-[80%] ${isMe ? 'self-end bg-blue-600' : 'self-start bg-gray-200'} p-3 rounded-2xl`}>
                    <Text className={isMe ? 'text-white' : 'text-gray-800'}>{item.content}</Text>
                    <Text className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>
            );
        }}
      />

      {/* Input */}
      <View className="p-4 border-t border-gray-100 flex-row items-center mb-4">
        <TextInput 
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-3"
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
        />
        <TouchableOpacity onPress={handleSend} className="bg-blue-600 w-12 h-12 rounded-full justify-center items-center">
             {(() => { const Icon = Send as any; return <Icon size={20} color="white"/> })()}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
