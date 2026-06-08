# Referências técnicas usadas como base inicial

Este MVP usa perfis agronômicos parametrizáveis baseados em recomendações e conceitos amplamente utilizados pela Embrapa e manuais técnicos para:

- Mandioca
- Pastagem para leite
- Pastagem para gado de corte
- Milho
- Soja
- Cana-de-açúcar

## Pontos importantes

1. Não existe uma tabela única nacional que sirva perfeitamente para todas as regiões, solos e produtividades.
2. Fósforo e potássio podem depender de textura, CTC, método de extração e expectativa produtiva.
3. Cana-de-açúcar exige maior cuidado, pois as recomendações são muito regionalizadas.
4. Soja não deve receber recomendação automática de cama de frango apenas com base no N, por causa da fixação biológica de nitrogênio.
5. A interpretação de P, K e micronutrientes deve respeitar o método analítico do laboratório.

## Fórmulas implementadas

### Gessagem

NG (t/ha) = (0,6 × CTCe - Ca) × 6,4

### Calagem por Ca na CTC

NC (t/ha) = ((T × 0,6 - Ca) × 5600 / %CaO) / PRNT

### Calagem por V%

NC (t/ha) = ((CTC pH7 × (V2 - V1) / 100) × (100 / PRNT))

### Calagem por Ca absoluto

NC = ((Ca2 - Ca1) × 2) × (100 / PRNT)

## Fontes comerciais usadas no MVP

- Fósforo: Superfosfato simples, 18% de P2O5.
- Fósforo: Superfosfato triplo, 41% de P2O5.
- Potássio: Cloreto de potássio, 58% de K2O.
- Micronutrientes: FTE BR-12 ou formulação equivalente.
- Cama de frango: 3% de N médio e 50% de eficiência no primeiro cultivo como padrão editável.
