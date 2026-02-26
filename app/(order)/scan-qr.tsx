import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useKiosk } from '@/src/store/kioskStore';

export default function ScanQrScreen() {
    const router = useRouter();
    const { searchLoyaltyByCard, setCustomerType, setLoyaltyCustomer, setCustomerName } = useKiosk();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || isProcessing) return;

        setScanned(true);
        setIsProcessing(true);
        console.log(`Bar code with type ${type} and data ${data} has been scanned!`);

        try {
            // Attempt to find customer by card/QR code
            const customer = await searchLoyaltyByCard(data);

            if (customer) {
                setCustomerType('member');
                setLoyaltyCustomer(customer);
                const fullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
                if (fullName) {
                    setCustomerName(fullName);
                }
                // Navigate to payment
                router.replace('/(order)/payment');
            } else {
                Alert.alert(
                    'Member Not Found',
                    'Could not find a member with this QR code.',
                    [
                        {
                            text: 'Try Again',
                            onPress: () => {
                                setScanned(false);
                                setIsProcessing(false);
                            }
                        },
                        {
                            text: 'Cancel',
                            onPress: () => router.back(),
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (e) {
            console.error('QR Scan Error:', e);
            Alert.alert('Error', 'An error occurred while scanning. Please try again.');
            setScanned(false);
            setIsProcessing(false);
        }
    };

    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "code128", "ean13", "ean8"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Scan Member QR</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.scanAreaContainer}>
                        <View style={styles.scanFrame} />
                        <Text style={styles.instruction}>
                            Align QR code within the frame
                        </Text>
                    </View>

                    {isProcessing && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#ff3b30" />
                            <Text style={styles.loadingText}>Searching...</Text>
                        </View>
                    )}
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
        fontSize: 18,
    },
    camera: {
        flex: 1,
    },
    button: {
        backgroundColor: '#ff3b30',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 50,
        marginBottom: 20,
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '800',
    },
    backButton: {
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        color: '#EBEBF599',
        fontWeight: '600',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    closeButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#38383A',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    scanAreaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 280,
        height: 280,
        borderWidth: 3,
        borderColor: '#ff3b30',
        backgroundColor: 'transparent',
        borderRadius: 24,
    },
    instruction: {
        color: '#fff',
        marginTop: 32,
        fontSize: 17,
        fontWeight: '700',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 19,
        fontWeight: '700',
    },
});
