#!/bin/bash

# Este script configura GRUB para que el próximo arranque sea en Windows
# y luego reinicia la computadora inmediatamente.

WINDOWS_ENTRY="Windows Boot Manager (on /dev/sda1)"

echo "Configurando GRUB para iniciar: $WINDOWS_ENTRY"
sudo grub2-reboot "$WINDOWS_ENTRY"

echo "Reiniciando ahora..."
sudo reboot
