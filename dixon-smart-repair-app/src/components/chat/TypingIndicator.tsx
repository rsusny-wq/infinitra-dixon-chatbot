/**
 * TypingIndicator Component
 * Animated typing indicator for ChatGPT-style conversation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const TypingIndicator: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false, // Disable for web compatibility
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false, // Disable for web compatibility
          }),
        ]);
      };

      const animation = Animated.loop(
        Animated.parallel([
          createDotAnimation(dot1Anim, 0),
          createDotAnimation(dot2Anim, 200),
          createDotAnimation(dot3Anim, 400),
        ])
      );

      animation.start();

      return () => animation.stop();
    };

    const cleanup = animateDots();
    return cleanup;
  }, [dot1Anim, dot2Anim, dot3Anim]);

  const getDotStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.container} testID="typing-indicator">
      <View style={styles.bubble}>
        <View style={styles.content}>
          <Text style={styles.text}>Dixon Smart Repair is typing</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, getDotStyle(dot1Anim)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot2Anim)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot3Anim)]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  bubble: {
    maxWidth: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
