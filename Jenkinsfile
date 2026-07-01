pipeline {
  agent any

  environment {
    REGISTRY         = 'houssineguidara12'
    BACKEND_IMAGE    = "${REGISTRY}/devsecops-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE   = "${REGISTRY}/devsecops-frontend:${BUILD_NUMBER}"
    KUBE_NAMESPACE   = 'devsecops-platform'
    SONAR_PROJECT    = 'devsecops-pfe'
    SONAR_HOST_URL   = 'http://sonarqube:9000'
    TRIVY_CACHE_DIR  = '/var/jenkins_home/.trivy'
    ARGOCD_SERVER    = 'host.docker.internal:30088'
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 60, unit: 'MINUTES')
  }

  stages {

    // ── STEP 1: Git Checkout ────────────────────────────────────────────────
    stage('Git Checkout') {
      steps {
        checkout scm
        sh 'git log -1 --oneline'
      }
    }

    // ── STEP 2: Build ───────────────────────────────────────────────────────
    stage('Build Backend') {
      steps {
        dir('app/backend') {
          sh 'npm ci --prefer-offline'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('app/frontend') {
          sh 'npm ci --prefer-offline'
          sh 'npm run build'
        }
      }
    }

    // ── STEP 3: SonarQube Analysis ──────────────────────────────────────────
    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('sonarqube') {
          withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
            script {
              // Use Jenkins-managed scanner (auto-downloads 6.2.1 on first run)
              def scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
              sh """
                ${scannerHome}/bin/sonar-scanner \
                  -Dsonar.projectKey=${SONAR_PROJECT} \
                  -Dsonar.projectName='DevSecOps PFE Platform' \
                  -Dsonar.sources=app/backend,app/frontend/src \
                  -Dsonar.exclusions='**/node_modules/**,**/dist/**,**/coverage/**,**/build/**' \
                  -Dsonar.host.url=${SONAR_HOST_URL} \
                  -Dsonar.login=\${SONAR_TOKEN}
              """
            }
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    // ── STEP 4: Trivy Security Scan ─────────────────────────────────────────
    stage('Trivy - Source Scan') {
      steps {
        sh 'trivy fs --cache-dir $TRIVY_CACHE_DIR --severity HIGH,CRITICAL --no-progress --format table .'
      }
      post {
        always {
          sh 'trivy fs --cache-dir $TRIVY_CACHE_DIR --severity HIGH,CRITICAL --format json --output trivy-source-report.json . || true'
          archiveArtifacts artifacts: 'trivy-source-report.json', allowEmptyArchive: true
        }
      }
    }

    // ── STEP 5: Docker Build ────────────────────────────────────────────────
    stage('Docker Build') {
      steps {
        sh "docker build -t ${BACKEND_IMAGE}  -f app/backend/Dockerfile  app/backend"
        sh "docker build -t ${FRONTEND_IMAGE} -f app/frontend/Dockerfile app/frontend"
      }
    }

    stage('Trivy - Image Scan') {
      steps {
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --severity HIGH,CRITICAL --no-progress --format table ${BACKEND_IMAGE}  || true"
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --severity HIGH,CRITICAL --no-progress --format table ${FRONTEND_IMAGE} || true"
      }
      post {
        always {
          sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --severity HIGH,CRITICAL --format json --output trivy-backend-image.json  ${BACKEND_IMAGE}  || true"
          sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --severity HIGH,CRITICAL --format json --output trivy-frontend-image.json ${FRONTEND_IMAGE} || true"
          archiveArtifacts artifacts: 'trivy-*-image.json', allowEmptyArchive: true
        }
      }
    }

    // ── STEP 6: Docker Push ─────────────────────────────────────────────────
    stage('Docker Push') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-credentials',
          usernameVariable: 'DOCKERHUB_USER',
          passwordVariable: 'DOCKERHUB_PASS'
        )]) {
          sh 'echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin'
          sh "docker push ${BACKEND_IMAGE}"
          sh "docker push ${FRONTEND_IMAGE}"
          sh "docker tag ${BACKEND_IMAGE}  ${REGISTRY}/devsecops-backend:latest"
          sh "docker tag ${FRONTEND_IMAGE} ${REGISTRY}/devsecops-frontend:latest"
          sh "docker push ${REGISTRY}/devsecops-backend:latest"
          sh "docker push ${REGISTRY}/devsecops-frontend:latest"
        }
      }
    }

    // ── STEP 7: Deploy via ArgoCD (or kubectl fallback) ─────────────────────
    stage('Deploy') {
      steps {
        script {
          def hasArgoCD = sh(script: 'which argocd 2>/dev/null || true', returnStdout: true).trim()
          if (env.ARGOCD_SERVER && hasArgoCD) {
            withCredentials([usernamePassword(
              credentialsId: 'argocd-credentials',
              usernameVariable: 'ARGO_USER',
              passwordVariable: 'ARGO_PASS'
            )]) {
              sh "argocd login ${env.ARGOCD_SERVER} --username \$ARGO_USER --password \$ARGO_PASS --insecure"
              sh "argocd app sync devsecops-platform"
              sh "argocd app wait devsecops-platform --timeout 180"
            }
          } else {
            echo "ArgoCD CLI not available or ARGOCD_SERVER not set — falling back to kubectl"
            withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG_FILE')]) {
              sh """
                export KUBECONFIG=\$KUBECONFIG_FILE
                kubectl -n ${KUBE_NAMESPACE} set image deployment/backend-deployment  backend=${BACKEND_IMAGE}
                kubectl -n ${KUBE_NAMESPACE} set image deployment/frontend-deployment frontend=${FRONTEND_IMAGE}
                kubectl -n ${KUBE_NAMESPACE} rollout status deployment/backend-deployment  --timeout=180s
                kubectl -n ${KUBE_NAMESPACE} rollout status deployment/frontend-deployment --timeout=180s
              """
            }
          }
        }
      }
    }

  }

  post {
    success {
      echo "Pipeline #${BUILD_NUMBER} SUCCESS — images pushed as ${BACKEND_IMAGE} and ${FRONTEND_IMAGE}"
    }
    failure {
      echo "Pipeline #${BUILD_NUMBER} FAILED — check stage logs above"
    }
    always {
      sh 'docker logout || true'
    }
  }
}
