# Jenkins CI/CD Pipeline

## Structure
- `Jenkinsfile` - Pipeline definition
- `scripts/` - Build and deploy scripts
- `config/` - Jenkins configuration

## Pipeline Stages

```groovy
pipeline {
    agent any
    
    stages {
        stage('Git Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'docker build -t app-backend:${BUILD_NUMBER} .'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                sonar()
            }
        }
        
        stage('Trivy Scan') {
            steps {
                trivy('app-backend:${BUILD_NUMBER}')
            }
        }
        
        stage('Docker Push') {
            steps {
                docker_push()
            }
        }
        
        stage('Deploy') {
            steps {
                kubernetes_deploy()
            }
        }
    }
}
```

## Phase 5 Tasks
- [ ] Install Jenkins (Docker)
- [ ] Configure GitHub/GitLab webhook
- [ ] Create Jenkinsfile
- [ ] Add SonarQube integration
- [ ] Add Trivy integration
- [ ] Test pipeline with sample commit
- [ ] Configure automatic deployment

## Docker Compose for Jenkins

```yaml
services:
  jenkins:
    image: jenkins/jenkins:lts
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      JENKINS_OPTS: "--argumentsRealm.passwd.admin=admin --argumentsRealm.passwd.admin=true"
```

## Initial Setup
1. Access Jenkins at http://localhost:8080
2. Get admin password: `docker logs jenkins`
3. Install plugins: Pipeline, Docker, SonarQube, Kubernetes
4. Configure credentials for Docker Hub and Git
5. Create new Pipeline job
