FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI + Trivy in one layer
RUN apt-get update -qq && \
    apt-get install -y -qq \
        ca-certificates curl gnupg wget apt-transport-https lsb-release && \
    # Docker CLI
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list && \
    # Trivy
    wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" \
        > /etc/apt/sources.list.d/trivy.list && \
    # SonarQube Scanner
    wget -qO /opt/sonar-scanner.zip \
        https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip && \
    apt-get update -qq && \
    apt-get install -y -qq docker-ce-cli trivy unzip && \
    # Install sonar-scanner
    unzip -q /opt/sonar-scanner.zip -d /opt/ && \
    mv /opt/sonar-scanner-6.2.1.4610-linux-x64 /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    rm /opt/sonar-scanner.zip && \
    # ArgoCD CLI
    curl -sSL -o /usr/local/bin/argocd \
        https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64 && \
    chmod +x /usr/local/bin/argocd && \
    # Cleanup
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Add jenkins user to docker group (so it can run docker commands)
RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins

# Pre-install Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    sonar:latest \
    workflow-aggregator:latest \
    git:latest \
    docker-workflow:latest \
    credentials-binding:latest \
    junit:latest \
    timestamper:latest \
    pipeline-stage-view:latest
