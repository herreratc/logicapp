import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';

export default function ProductDetailScreen({ route }) {
  const { codProduto } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://192.168.15.5:3000/produto/${codProduto}`) // ← Atualize com seu IP
      .then(response => setDetail(response.data))
      .catch(error => console.error('Erro carregando detalhes:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (!detail) return <Text>Erro ao carregar detalhes</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{detail.produto}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Última Compra:</Text>
        <Text style={styles.value}>R$ {detail.ultimaCompra.toFixed(2)} - {detail.dataUltimaCompra}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Última Venda:</Text>
        <Text style={styles.value}>R$ {detail.ultimaVenda.toFixed(2)} - {detail.dataUltimaVenda}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Markup:</Text>
        <Text style={styles.value}>{detail.markup}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Margem de Lucro:</Text>
        <Text style={styles.value}>{detail.margemLucro}%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 15 },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 18, fontWeight: 'bold' },
});
