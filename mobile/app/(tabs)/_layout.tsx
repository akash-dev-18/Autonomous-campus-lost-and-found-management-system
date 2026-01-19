import { Tabs } from "expo-router";
import { Home, PlusCircle, MessageSquare, User, LogOut } from "lucide-react-native";
import { TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../context/auth";

export default function TabLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} className="mr-4">
             {(() => {
                 const Icon = LogOut as any;
                 return <Icon color="red" size={24} />;
             })()}
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Items",
          tabBarIcon: ({ color }) => {
            const Icon = Home as any;
            return <Icon color={color} size={24} />;
          },
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Report",
          tabBarIcon: ({ color }) => {
             const Icon = PlusCircle as any;
             return <Icon color={color} size={24} />;
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => {
             const Icon = MessageSquare as any;
             return <Icon color={color} size={24} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => {
             const Icon = User as any;
             return <Icon color={color} size={24} />;
          },
        }}
      />
    </Tabs>
  );
}
