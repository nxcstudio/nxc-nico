terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Virtual Private Cloud (VPC)
resource "aws_vpc" "nico_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                        = "nxc-nico-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# 2. Public and Private Subnets across 2 AZs
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.nico_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "nico-public-${var.aws_region}a"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.nico_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "nico-private-${var.aws_region}a"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# 3. AWS Elastic Container Registry (ECR) for NICO
resource "aws_ecr_repository" "nico_repo" {
  name                 = "nxc-systems/nxc-nico"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = "production"
    ManagedBy   = "NICO"
  }
}
