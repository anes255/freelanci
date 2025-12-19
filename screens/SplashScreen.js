import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Enhanced animation sequence
    Animated.sequence([
      // Phase 1: Fade in and scale with rotation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Animated glow rings */}
      <Animated.View
        style={[
          styles.glowRing,
          styles.outerRing,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                }),
              },
            ],
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.glowRing,
          styles.middleRing,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glowRing,
          styles.innerRing,
          {
            opacity: glowAnim,
            transform: [{ scale: glowAnim }],
          },
        ]}
      />
      
      {/* Logo with rotation and scale */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { rotate: spin },
          ],
        }}
      >
        <Image
          source={require('../assets/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  outerRing: {
    width: 280,
    height: 280,
  },
  middleRing: {
    width: 240,
    height: 240,
  },
  innerRing: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
