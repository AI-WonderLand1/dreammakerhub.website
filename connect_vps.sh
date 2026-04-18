#!/usr/bin/expect -f
spawn ssh -o StrictHostKeyChecking=no root@2.24.210.180
expect "password:"
send "LZ8aQZI:#YdF+fG2\r"
interact
