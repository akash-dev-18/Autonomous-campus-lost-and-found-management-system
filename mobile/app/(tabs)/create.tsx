import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, X, Plus } from "lucide-react-native";
import api from "../../lib/api";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Wallet",
  "Keys",
  "Backpack",
  "Phone",
  "Laptop",
  "Watch",
  "Jewelry",
  "Other",
];

export default function CreateItem() {
  const router = useRouter();
  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(""); // Use as location_found
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = async () => {
    // Request permission first
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true, // Needed for simple upload or display, but we'll use URI for FormData in real app
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const newImages = [...images, base64Image];
      setImages(newImages);

      // AI Analysis
      analyzeImage(result.assets[0]);
    }
  };

  const analyzeImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsAnalyzing(true);
    try {
      // Create FormData for the file
      const formData = new FormData();
      // @ts-ignore: React Native FormData polyfill handles URI
      formData.append("file", {
        uri: asset.uri,
        name: "upload.jpg",
        type: "image/jpeg",
      });

      const response = await api.post("/api/v1/ai/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { category: detectedCat, tags: detectedTags, confidence } = response.data;

      if (!category || confidence > 0.4) {
        // Find closest match in our categories
        const match = CATEGORIES.find(c => c.toLowerCase() === detectedCat.toLowerCase()) || "Other";
        setCategory(match);
      }

      const newTags = [...tags];
      detectedTags.forEach((t: string) => {
         if (!newTags.includes(t.toLowerCase()) && newTags.length < 10) newTags.push(t.toLowerCase());
      });
      setTags(newTags);

      Alert.alert("AI Analysis", `Detected: ${detectedCat}. Added tags.`);
      
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !location) {
        Alert.alert("Missing Fields", "Please fill in all required fields (*)");
        return;
    }

    setIsSubmitting(true);
    try {
       await api.post("/api/v1/items/", {
           type,
           title,
           description,
           category,
           location_found: location,
           date_lost_found: date,
           tags,
           images
       });
       Alert.alert("Success", "Item reported successfully!");
       router.replace("/(tabs)");
       // Reset form...
    } catch (error: any) {
        console.error(error);
        Alert.alert("Error", "Failed to report item");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-5 py-4">
      {/* Type Selection */}
      <Text className="text-lg font-bold mb-2">Item Type *</Text>
      <View className="flex-row gap-4 mb-4">
        <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg border-2 ${
                type === 'lost' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => setType('lost')}
        >
            <Text className={type === 'lost' ? 'font-bold text-red-600' : 'text-gray-500'}>LOST</Text>
        </TouchableOpacity>
        <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg border-2 ${
                type === 'found' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => setType('found')}
        >
            <Text className={type === 'found' ? 'font-bold text-green-600' : 'text-gray-500'}>FOUND</Text>
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <Text className="label mb-1 font-medium text-gray-700">Title *</Text>
      <TextInput className="input bg-gray-100 p-3 rounded-lg mb-3" placeholder="e.g. Blue Wallet" value={title} onChangeText={setTitle} />

      <Text className="label mb-1 font-medium text-gray-700">Description *</Text>
      <TextInput
        className="input bg-gray-100 p-3 rounded-lg mb-3 h-24"
        placeholder="Detailed description..."
        multiline
        textAlignVertical="top"
        value={description}
        onChangeText={setDescription}
      />

      <Text className="label mb-1 font-medium text-gray-700">Location *</Text>
      <TextInput className="input bg-gray-100 p-3 rounded-lg mb-3" placeholder="Where was it?" value={location} onChangeText={setLocation} />

      <Text className="label mb-1 font-medium text-gray-700">Category *</Text>
       {/* Simplified Category Selection for Mobile - You could use a Modal/Picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
        {CATEGORIES.map(cat => (
           <TouchableOpacity
             key={cat}
             onPress={() => setCategory(cat)}
             className={`px-4 py-2 rounded-full mr-2 border ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
           >
              <Text className={category === cat ? 'text-white font-bold' : 'text-gray-700'}>{cat}</Text>
           </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tags */}
      <Text className="label mb-1 font-medium text-gray-700">Tags</Text>
      <View className="flex-row items-center mb-2">
         <TextInput
            className="flex-1 bg-gray-100 p-3 rounded-l-lg"
            placeholder="Add tag..."
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
         />
         <TouchableOpacity onPress={addTag} className="bg-blue-600 p-3 rounded-r-lg">
             {(() => {
                 const Icon = Plus as any;
                 return <Icon color="white" size={20} />;
             })()}
         </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap gap-2 mb-4">
          {tags.map(tag => (
              <TouchableOpacity key={tag} onPress={() => removeTag(tag)} className="bg-gray-200 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="mr-1 text-gray-700">{tag}</Text>
                  {(() => {
                      const Icon = X as any;
                      return <Icon size={14} color="#666" />;
                  })()}
              </TouchableOpacity>
          ))}
      </View>

      {/* Images */}
      <Text className="label mb-2 font-medium text-gray-700">Images {isAnalyzing && <Text className="text-blue-500 text-xs">(AI Analyzing...)</Text>}</Text>
      <ScrollView horizontal className="mb-6">
         {images.map((img, idx) => (
             <View key={idx} className="relative mr-3">
                 <Image source={{ uri: img }} className="w-24 h-24 rounded-lg bg-gray-100" />
                 <TouchableOpacity
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    onPress={() => removeImage(idx)}
                 >
                     {(() => {
                         const Icon = X as any;
                         return <Icon color="white" size={12} />;
                     })()}
                 </TouchableOpacity>
             </View>
         ))}
         {images.length < 5 && (
             <TouchableOpacity onPress={pickImage} className="w-24 h-24 bg-gray-100 rounded-lg justify-center items-center border border-dashed border-gray-300">
                 {(() => {
                    const Icon = Camera as any;
                    return <Icon color="#9CA3AF" size={24} />;
                 })()}
                 <Text className="text-xs text-gray-400 mt-1">Add Photo</Text>
             </TouchableOpacity>
         )}
      </ScrollView>

      <TouchableOpacity
        className={`bg-blue-600 py-4 rounded-xl items-center mb-10 ${isSubmitting ? 'opacity-50' : ''}`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
          {isSubmitting ? (
              <ActivityIndicator color="white" />
          ) : (
              <Text className="text-white font-bold text-lg">Report Item</Text>
          )}
      </TouchableOpacity>

    </ScrollView>
  );
}
