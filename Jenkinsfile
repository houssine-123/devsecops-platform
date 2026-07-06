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

    // ── STEP 2: Build + Tests unitaires ─────────────────────────────────────
    stage('Build Backend') {
      steps {
        dir('app/backend') {
          sh 'npm ci --prefer-offline'
          // Tests unitaires (jest + supertest, BDD mockée) ; la couverture
          // lcov générée ici est ensuite importée par SonarQube
          sh 'npm test'
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

    // ── STEP 4bis: Secret Scanning (Gitleaks) — BLOQUANT ────────────────────
    // Scanne l'arbre de travail (--no-git) : aucun secret ne doit partir en image.
    // Le workspace vit dans le volume pfe_jenkins_home (partagé via le socket Docker).
    stage('Secret Scan (Gitleaks)') {
      steps {
        sh '''
          docker run --rm -v pfe_jenkins_home:/scan ghcr.io/gitleaks/gitleaks:latest \
            detect --no-git --source /scan/workspace/devsecops-pipeline \
            --config /scan/workspace/devsecops-pipeline/.gitleaks.toml \
            --report-format json --report-path /scan/workspace/devsecops-pipeline/gitleaks-report.json \
            --exit-code 1 --no-banner
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
        }
      }
    }

    // ── STEP 4ter: IaC Scan (Checkov) — rapport (non bloquant) ──────────────
    stage('IaC Scan (Checkov)') {
      steps {
        sh '''
          docker run --rm -v pfe_jenkins_home:/scan bridgecrew/checkov:latest \
            -d /scan/workspace/devsecops-pipeline/kubernetes \
            --quiet --compact --soft-fail \
            -o cli -o json --output-file-path console,/scan/workspace/devsecops-pipeline
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'results_json.json', allowEmptyArchive: true
        }
      }
    }

    // ── STEP 5: Docker Build ────────────────────────────────────────────────
    stage('Docker Build') {
      steps {
        sh "docker build -t ${BACKEND_IMAGE}  -f app/backend/Dockerfile  app/backend"
        sh "docker build --build-arg VITE_BUILD_NUMBER=${BUILD_NUMBER} -t ${FRONTEND_IMAGE} -f app/frontend/Dockerfile app/frontend"
      }
    }

    // Politique de rejet : CRITICAL = build bloqué ; HIGH = rapporté
    stage('Trivy - Image Scan') {
      steps {
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity CRITICAL --exit-code 1 --no-progress ${BACKEND_IMAGE}"
        sh "trivy image --cache-dir \$TRIVY_CACHE_DIR --timeout 20m --severity CRITICAL --exit-code 1 --no-progress ${FRONTEND_IMAGE}"
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

    // ── STEP 8: DAST — OWASP ZAP baseline sur le staging ────────────────────
    // Scan dynamique de l'application qui vient d'être construite, via le
    // frontend du staging Compose (proxy /api inclus). -I : les alertes
    // de niveau warning n'échouent pas le build ; le rapport est archivé.
    stage('DAST (OWASP ZAP)') {
      steps {
        sh '''
          docker run --rm --network pfe_devsecops-network \
            -v pfe_jenkins_home:/zap/wrk \
            -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
            -t http://frontend:3000 \
            -r workspace/devsecops-pipeline/zap-report.html \
            -I
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'zap-report.html', allowEmptyArchive: true
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
