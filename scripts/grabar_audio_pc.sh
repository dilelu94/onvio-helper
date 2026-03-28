#!/bin/bash
# Script para grabar el audio del sistema (Desktop Audio)
# Detecta automáticamente el dispositivo de salida actual
MONITOR_SINK=$(pactl get-default-sink).monitor
FILENAME="/home/dilelu/Desktop/grabacion_$(date +%Y%m%d_%H%M%S).ogg"

echo "Grabando audio del sistema en: $FILENAME"
echo "Presiona Ctrl+C para detener la grabación..."

# Grabamos usando ffmpeg con la mejor calidad vorbis
ffmpeg -f pulse -i "$MONITOR_SINK" -c:a libvorbis -q:a 5 "$FILENAME" -loglevel error
