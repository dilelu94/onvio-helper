#!/bin/bash
# Script de intercambio de configuración para WoW Low Graphics

WOW_DIR="/var/home/dilelu/Games M2/battlenet/drive_c/Program Files (x86)/World of Warcraft/_retail_/WTF"
CONFIG_ORIG="$WOW_DIR/Config.wtf"
CONFIG_LOW="$WOW_DIR/ConfigLow.wtf"
CONFIG_BAK="$WOW_DIR/Config.wtf.bak"

# 1. Asegurar que tenemos un backup
if [ ! -f "$CONFIG_BAK" ]; then
    cp "$CONFIG_ORIG" "$CONFIG_BAK"
fi

# 2. Poner la configuración de gráficos bajos
cp "$CONFIG_LOW" "$CONFIG_ORIG"

echo "Configuración de gráficos BAJOS aplicada. Lanzando Battle.net..."

# 3. Lanzar Battle.net a través de Lutris
# Usamos el comando que ya funciona en tu sistema
env LUTRIS_SKIP_INIT=1 lutris lutris:rungameid/452

# 4. Al cerrar, restaurar la configuración original
# Nota: Este paso se ejecutará cuando cierres el proceso de Lutris
cp "$CONFIG_BAK" "$CONFIG_ORIG"
echo "Configuración ORIGINAL restaurada."
