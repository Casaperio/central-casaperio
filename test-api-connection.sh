#!/bin/bash

echo "🧪 Testando Conexão com stays-api"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_KEY="c04d89b3d57aebfa9f81942d39984773"
API_URL="http://localhost:3001"

echo -e "${YELLOW}1. Testando Health Endpoint (sem auth)${NC}"
HEALTH_RESPONSE=$(curl -s $API_URL/health)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Health OK:${NC} $HEALTH_RESPONSE"
else
  echo -e "${RED}❌ Health falhou${NC}"
fi
echo ""

echo -e "${YELLOW}2. Testando Sync Status (com auth)${NC}"
SYNC_STATUS=$(curl -s -H "X-API-Key: $API_KEY" $API_URL/api/v1/inventory/sync-status)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Sync Status OK:${NC} $SYNC_STATUS"
else
  echo -e "${RED}❌ Sync Status falhou${NC}"
fi
echo ""

echo -e "${YELLOW}3. Testando Reference Data (com auth)${NC}"
REF_DATA=$(curl -s -H "X-API-Key: $API_KEY" $API_URL/api/v1/inventory/reference-data)
if [ $? -eq 0 ]; then
  # Extract counts using grep and sed
  CATS=$(echo $REF_DATA | grep -o '"categories":\[[^]]*\]' | grep -o '\[' | wc -l)
  ITEMS=$(echo $REF_DATA | grep -o '"items":\[[^]]*\]' | grep -o '\[' | wc -l)
  echo -e "${GREEN}✅ Reference Data OK${NC}"
  echo "   Dados disponíveis (primeira análise do JSON)"
else
  echo -e "${RED}❌ Reference Data falhou${NC}"
fi
echo ""

echo -e "${YELLOW}4. Testando sem API Key (deve falhar)${NC}"
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/v1/inventory/sync-status)
if [ "$NO_AUTH" = "401" ]; then
  echo -e "${GREEN}✅ Autenticação funcionando corretamente (401 sem API key)${NC}"
else
  echo -e "${RED}❌ Erro inesperado: HTTP $NO_AUTH${NC}"
fi
echo ""

echo "=================================="
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   1. Reinicie o frontend: cd centralcasape2 && npm run dev"
echo "   2. Verifique se VITE_API_KEY está no .env"
echo "   3. Abra o navegador em http://localhost:5173"
echo "   4. Vá para Gestão de Inventário"
echo "   5. Clique em 🧪 Testar API"
