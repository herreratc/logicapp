import axios from 'axios';

export default axios.create({
  baseURL: 'https://18.191.171.80.sslip.io:3000', // <- API pública rodando na EC2
});
