import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, TextInput, StatusBar
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, isValid } from 'date-fns';
import LottieView from 'lottie-react-native';
import loadingAnim from '../../assets/animations/loading.json'; // ajuste o caminho se necessário

export default function ProductDetailScreen({ route, navigation }) {
  const { produto, dataInicioGlobal, dataFimGlobal } = route.params;

  const parseData = (data) => {
    if (!data) return null;
    const d = typeof data === 'string' ? parseISO(data) : data;
    return isValid(d) ? d : null;
  };

  const [inicio, setInicio] = useState(parseData(dataInicioGlobal));
  const [fim, setFim] = useState(parseData(dataFimGlobal));
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [notasFiltradas, setNotasFiltradas] = useState([]);
  const [buscaNF, setBuscaNF] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrandoCalendario, setMostrandoCalendario] = useState(null);

  useEffect(() => {
    if (inicio && fim) buscarNotas();
  }, [inicio, fim]);

  useEffect(() => {
    if (buscaNF.trim() === '') {
      setNotasFiltradas(notasFiscais);
    } else {
      const termo = buscaNF.trim().toLowerCase();
      const filtradas = notasFiscais.filter(nf =>
        nf.nfNumero.toString().toLowerCase().includes(termo)
      );
      setNotasFiltradas(filtradas);
    }
  }, [buscaNF, notasFiscais]);

  const buscarNotas = () => {
    setLoading(true);
    axios.get(`https://api.apilogicapp.lol/produtos/${produto.codProduto}/detalhes`, {
      params: {
        dataInicio: format(inicio, 'yyyy-MM-dd'),
        dataFim: format(fim, 'yyyy-MM-dd')
      }
    })
      .then(res => {
        const notas = res.data.notasFiscais || [];
        setNotasFiscais(notas);
        setNotasFiltradas(notas);
      })
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome}>{produto.produto}</Text>
        <Text style={styles.produtoCodigo}>Código: {produto.codProduto}</Text>
      </View>

      <TextInput
        placeholder="Buscar NF por número..."
        placeholderTextColor="#ccc"
        value={buscaNF}
        onChangeText={setBuscaNF}
        style={styles.input}
      />

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
              setMostrandoCalendario(null);
            }}
          />
        </View>
      )}

      {loading ? (
        <LottieView
          source={loadingAnim}
          autoPlay
          loop
          style={{ width: 120, height: 120, alignSelf: 'center', marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={notasFiltradas}
          keyExtractor={(item, index) => `${item.nfNumero}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.semDados}>Nenhuma nota encontrada.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121e2d',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2e3e55',
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold'
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
  },
  produtoInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  produtoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  produtoCodigo: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f2c40',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#2e3e55',
    borderWidth: 1,
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
