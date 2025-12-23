# Platform Logos

Adicione os logos das plataformas nesta pasta com os seguintes nomes:

## Plataformas Ativas (baseado nos dados reais da API)

### 📌 Necessários
- **airbnb.png** - Logo do Airbnb (API retorna "API airbnb")
- **booking.png** - Logo do Booking.com (API retorna "API booking.com")
- **website.png** - Logo/ícone para reservas pelo site próprio (API retorna "Website")
- **direct.png** - Logo/ícone para reservas diretas (API retorna "Direto")
- **default.png** - Logo padrão para plataformas desconhecidas

### 🔮 Opcionais (para uso futuro)
- **expedia.png** - Logo do Expedia
- **vrbo.png** - Logo do VRBO
- **homeaway.png** - Logo do HomeAway
- **hotels.png** - Logo do Hotels.com
- **tripadvisor.png** - Logo do TripAdvisor
- **agoda.png** - Logo do Agoda

## Especificações das Imagens

- **Formato**: PNG (com transparência) ou SVG
- **Tamanho recomendado**: 64x64px ou 128x128px (quadrado)
- **Fundo**: Transparente de preferência
- **Qualidade**: Alta resolução para telas Retina

## Exemplo de Estrutura

```
public/images/platforms/
├── README.md (este arquivo)
├── airbnb.png
├── booking.png
├── website.png
├── direct.png
├── default.png
├── expedia.png (opcional)
├── vrbo.png (opcional)
└── ...
```

## Onde Baixar os Logos

1. **Sites oficiais** das plataformas (seção de imprensa/press kit)
2. **Brandfetch.com** - Repositório de logos de marcas
3. **Worldvectorlogo.com** - Logos em formato vetorial
4. **Logos-download.com** - Diversos logos em alta qualidade

## Dicas

- Use logos em alta qualidade para evitar pixelização
- Prefira logos sem texto (apenas símbolo) para economizar espaço
- Mantenha proporção 1:1 (quadrado) para consistência visual
- Se não tiver logo oficial, use um ícone simples que represente a plataforma

## Após Adicionar as Imagens

1. Recarregue a página (F5)
2. As imagens devem aparecer ao lado do código da reserva nos cards
3. Passe o mouse sobre a imagem para ver o nome da plataforma (tooltip)

## Console Logs

Para verificar qual plataforma está sendo usada, abra o Console (F12) e procure por:

```
📋 Guest CJ01J: {
  guestName: "Nome do Hóspede",
  platform: "Airbnb",
  platformImage: "/images/platforms/airbnb.png"
}
```
