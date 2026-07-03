pipeline {
  agent any

  environment {
    REGISTRY         = 'houssineguidara12'   // compte Docker Hub (≠ username GitHub)
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
    // --timeout 20m : le téléchargement de la DB dépasse les 5 min par défaut
    // --skip-dirs node_modules : déjà couvert par le scan des lockfiles
    stage('Trivy - Source Scan') {
      steps {
        sh 'trivy fs --cache-dir $TRIVY_CACHE_DIR --timeout 20m --skip-dirs node_modules --severity HIGH,CRITICAL --no-progress --format table .'
      }
      post {
        always {
          sh 'trivy fs --cache-dir $TRIVY_CACHE_DIR --timeout 20m --skip-dirs node_modules --severity HIGH,CRITICAL --format json --output trivy-source-report.json . || true'
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
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity HIGH,CRITICAL --no-progress --format table ${BACKEND_IMAGE}  || true"
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity HIGH,CRITICAL --no-progress --format table ${FRONTEND_IMAGE} || true"
      }
      post {
        always {
          sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity HIGH,CRITICAL --format json --output trivy-backend-image.json  ${BACKEND_IMAGE}  || true"
          sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity HIGH,CRITICAL --format json --output trivy-frontend-image.json ${FRONTEND_IMAGE} || true"
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

    // ── STEP 6bis: GitOps — épingler le tag d'image dans les manifests ──────
    // ArgoCD ne redéploie que si les manifests changent : on committe le tag
    // du build dans git, puis le sync (étape 7) fait rouler les pods.
    stage('Update Manifests (GitOps)') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'github-credentials',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_TOKEN'
        )]) {
          sh """
            sed -i 's|image: ${REGISTRY}/devsecops-backend:.*|image: ${BACKEND_IMAGE}|'  kubernetes/manifests/backend-deployment.yaml
            sed -i 's|image: ${REGISTRY}/devsecops-frontend:.*|image: ${FRONTEND_IMAGE}|' kubernetes/manifests/frontend-deployment.yaml
            git config user.email 'jenkins@devsecops.local'
            git config user.name  'Jenkins CI'
            git add kubernetes/manifests/backend-deployment.yaml kubernetes/manifests/frontend-deployment.yaml
            git diff --cached --quiet || git commit -m 'CI: deploy build #${BUILD_NUMBER} [skip ci]'
            git push https://\$GIT_USER:\$GIT_TOKEN@github.com/houssine-123/devsecops-platform.git HEAD:master
          """
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
              // --plaintext : le NodePort 30088 sert du HTTP (pas de TLS) ; sans ce flag
              // le CLI pose une question interactive et échoue (EOF) sous Jenkins
              // retry(3) : le sync interroge GitHub, sujet aux coupures réseau transitoires
              sh "argocd login ${env.ARGOCD_SERVER} --username \$ARGO_USER --password \$ARGO_PASS --insecure --plaintext"
              retry(3) {
                sh "argocd app sync devsecops-platform --plaintext"
              }
              sh "argocd app wait devsecops-platform --timeout 180 --plaintext"
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
