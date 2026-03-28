#!/bin/bash
WINDOWS_ENTRY="Windows Boot Manager (on /dev/sda1)"
sudo grub2-reboot "$WINDOWS_ENTRY"
sudo reboot
