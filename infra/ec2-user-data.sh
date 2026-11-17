#!/bin/bash
set -euxo pipefail

# Amazon Linux 2023 includes the SSM Agent package. Keep it running so
# GitHub Actions can deploy without SSH keys.
dnf install -y docker awscli amazon-ssm-agent
systemctl enable --now docker
systemctl enable --now amazon-ssm-agent

install -d -m 700 /etc/insane-stays
touch /etc/insane-stays/backend.env
chmod 600 /etc/insane-stays/backend.env

usermod -aG docker ec2-user || true
