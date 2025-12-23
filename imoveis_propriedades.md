# Endpoint da Content API do Stays.net para Detalhes de Imóveis

O endpoint que retorna as informações detalhadas de um imóvel específico, incluindo suas características, é o **Retrieve Property** dentro da **Content API**.

## Retrieve Property

- **Descrição:** Retorna informações detalhadas para uma propriedade específica.
- **Método HTTP:** `GET`
- **URL:** `/external/v1/content/properties/{propertyId}`
- **Parâmetros de Path:**
    - `propertyId`: Identificador da propriedade. Ambos os identificadores (longo e curto) são suportados.
- **Exemplo de uso (cURL):**
```bash
curl -X GET "https://play.stays.net/external/v1/content/properties/{propertyId}" \
-H "Authorization: Basic ODQwOTQxMTU1NjphNThITE13RkFX" \
-H "Content-Type: application/json"
```
- **O que esperar:** O retorno é um objeto JSON que contém diversas informações sobre a propriedade, incluindo:
    - `_id`: ID da propriedade.
    - `_idtype`: Tipo de propriedade.
    - `internalName`: Nome interno da propriedade.
    - `address`: Informações de endereço.
    - `amenities`: **Esta seção deve conter as características do imóvel (Wi-Fi, quartos, etc.).**
    - `listings`: Lista de unidades de listagem (quartos, apartamentos, etc.) dentro da propriedade, cada uma com seus próprios detalhes e amenities.

**Instruções de Uso:**

1.  **Obtenha o `propertyId`** do imóvel que você deseja consultar.
2.  **Substitua `{propertyId}`** na URL pelo ID real.
3.  **Substitua `play.stays.net`** pelo domínio real do seu sistema.
4.  **Substitua o valor do cabeçalho `Authorization`** com suas credenciais reais (client_id:client_secret codificado em Base64).

**Combinação com Translations API:**

O endpoint `Retrieve Property` provavelmente retornará as características (amenities) como IDs. Para obter a tradução (o nome legível) dessas características, você precisará usar os endpoints da **Translations API** que identificamos na fase anterior:

- `/external/v1/translation/property-amenities`
- `/external/v1/translation/listing-amenities`
- `/external/v1/translation/bedroom-types`
- etc.

Você usará o `_id` da característica retornado no `Retrieve Property` para buscar o nome correspondente em português (ou outro idioma) no retorno dos endpoints da Translations API.
