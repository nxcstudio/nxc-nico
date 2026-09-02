output "cluster_endpoint" {
  description = "Kubernetes API endpoint for the EKS cluster"
  value       = aws_eks_cluster.nico_cluster.endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.nico_cluster.name
}

output "ecr_repository_url" {
  description = "ECR image repository URL"
  value       = aws_ecr_repository.nico_repo.repository_url
}
