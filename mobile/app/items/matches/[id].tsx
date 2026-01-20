import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import api from "../../../lib/api";
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react-native";

interface Match {
    id: string;
    lost_item_id: string;
    found_item_id: string;
    score: number;
    status: string;
    created_at: string;
}

export default function ItemMatches() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, [id]);

    const fetchMatches = async () => {
        try {
            const response = await api.get(`/api/v1/matches/item/${id}`);
            // Sort by score descending
            const sorted = response.data.sort((a: Match, b: Match) => b.score - a.score);
            setMatches(sorted);
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return "bg-green-500";
        if (score >= 0.5) return "bg-yellow-500";
        return "bg-gray-400";
    };

    const getScoreText = (score: number) => {
        if (score >= 0.8) return "High Confidence";
        if (score >= 0.5) return "Possible Match";
        return "Low Probability";
    };

    const renderMatch = ({ item }: { item: Match }) => {
        const percent = Math.round(item.score * 100);
        
        return (
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <View className="flex-row justify-between items-start mb-4">
                   <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            {(() => { const Icon = Sparkles as any; return <Icon size={16} color="#7C3AED" /> })()} 
                            <Text className="text-purple-700 font-bold ml-1 text-xs uppercase tracking-wider">AI Analysis</Text>
                        </View>
                        <Text className="text-gray-900 font-bold text-lg mb-1">{getScoreText(item.score)}</Text>
                        <Text className="text-gray-500 text-sm">
                            Make sure to verify details before claiming.
                        </Text>
                   </View>
                   
                   {/* Score Ring / Badge */}
                   <View className="items-center justify-center">
                        <View className={`w-14 h-14 rounded-full items-center justify-center ${item.score >= 0.8 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                             <Text className={`font-bold text-lg ${item.score >= 0.8 ? 'text-green-700' : 'text-yellow-700'}`}>
                                 {percent}%
                             </Text>
                        </View>
                   </View>
                </View>

                {/* Progress Bar */}
                <View className="h-2 bg-gray-100 rounded-full w-full mb-4 overflow-hidden">
                    <View 
                        className={`h-full rounded-full ${getScoreColor(item.score)}`} 
                        style={{ width: `${percent}%` }} 
                    />
                </View>
                
                <TouchableOpacity 
                    className="bg-gray-900 py-3 rounded-xl items-center flex-row justify-center"
                    onPress={() => {
                       const otherId = item.lost_item_id === id ? item.found_item_id : item.lost_item_id;
                       router.push(`/items/${otherId}`);
                    }}
                >
                    <Text className="text-white font-bold mr-2">View Item Details</Text>
                    {(() => { const Icon = UtilIcon as any; return <Icon size={18} color="white" /> })()}
                </TouchableOpacity>
            </View>
        );
    };

    // Helper for icon
    const UtilIcon = CheckCircle2;

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
             <View className="bg-white p-4 pt-12 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    {(() => { const Icon = ArrowLeft as any; return <Icon size={24} color="black" /> })()}
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-bold">AI Matches</Text>
                    <Text className="text-gray-500 text-xs">Powered by SmartMatch™</Text>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="text-gray-400 mt-4 font-medium">Analyzing patterns...</Text>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    renderItem={renderMatch}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center mt-20 px-8">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                               {(() => { const Icon = AlertCircle as any; return <Icon size={40} color="#9CA3AF" /> })()}
                            </View>
                            <Text className="text-gray-900 font-bold text-lg mb-2">No Matches Found Yet</Text>
                            <Text className="text-gray-500 text-center leading-6">
                                We haven't found any items that match yours closely enough right now. 
                                Our AI will continue scanning as new items are posted.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
