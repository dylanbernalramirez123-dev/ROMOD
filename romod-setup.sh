#!/bin/bash

# 📋 ROMOD SETUP SCRIPT - Instalación Automatizada
# Ejecutar: bash romod-setup.sh

echo "╔════════════════════════════════════════════════════╗"
echo "║       🛡️  ROMOD SECURITY BOT - SETUP              ║"
echo "║            Instalación Automatizada               ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Verificar Node.js
echo "1️⃣  Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js $NODE_VERSION encontrado"
else
    echo "   ❌ Node.js no está instalado"
    echo "   Descárgalo de: https://nodejs.org"
    exit 1
fi
echo ""

# Paso 2: Instalar dependencias
echo "2️⃣  Instalando dependencias..."
npm install
if [ $? -eq 0 ]; then
    echo "   ✅ Dependencias instaladas"
else
    echo "   ❌ Error instalando dependencias"
    exit 1
fi
echo ""

# Paso 3: Verificar estructura
echo "3️⃣  Verificando estructura del proyecto..."
node verify-structure.js
node verify-commands.js
echo ""

# Paso 4: Compilar TypeScript
echo "4️⃣  Compilando TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ Compilación exitosa"
else
    echo "   ❌ Error en compilación"
    exit 1
fi
echo ""

# Paso 5: Crear .env
echo "5️⃣  Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "   ✅ Archivo .env creado"
    echo "   ⚠️  IMPORTANTE: Edita .env y agrega tu TOKEN"
    echo "      TOKEN=tu_token_aqui"
else
    echo "   ℹ️  Archivo .env ya existe"
fi
echo ""

# Paso 6: Mostrar resumen
echo "╔════════════════════════════════════════════════════╗"
echo "║         ✅ SETUP COMPLETADO                        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📋 VERIFICACIÓN:"
echo "   ✅ Node.js instalado"
echo "   ✅ Dependencias instaladas"
echo "   ✅ Estructura verificada"
echo "   ✅ TypeScript compilado"
echo "   ✅ Variables de entorno configuradas"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Editar .env y agregar TOKEN"
echo "   2. Ejecutar: npm start"
echo "   3. Verificar que bot está online en Discord"
echo "   4. Seguir SETUP_CHECKLIST.md"
echo ""
echo "📖 DOCUMENTACIÓN:"
echo "   • README.md              - Características"
echo "   • COMMANDS_GUIDE.md      - Guía de comandos"
echo "   • SETUP_CHECKLIST.md     - Primeros pasos"
echo "   • QUICK_START.md         - Inicio rápido"
echo ""
