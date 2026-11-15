# Calculadora de emissões de CO₂ para viagens

Aplicação web que estima a distância em linha reta entre duas cidades, calcula as emissões de CO₂ de uma viagem e mostra o custo estimado para compensá-las.

## Funcionalidades

- Sugestões de cidades da configuração e entrada de nomes livres.
- Busca de coordenadas no Nominatim (OpenStreetMap) quando a cidade não está na base local.
- Distância calculada pela fórmula de Haversine.
- Estimativa de emissões, créditos de carbono e custo de compensação.
- Cards responsivos e gráfico comparativo dos meios de transporte para a mesma distância.
- Configuração centralizada de cidades, transportes e valores de negócio.

## Como executar

A aplicação usa módulos JavaScript ES6. Abra-a por um servidor HTTP local, não diretamente como arquivo `file://`.

Com Python instalado, execute na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois, acesse <http://localhost:8000>. Também é possível usar a extensão Live Server do VS Code. Não é necessário instalar dependências com npm.

É necessária conexão com a internet para carregar o Chart.js pelo CDN e consultar o Nominatim para cidades fora da configuração local.

## Como funciona

1. Informe a origem e o destino, escolhendo uma sugestão ou digitando o nome da cidade.
2. Selecione o meio de transporte e calcule a viagem.
3. A aplicação resolve as coordenadas localmente ou consulta o Nominatim e calcula a distância pelo método de Haversine.
4. Os resultados aparecem em cards, e o gráfico compara as emissões estimadas de todos os transportes configurados para essa distância.

Uma cidade pode ser digitada livremente. Para melhorar a precisão da busca, inclua o estado e o país quando o nome for ambíguo.

## Configuração

Os dados ficam em [`config.js`](./config.js), no objeto `APP_CONFIG`.

### Cidades

Adicione uma cidade em `cities` com um identificador único, nome e coordenadas:

```js
{ id: "niteroi", name: "Niterói, RJ", lat: -22.8832, lng: -43.1034 }
```

### Transportes

Adicione uma chave em `transports` com um rótulo e um fator de emissão em kg de CO₂ por passageiro-km:

```js
"carro-hibrido": {
  label: "Carro híbrido",
  emissionPerKm: 0.1,
}
```

O cálculo de compensação usa `KG_PER_CREDIT` (kg de CO₂ por crédito) e `PRICE_PER_CREDIT_BRL` (preço estimado em reais por crédito), também definidos em `APP_CONFIG.business`.

## Fatores de emissão padrão

| Transporte | Fator (kg CO₂ por passageiro-km) |
| --- | ---: |
| Carro a gasolina | 0,192 |
| Carro elétrico | 0,053 |
| Ônibus rodoviário | 0,089 |
| Avião | 0,255 |
| Trem | 0,041 |
| Bicicleta | 0 |
| A pé | 0 |

Os fatores são estimativas configuráveis. Bicicleta e caminhada são consideradas sem emissões diretas nesta calculadora.

## Fontes e limitações

- A distância calculada é em linha reta entre as coordenadas das cidades; não representa a distância real por estrada, ferrovia ou rota aérea.
- As emissões e o custo de compensação são estimativas baseadas nos fatores e valores configurados, não uma cotação ou certificação de créditos.
- Para cidades fora da base local, o nome digitado é enviado ao serviço público Nominatim para buscar coordenadas. A aplicação faz as consultas em sequência, respeitando um intervalo mínimo entre elas, e mantém os resultados em cache durante a sessão.
- Geocodificação: [Nominatim](https://nominatim.openstreetmap.org/). Dados e atribuição: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- Gráficos: [Chart.js](https://www.chartjs.org/), carregado pelo CDN jsDelivr.

## Arquivos

- `index.html` — estrutura da página e carregamento das bibliotecas.
- `style.css` — estilos responsivos da calculadora, cards e gráfico.
- `script.js` — sugestões, geocodificação, cálculos e renderização do gráfico.
- `config.js` — cidades, transportes e constantes de negócio.
