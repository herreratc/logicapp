import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Platform, Animated, Easing
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import loadingAnim from '../../assets/animations/loading.json';
import logo from '../../assets/logo.png';
import userIcon from '../../assets/icons/user.png';

export default function ProductListScreen() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(new Date());
  const [mostrandoCalendario, setMostrandoCalendario] = useState(null);
  const [ordenacao, setOrdenacao] = useState('alfabetica');
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [usuario, setUsuario] = useState('');

  const navigation = useNavigation();
  const logoAnim = useState(new Animated.Value(0))[0];
  const userAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    carregarProdutos();
    obterUsuarioSalvo();
  }, [dataInicio, dataFim]);

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(userAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const obterUsuarioSalvo = async () => {
    const nomeSalvo = await AsyncStorage.getItem('usuarioSalvo');
    if (nomeSalvo) {
      const nomeFormatado = nomeSalvo.charAt(0).toUpperCase() + nomeSalvo.slice(1);
      setUsuario(nomeFormatado);
    }
  };

  const sair = async () => {
    await AsyncStorage.removeItem('usuarioSalvo');
    navigation.replace('Splash');
  };

  const carregarProdutos = () => {
    setLoading(true);
    const params = {};
    if (dataInicio && dataFim) {
      params.dataInicio = format(dataInicio, 'dd.MM.yyyy');
      params.dataFim = format(dataFim, 'dd.MM.yyyy');
    }

    axios.get('https://api.apilogicapp.lol/produtos', { params })
      .then(response => setProdutos(response.data))
      .catch(error => console.error('Erro ao carregar produtos:', error))
      .finally(() => setLoading(false));
  };

  const alternarFavorito = (codProduto) => {
    setFavoritos(prev =>
      prev.includes(codProduto)
        ? prev.filter(cod => cod !== codProduto)
        : [...prev, codProduto]
    );
  };

  const produtosFiltrados = produtos
    .filter(item =>
      item.produto.toLowerCase().includes(busca.toLowerCase()) &&
      (!mostrarFavoritos || favoritos.includes(item.codProduto))
    )
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
    const corMarkup = item.markup >= 0 ? '#4caf50' : '#f44336';
    const corMargem = item.margemLucro >= 0 ? '#4caf50' : '#f44336';
    const favorito = favoritos.includes(item.codProduto);

    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.produto}>{item.produto}</Text>
          <Text style={styles.codigo}>Código: {item.codProduto}</Text>
          <Text style={styles.preco}>Compra: R$ {item.precoCompra.toFixed(2)}</Text>
          <Text style={styles.preco}>Venda: R$ {item.precoVenda.toFixed(2)}</Text>
          <Text style={[styles.variacao, { color: corMarkup }]}>Markup: {item.markup.toFixed(2)}%</Text>
          <Text style={[styles.variacao, { color: corMargem }]}>Margem: {item.margemLucro.toFixed(2)}%</Text>
          <TouchableOpacity
            style={styles.detalhesButton}
            onPress={() =>
              navigation.navigate('Detalhes', {
                produto: item,
                dataInicioGlobal: dataInicio ? format(dataInicio, 'yyyy-MM-dd') : null,
                dataFimGlobal: dataFim ? format(dataFim, 'yyyy-MM-dd') : null,
              })
            }
          >
            <Text style={styles.detalhesText}>🔍</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.favorito}
          onPress={() => alternarFavorito(item.codProduto)}
        >
          <Text style={{ fontSize: 20 }}>{favorito ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoArea}>
          <Animated.Image source={logo} style={[styles.logo, { opacity: logoAnim }]} resizeMode="contain" />
          <Animated.Text style={[styles.logoTexto, { opacity: logoAnim }]}>LÓGICA DISTRIBUIÇÃO</Animated.Text>
        </View>
        <View style={styles.usuarioArea}>
          <Animated.Image source={userIcon} style={[styles.userIcon, { opacity: userAnim }]} resizeMode="contain" />
          <Text style={styles.usuarioNome}>{usuario}</Text>
          <TouchableOpacity onPress={sair} style={{ marginTop: 4 }}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Buscar produto..."
        placeholderTextColor="#ccc"
        value={busca}
        onChangeText={setBusca}
      />

      <View style={styles.dateContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setMostrandoCalendario('inicio')}>
          <Text style={styles.dateText}>
            {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Data Início'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setMostrandoCalendario('fim')}>
          <Text style={styles.dateText}>
            {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Data Fim'}
          </Text>
        </TouchableOpacity>
      </View>

      {mostrandoCalendario && (
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setMostrandoCalendario(null)}
          style={styles.overlay}
        >
          <View style={styles.calendarioContainer}>
            <Text style={{ color: '#fff', marginBottom: 5, textAlign: 'center' }}>
              {mostrandoCalendario === 'inicio' ? 'Selecionar Data Início' : 'Selecionar Data Fim'}
            </Text>
            <DateTimePicker
              value={(mostrandoCalendario === 'inicio' ? dataInicio : dataFim) || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="dark"
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  if (mostrandoCalendario === 'inicio') {
                    setDataInicio(selectedDate);
                  } else {
                    setDataFim(selectedDate);
                  }
                  setMostrandoCalendario(null); // Fecha após confirmação
                } else {
                  setMostrandoCalendario(null); // Fecha se cancelar
                }
              }}
            />
            <View style={styles.atalhosRow}>
              <TouchableOpacity
                style={styles.atalho}
                onPress={() => {
                  const hoje = new Date();
                  const inicio = new Date();
                  inicio.setDate(inicio.getDate() - 7);
                  setDataInicio(inicio);
                  setDataFim(hoje);
                  setMostrandoCalendario(null);
                }}
              >
                <Text style={styles.dateText}>🗓️ 7 dias</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.atalho}
                onPress={() => {
                  const hoje = new Date();
                  const inicio = new Date();
                  inicio.setDate(inicio.getDate() - 30);
                  setDataInicio(inicio);
                  setDataFim(hoje);
                  setMostrandoCalendario(null);
                }}
              >
                <Text style={styles.dateText}>🗓️ 30 dias</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setOrdenacao('alfabetica')} style={styles.filterButton}>
          <Text style={styles.filterText}>A-Z</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOrdenacao('maiorMargem')} style={styles.filterButton}>
          <Text style={styles.filterText}>Maior Margem</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOrdenacao('menorMargem')} style={styles.filterButton}>
          <Text style={styles.filterText}>Menor Margem</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMostrarFavoritos(!mostrarFavoritos)} style={styles.filterButton}>
          <Text style={styles.filterText}>⭐</Text>
        </TouchableOpacity>


      </View>

      <FlatList
        data={produtosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBackground} />
          <LottieView
            source={loadingAnim}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121e2d', padding: 10 },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2c40',
    marginBottom: 10,
    borderRadius: 8,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  usuarioArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4, 
  },

  userIcon: {
    width: 22,
    height: 22,
  },
  usuarioNome: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 2,
    textAlign: 'center',
  },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  input: {
    backgroundColor: '#1f2c40',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#2e3e55',
    borderWidth: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
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
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  calendarioContainer: {
    backgroundColor: '#1f2c40',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: '90%',
  },
  atalhosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  atalho: {
    backgroundColor: '#2e3e55',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#2e3e55',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  filterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1f2c40',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
  },
  produto: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  codigo: { fontSize: 12, color: '#bbb' },
  preco: { fontSize: 14, color: '#eee' },
  variacao: { fontSize: 14, fontWeight: 'bold' },
  favorito: { position: 'absolute', bottom: 8, right: 10 },
  detalhesButton: {
    marginTop: 8,
    backgroundColor: '#2e3e55',
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  detalhesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
