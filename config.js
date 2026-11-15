export const APP_CONFIG = {
  business: {
    KG_PER_CREDIT: 1000,
    PRICE_PER_CREDIT_BRL: 75.0,
  },
  transports: {
    car: {
      label: "Carro a gasolina",
      emissionPerKm: 0.192,
    },
    "electric-car": {
      label: "Carro elétrico",
      emissionPerKm: 0.053,
    },
    bus: {
      label: "Ônibus rodoviário",
      emissionPerKm: 0.089,
    },
    plane: {
      label: "Avião",
      emissionPerKm: 0.255,
    },
    train: {
      label: "Trem",
      emissionPerKm: 0.041,
    },
    bicycle: {
      label: "Bicicleta",
      emissionPerKm: 0,
    },
    walk: {
      label: "A pé",
      emissionPerKm: 0,
    },
  },
  cities: [
    { id: "sp", name: "São Paulo, SP", lat: -23.5505, lng: -46.6333 },
    { id: "rj", name: "Rio de Janeiro, RJ", lat: -22.9068, lng: -43.1729 },
    { id: "ctba", name: "Curitiba, PR", lat: -25.4284, lng: -49.2733 },
    { id: "bh", name: "Belo Horizonte, MG", lat: -19.9167, lng: -43.9345 },
    { id: "bsb", name: "Brasília, DF", lat: -15.7939, lng: -47.8828 },
    { id: "ssa", name: "Salvador, BA", lat: -12.9777, lng: -38.5016 },
  ],
};

// Para cadastrar uma cidade, adicione um objeto com id único, nome e coordenadas em cities.
// Para cadastrar um transporte, adicione uma chave em transports com label e emissionPerKm.
