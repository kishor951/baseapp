import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 1000);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>WorkSight!</Text>
        <View style={styles.dotContainer}>
          <Animated.View style={[styles.dot, { transform: [{ scale: fadeAnim }] }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 20,
    textAlign: 'center',
  },
  dotContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976d2',
  },
});
