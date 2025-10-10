export default {
  type: 'object',
  title: 'Retry',
  properties: {
    maxAttempts: { type: 'string', title: 'Reintentos' },
    waitDuration: { type: 'string', title: 'Tiempo de espera' },
  },
};
