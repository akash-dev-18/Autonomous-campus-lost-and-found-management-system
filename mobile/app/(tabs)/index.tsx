import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Search, MapPin, Calendar, Tag } from "lucide-react-native";
import api from "../../lib/api";
import { Item } from "../../lib/types";

export default function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const router = useRouter();

  const fetchItems = async () => {
    try {
      const response = await api.get("/api/v1/items/");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filteredItems = items.filter((item) => {
    const matchesTab = item.type === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-100"
      onPress={() => {
        // Navigate to detail page (create [id].tsx separately if needed, or simple alert for now)
      }}
    >
      <View className="flex-row">
        {/* Image Thumbnail */}
        <Image
          source={{
            uri: item.images[0] || "https://placehold.co/100x100?text=No+Image",
          }}
          className="w-24 h-24 bg-gray-200"
          resizeMode="cover"
        />
        
        {/* Content */}
        <View className="flex-1 p-3 justify-between">
          <View>
              <Text className="font-bold text-lg text-gray-900" numberOfLines={1}>
              {item.title}
            </Text>
            <View className="flex-row items-center mt-1">
              {(() => {
                 const Icon = MapPin as any;
                 return <Icon size={12} color="#6B7280" />;
              })()}
              <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                {item.location_found || item.category}
              </Text>
            </View>
          </View>
          
          <View className="flex-row flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 2).map((tag, idx) => (
              <View key={idx} className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-gray-600 text-[10px] capitalize">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Date / Status Tag */}
        <View className="absolute top-2 right-2">
           <View className={`px-2 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-100' : 'bg-green-100'}`}>
              <Text className={`text-xs font-bold ${item.type === 'lost' ? 'text-red-700' : 'text-green-700'}`}>
                {item.type.toUpperCase()}
              </Text>
           </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      {/* Search Bar */}
      <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200 mb-4 shadow-sm">
        {(() => {
            const Icon = Search as any;
            return <Icon size={20} color="#9CA3AF" />;
        })()}
        <TextInput
          className="flex-1 ml-3 text-base text-gray-900"
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row mb-4 bg-gray-200 p-1 rounded-lg">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-md items-center ${
            activeTab === "lost" ? "bg-white shadow-sm" : ""
          }`}
          onPress={() => setActiveTab("lost")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "lost" ? "text-red-600" : "text-gray-500"
            }`}
          >
            Lost
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-md items-center ${
            activeTab === "found" ? "bg-white shadow-sm" : ""
          }`}
          onPress={() => setActiveTab("found")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "found" ? "text-green-600" : "text-gray-500"
            }`}
          >
            Found
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-gray-400">No items found.</Text>
          </View>
        }
      />
    </View>
  );
}
