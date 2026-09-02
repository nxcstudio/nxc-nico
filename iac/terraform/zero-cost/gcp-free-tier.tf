# ==============================================================================
# GCP Always Free Tier Infrastructure Specification
# 1 e2-micro instance (us-central1, us-east1, or us-west1)
# 30 GB standard persistent disk
# Cost: $0.00 / month
# Workload: Persistent 24/7 Webhook Listener & API Server
# ==============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "us-central1"
  zone    = "us-central1-a"
}

variable "gcp_project_id" {
  type        = string
  description = "GCP Project ID for Always Free Tier"
  default     = "nxc-free-tier-project"
}

# GCP Always Free e2-micro compute instance
resource "google_compute_instance" "nico_free_node" {
  name         = "nxc-nico-listener-node"
  machine_type = "e2-micro" # Always Free qualified
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30 # Always Free qualified (up to 30GB standard persistent disk)
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP for webhooks
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io git curl
    systemctl enable --now docker
    echo "NICO GCP Always Free Node Initialized"
  EOF

  tags = ["nico-webhook-node"]
}

resource "google_compute_firewall" "allow_webhooks" {
  name    = "allow-nico-webhooks"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["nico-webhook-node"]
}
