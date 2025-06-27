import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import SplashScreen from './src/screens/SplashScreen';

const Stack = createStackNavigator();

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://18.191.171.80:3000/produtos')
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error('Erro ao carregar produtos:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">
          {(props) => <SplashScreen {...props} produtos={produtos} loading={loading} />}
        </Stack.Screen>
        <Stack.Screen name="Produtos">
          {(props) => <ProductListScreen {...props} produtosIniciais={produtos} />}
        </Stack.Screen>
        <Stack.Screen name="Detalhes" component={ProductDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
