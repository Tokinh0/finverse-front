import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // adjust to your backend host
});

export const fetchMonthlyReport = (month) =>
  api.get('/reports/monthly', { params: { month } });
