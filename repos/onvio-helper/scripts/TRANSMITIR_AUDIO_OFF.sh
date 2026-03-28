#!/bin/bash

echo "Desactivando Micrófono Virtual y restaurando audio..."

# 1. Buscamos y descargamos el módulo de Sink Nulo (VirtualMic)
MODULE_SINK_ID=$(pactl list modules short | grep "module-null-sink" | grep "VirtualMic" | cut -f1)
if [ ! -z "$MODULE_SINK_ID" ]; then
    pactl unload-module $MODULE_SINK_ID
    echo "✔ Micrófono Virtual (Sink) desactivado."
else
    echo "ℹ No se encontró el Micrófono Virtual activo."
fi

# 2. Buscamos y descargamos el módulo de Loopback (el puente del micro real)
MODULE_LOOP_ID=$(pactl list modules short | grep "module-loopback" | grep "VirtualMic" | cut -f1)
if [ ! -z "$MODULE_LOOP_ID" ]; then
    pactl unload-module $MODULE_LOOP_ID
    echo "✔ Puente de micrófono real (Loopback) desactivado."
else
    # Intento secundario por descripción si el anterior falla
    MODULE_LOOP_ID=$(pactl list modules | grep -B 1 "Loopback Mic Real al Virtual" | grep "Module #" | sed 's/[^0-9]//g')
    if [ ! -z "$MODULE_LOOP_ID" ]; then
        pactl unload-module $MODULE_LOOP_ID
        echo "✔ Puente de micrófono real desactivado (por descripción)."
    fi
fi

echo "Audio devuelto a la normalidad."
