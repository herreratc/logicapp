import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.15.5:3000',  // Caso teste no celular, troque por IP da máquina
});

export default api;
