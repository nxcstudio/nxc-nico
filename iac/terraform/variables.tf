variable "aws_region" {
  type        = string
  description = "AWS region for cluster and resources"
  default     = "us-east-1"
}

variable "cluster_name" {
  type        = string
  description = "Name of the Kubernetes cluster"
  default     = "nxc-production-eks"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "node_instance_types" {
  type        = list(string)
  description = "EC2 instance types for EKS worker nodes"
  default     = ["t3.xlarge"]
}
