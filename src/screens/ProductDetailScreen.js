import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function ProductDetailScreen({ route, navigation }) {
  const { produto, dataInicio, dataFim } = route.params;

  const [inicio, setInicio] = useState(dataInicio);
  const [fim, setFim] = useState(dataFim);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrandoCalendario, setMostrandoCalendario] = useState(null);

  useEffect(() => {
    if (inicio && fim) buscarNotas();
  }, [inicio, fim]);

  const buscarNotas = () => {
    setLoading(true);
    axios.get(`http://18.191.171.80:3000/produtos/${produto.codProduto}/detalhes`, {
      params: {
        dataInicio: format(inicio, 'yyyy-MM-dd'),
        dataFim: format(fim, 'yyyy-MM-dd')
      }
    })
      .then(res => setNotasFiscais(res.data.notasFiscais || []))
      .catch(err => console.error('Erro ao buscar NFs:', err))
      .finally(() => setLoading(false));
  };

  const renderItem = ({ item }) => (
    <View style={styles.nfCard}>
      <Text style={styles.nfTexto}>NF: {item.nfNumero}</Text>
      <Text style={styles.nfTexto}>Data: {item.data}</Text>
      <Text style={styles.nfTexto}>Custo: R$ {item.custo.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botão Voltar */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>⬅️</Text>
      </TouchableOpacity>

      {/* Nome do Produto */}
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome}>{produto.produto}</Text>
        <Text style={styles.produtoCodigo}>Código: {produto.codProduto}</Text>
      </View>

      {/* Filtros de data */}
      <View style={styles.dateContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setMostrandoCalendario('inicio')}>
          <Text style={styles.dateText}>
            {inicio ? format(inicio, 'dd/MM/yyyy') : 'Data Início'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setMostrandoCalendario('fim')}>
          <Text style={styles.dateText}>
            {fim ? format(fim, 'dd/MM/yyyy') : 'Data Fim'}
          </Text>
        </TouchableOpacity>
      </View>

      {mostrandoCalendario && (
        <View style={styles.calendarioContainer}>
          <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 5 }}>
            {mostrandoCalendario === 'inicio' ? 'Selecionar Data Início' : 'Selecionar Data Fim'}
          </Text>
          <DateTimePicker
            value={(mostrandoCalendario === 'inicio' ? inicio : fim) || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant="dark"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                mostrandoCalendario === 'inicio' ? setInicio(selectedDate) : setFim(selectedDate);
              }
            }}
          />
          <TouchableOpacity onPress={() => setMostrandoCalendario(null)} style={styles.okButton}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2196f3" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notasFiscais}
          keyExtractor={(item, index) => `${item.nfNumero}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.semDados}>Nenhuma nota encontrada.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121e2d', padding: 16 },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 22,
    color: '#fff',
  },

  produtoInfo: {
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  produtoNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  produtoCodigo: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },

  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#1f2c40',
    padding: 8,
    borderRadius: 6,
    borderColor: '#2e3e55',
    borderWidth: 1,
  },
  dateText: { color: '#fff', textAlign: 'center' },

  calendarioContainer: {
    backgroundColor: '#1f2c40',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  okButton: {
    marginTop: 10,
    backgroundColor: '#2e3e55',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  nfCard: {
    backgroundColor: '#1f2c40',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  nfTexto: {
    color: '#fff',
    fontSize: 14,
  },
  semDados: {
    color: '#bbb',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
