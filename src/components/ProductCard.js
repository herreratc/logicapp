import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProductCard({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{product.PRODUTO}</Text>
      <Text style={styles.sub}>Código: {product.CODPRODUTO}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sub: { fontSize: 14, color: '#666', marginTop: 4 },
});
