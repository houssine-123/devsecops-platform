# vault/policies/devsecops-policy.hcl
# Grants read-only access to all devsecops secrets - used by the CI pipeline

path "secret/data/devsecops" {
  capabilities = ["read"]
}

path "secret/data/docker" {
  capabilities = ["read"]
}

path "secret/data/slack" {
  capabilities = ["read"]
}

path "secret/data/email" {
  capabilities = ["read"]
}

# Allow listing keys (so the pipeline can verify paths exist)
path "secret/metadata/*" {
  capabilities = ["list", "read"]
}
