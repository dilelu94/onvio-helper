#!/bin/bash

# Nombre del dispositivo virtual
SINK_NAME="VirtualMic"
SINK_DESC="Virtual Microphone (Voicebox)"

# 1. Crear el Sink Nulo (el "Cable Virtual")
pactl load-module module-null-sink \
    sink_name=$SINK_NAME \
    sink_properties=device.description="$SINK_DESC"

# 2. Crear el Remap-Source (esto hace que aparezca como MICRÓFONO en Discord)
pactl load-module module-remap-source \
    master=$SINK_NAME.monitor \
    source_name=$SINK_NAME_Mic \
    source_properties=device.description="Voicebox_Mic_Input"

# 3. Rutar tu micrófono real al cable virtual (para hablar tú también)
pactl load-module module-loopback \
    sink=$SINK_NAME \
    description="Loopback Mic Real al Virtual"

echo "Micrófono Virtual Creado con éxito."
echo "INSTRUCCIONES:"
echo "1. En DISCORD: Selecciona 'Voicebox_Mic_Input' como DISPOSITIVO DE ENTRADA."
echo "2. En SISTEMA (Plasma): Cambia la salida de Voicebox a '$SINK_DESC'."
