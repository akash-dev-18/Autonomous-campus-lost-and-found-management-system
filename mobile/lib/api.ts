import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// CHANGE THIS TO YOUR LOCAL LAN IP for physical device testing
// Run `ip addr` (Linux/Mac) or `ipconfig` (Windows) to find it.
export const API_URL = "http://172.29.48.224:8000"; 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error fetching token", error);
  }
  return config;
});

export default api;
