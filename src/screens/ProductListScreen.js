import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductListScreen() {
  const [produtos, setProdutos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPickingInicio, setIsPickingInicio] = useState(true);
  const [ordenacao, setOrdenacao] = useState('alfabetica');
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);

  useEffect(() => {
    carregarFavoritos();
    carregarProdutos();
  }, []);

  const carregarFavoritos = async () => {
    const favs = await AsyncStorage.getItem('favoritos');
    setFavoritos(favs ? JSON.parse(favs) : []);
  };

  const salvarFavoritos = async (novos) => {
    setFavoritos(novos);
    await AsyncStorage.setItem('favoritos', JSON.stringify(novos));
  };

  const toggleFavorito = (codProduto) => {
    const atualizados = favoritos.includes(codProduto)
      ? favoritos.filter(c => c !== codProduto)
      : [...favoritos, codProduto];
    salvarFavoritos(atualizados);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}.${mes}.${ano}`;
  };

  const carregarProdutos = () => {
    setLoading(true);
    const params = {};
    if (dataInicio && dataFim) {
      params.dataInicio = formatDate(dataInicio);
      params.dataFim = formatDate(dataFim);
    }

    axios.get('http://192.168.15.5:3000/produtos', { params })
      .then(response => setProdutos(response.data))
      .catch(error => console.error('Erro ao carregar produtos:', error))
      .finally(() => setLoading(false));
  };

  const aplicarFiltroRapido = (dias) => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - dias);
    setDataInicio(inicio);
    setDataFim(hoje);
    setTimeout(() => carregarProdutos(), 100);
  };

  const produtosFiltrados = produtos
    .filter(item => item.produto.toLowerCase().includes(busca.toLowerCase()))
    .filter(item => !somenteFavoritos || favoritos.includes(item.codProduto))
    .sort((a, b) => {
      if (ordenacao === 'maiorMargem') return b.margemLucro - a.margemLucro;
      if (ordenacao === 'menorMargem') return a.margemLucro - b.margemLucro;
      return a.produto.localeCompare(b.produto);
    })
    .map((item, index) => ({
      ...item,
      key: `${item.codProduto}-${index}`
    }));

  const renderItem = ({ item }) => {
    const corMarkup = item.markup >= 0 ? '#00c853' : '#d32f2f';
    const corLucro = item.margemLucro >= 0 ? '#00c853' : '#d32f2f';
    const favorito = favoritos.includes(item.codProduto);

    return (
      <View style={styles.card}>
        <Text style={styles.nomeProduto}>{item.produto}</Text>
        <Text style={styles.codProduto}>#{item.codProduto}</Text>

        <View style={styles.valorContainer}>
          <Text style={styles.label}>Compra: <Text style={styles.valor}>R$ {item.precoCompra.toFixed(2)}</Text></Text>
          <Text style={styles.label}>Venda: <Text style={styles.valor}>R$ {item.precoVenda.toFixed(2)}</Text></Text>
        </View>

        <View style={styles.variacaoContainer}>
          <Text style={[styles.variacao, { color: corMarkup }]}>↗ Markup: {item.markup.toFixed(2)}%</Text>
          <Text style={[styles.variacao, { color: corLucro }]}>💰 Lucro: {item.margemLucro.toFixed(2)}%</Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorito(item.codProduto)}
          style={styles.favoritoIcon}
        >
          <Text style={{ fontSize: 20 }}>{favorito ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Produtos</Text>

      <TextInput
        style={styles.input}
        placeholder="Buscar produto..."
        value={busca}
        onChangeText={setBusca}
      />

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => { setShowDatePicker(true); setIsPickingInicio(true); }} style={styles.dateButton}>
          <Text>{dataInicio ? formatDate(dataInicio) : '📅 Data Início'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setShowDatePicker(true); setIsPickingInicio(false); }} style={styles.dateButton}>
          <Text>{dataFim ? formatDate(dataFim) : '📅 Data Fim'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={carregarProdutos} style={styles.searchButton}>
          <Text>🔍 Buscar</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        display="inline"
        themeVariant="dark" // modo escuro data
        onConfirm={(date) => {
          if (isPickingInicio) setDataInicio(date);
          else setDataFim(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <View style={styles.quickFilterContainer}>
        <TouchableOpacity onPress={() => aplicarFiltroRapido(7)} style={styles.quickFilter}>
          <Text>🕖 Últimos 7 dias</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => aplicarFiltroRapido(30)} style={styles.quickFilter}>
          <Text>📆 Últimos 30 dias</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setOrdenacao('alfabetica')} style={styles.filterButton}>
          <Text>🔤 A-Z</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOrdenacao('maiorMargem')} style={styles.filterButton}>
          <Text>📈 Maior Margem</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOrdenacao('menorMargem')} style={styles.filterButton}>
          <Text>📉 Menor Margem</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSomenteFavoritos(!somenteFavoritos)} style={styles.filterButton}>
          <Text>{somenteFavoritos ? '📦 Todos' : '⭐ Favoritos'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={produtosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', padding: 12 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    marginRight: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  searchButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickFilter: {
    backgroundColor: '#d1ecf1',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginVertical: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  nomeProduto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  codProduto: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  valorContainer: {
    flexDirection: 'column',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#555',
  },
  valor: {
    fontWeight: '600',
    color: '#222',
  },
  variacaoContainer: {
    flexDirection: 'column',
  },
  variacao: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  favoritoIcon: {
    position: 'absolute',
    bottom: 8,
    right: 10,
  },
});