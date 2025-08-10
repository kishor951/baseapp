 import React from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

// Simple sparkle animation using Animated API
export default function SparkleAnimation({ visible }) {
  const sparkleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.exp),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      sparkleAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={{
          ...styles.sparkle,
          opacity: sparkleAnim,
          transform: [
            { scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }) },
            { rotate: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    height: 40,
  },
  sparkle: {
    width: 32,
    height: 32,
    backgroundColor: 'gold',
    borderRadius: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
});
