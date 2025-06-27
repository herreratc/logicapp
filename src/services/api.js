import axios from 'axios';

export default axios.create({
  baseURL: 'http://18.191.171.80:3000', // <- API pública rodando na EC2
});
