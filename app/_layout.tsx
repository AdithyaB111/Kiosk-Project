import { Stack } from "expo-router";
import "../global.css";
import { KioskProvider } from "@/src/store/kioskStore";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <KioskProvider>
      <StatusBar style="light" hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#0f0f13" },
        }}
      />
    </KioskProvider>
  );
}
