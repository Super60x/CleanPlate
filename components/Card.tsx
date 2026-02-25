import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { cardStyle } from '../constants/typography';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: cardStyle,
});
