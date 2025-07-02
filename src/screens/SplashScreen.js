import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image, TextInput, Alert, KeyboardAvoidingView,
  Platform, Animated, Easing, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usuarios from '../data/usuarios';
import loadingAnim from '../assets/animations/loading.json';
import LottieView from 'lottie-react-native';

const { height } = Dimensions.get('window');

export default function SplashScreen({ navigation, produtos, loading }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const senhaRef = useRef();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const botaoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarCredenciaisSalvas();
    animarEntrada();
  }, []);

  const carregarCredenciaisSalvas = async () => {
    const usuarioSalvo = await AsyncStorage.getItem('usuarioSalvo');
    const senhaSalva = await AsyncStorage.getItem('senhaSalva');
    if (usuarioSalvo) {
      setNome(usuarioSalvo);
      setLembrar(true);
    }
    if (senhaSalva) {
      setSenha(senhaSalva);
    }
  };

  const animarEntrada = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(botaoAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = () => {
    const valido = usuarios.find(
      (u) => u.nome.toLowerCase() === nome.toLowerCase() && u.senha === senha
    );
    if (valido) {
      if (lembrar) {
        AsyncStorage.setItem('usuarioSalvo', nome);
        AsyncStorage.setItem('senhaSalva', senha);
      } else {
        AsyncStorage.removeItem('usuarioSalvo');
        AsyncStorage.removeItem('senhaSalva');
      }
      navigation.replace('Produtos', {
        produtosIniciais: produtos,
        usuario: nome,
      });
    } else {
      Alert.alert('Erro', 'Usuário ou senha inválidos.');
    }
  };

  const alternarLembrar = () => setLembrar(!lembrar);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#121e2d' }}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.titulo}>Bem-vindo ao Lógica App</Text>
        <Text style={styles.subtitulo}></Text>

        <TextInput
          placeholder="Usuário"
          placeholderTextColor="#ccc"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          returnKeyType="next"
          onSubmitEditing={() => senhaRef.current?.focus()}
        />
        <TextInput
          ref={senhaRef}
          placeholder="Senha"
          placeholderTextColor="#ccc"
          secureTextEntry
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity onPress={alternarLembrar} style={styles.checkboxContainer}>
          <Text style={styles.checkbox}>{lembrar ? '☑️' : '⬜️'}</Text>
          <Text style={styles.checkboxLabel}>Lembrar usuário</Text>
        </TouchableOpacity>

        {loading ? (
          <LottieView
            source={loadingAnim}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
        ) : (
          <Animated.View style={{ opacity: botaoAnim, transform: [{ scale: botaoAnim }] }}>
            <TouchableOpacity style={styles.botao} onPress={handleLogin}>
              <Text style={styles.textoBotao}>Entrar</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      <View style={styles.rodape}>
        <Text style={styles.desenvolvido}>Desenvolvido por PHSoluções</Text>
        <Text style={styles.desenvolvido}></Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flexGrow: 1,
    flex: 1,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  titulo: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f2c40',
    color: '#fff',
    width: '100%',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    borderColor: '#2e3e55',
    borderWidth: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    fontSize: 18,
    marginRight: 8,
    color: '#fff',
  },
  checkboxLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  botao: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rodape: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  desenvolvido: {
    fontSize: 12,
    color: '#888',
  },
});
