# Mobile App Testing Guide 📱

Since this is a React Native app built with Expo, you can easily test it on your physical device or an emulator.

## Prerequisites

1.  **Expo Go App**: Install "Expo Go" from the App Store (iOS) or Play Store (Android) on your phone.
2.  **Same Wi-Fi**: Ensure your phone and computer are connected to the **same Wi-Fi network**.

## Configuration (Crucial Step!)

The mobile app cannot verify `localhost` because `localhost` on the phone refers to the phone itself, not your computer. You must use your computer's **Local LAN IP Address**.

1.  **Find your Local IP**:
    - **Linux/Mac**: Run `ip addr` or `ifconfig`. Look for `inet 192.168.x.x` (usually under `wlan0` or `en0`).
    - **Windows**: Run `ipconfig`. Look for "IPv4 Address".
2.  **Update API Client**:
    - Open `mobile/lib/api.ts` (I will create this file shortly).
    - Set `BASE_URL` to `http://<YOUR_IP>:8000`.
    - Example: `export const API_URL = "http://192.168.1.15:8000";`

## Running the App

1.  Navigate to the mobile folder:

    ```bash
    cd mobile
    ```

2.  Start the development server:

    ```bash
    npx expo start
    ```

3.  **To Test**:
    - **Physical Device**: Scan the QR code displayed in the terminal using the Expo Go app (Android) or Camera app (iOS).
    - **Android Emulator**: Press `a` in the terminal (requires Android Studio).
    - **iOS Simulator**: Press `i` in the terminal (requires Xcode, Mac only).

## Troubleshooting

- **Network Error / Connection Refused**:
  - Check if your backend is running (`uvicorn ...` on port 8000).
  - Be sure you are using the **LAN IP**, not `localhost`.
  - Check your computer's firewall (allow port 8000).

- **iOS Limitations**:
  - On iOS, standard `http` requests might be blocked unless configured. Ensure you're on the same LAN works usually, but tunneling (ngrok) is an alternative if reliable.
