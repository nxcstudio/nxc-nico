# ==============================================================================
# Oracle Cloud Infrastructure (OCI) Always Free Tier Specification
# Up to 4 ARM Ampere A1 Cores, 24 GB RAM, 200 GB Block Volume
# Cost: $0.00 / month
# Workload: Heavy Computational Tasks, Cognitive Core Triage & DinD Orchestrator
# ==============================================================================

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

variable "compartment_ocid" {
  type        = string
  description = "OCI Compartment OCID"
  default     = "ocid1.compartment.oc1..free_tier"
}

# OCI Always Free ARM Ampere A1 Instance
resource "oci_core_instance" "nico_arm_cluster_node" {
  availability_domain = data.oci_identity_availability_domain.ad.name
  compartment_id      = var.compartment_ocid
  display_name        = "nxc-nico-oci-arm-powerhouse"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4   # 4 Always Free ARM Cores
    memory_in_gbs = 24  # 24 GB Always Free RAM
  }

  source_details {
    source_type = "image"
    source_id   = var.arm_image_ocid
    boot_volume_size_in_gbs = 200 # Always Free block storage (up to 200 GB)
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.nico_subnet.id
    display_name     = "nico-primary-vnic"
    assign_public_ip = true
  }

  metadata = {
    user_data = base64encode(<<-EOF
      #!/bin/bash
      yum update -y
      yum install -y docker git
      systemctl enable --now docker
      echo "NICO OCI ARM Always Free Engine Ready"
    EOF
    )
  }
}
