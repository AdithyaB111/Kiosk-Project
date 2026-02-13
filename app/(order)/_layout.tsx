import { Stack } from "expo-router";

export default function OrderLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#0f0f13" },
            }}
        />
    );
}
