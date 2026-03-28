#!/bin/bash
# Script para convertir todos los archivos .wav de la carpeta actual a .ogg
for file in ./*.wav; do
    if [ -e "$file" ]; then
        filename="${file%.wav}"
        if ffmpeg -i "$file" "${filename}.ogg" -y; then
            rm "$file"
        fi
    fi
done
