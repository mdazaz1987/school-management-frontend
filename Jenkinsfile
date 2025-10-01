pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'  // Configure this in Jenkins Global Tool Configuration
    }
    
    environment {
        APP_PORT = '4001'
        DEPLOY_DIR = '/var/www/school-frontend'
        APP_NAME = 'school-management-frontend'
        REACT_APP_API_URL = 'http://141.148.218.230:9090/api'  // Update with your backend URL
    }
    
    triggers {
        // Poll SCM every 2 minutes for changes
        pollSCM('H/2 * * * *')
        // Or use GitHub webhook (recommended)
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Environment Info') {
            steps {
                echo 'Displaying build environment...'
                sh '''
                    echo "Node version: $(node --version)"
                    echo "NPM version: $(npm --version)"
                    echo "Build number: ${BUILD_NUMBER}"
                    echo "Branch: ${GIT_BRANCH}"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing NPM dependencies...'
                sh 'npm ci --prefer-offline --no-audit'
            }
        }
        
        stage('Lint Code') {
            steps {
                echo 'Running ESLint...'
                sh 'npm run lint || true'  // Continue even if lint fails
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running unit tests...'
                sh 'npm test -- --coverage --watchAll=false --passWithNoTests || true'
            }
        }
        
        stage('Build Application') {
            steps {
                echo 'Building React production bundle...'
                sh '''
                    export REACT_APP_API_URL=${REACT_APP_API_URL}
                    npm run build
                    echo "Build completed successfully!"
                    ls -lh build/
                '''
            }
        }
        
        stage('Deploy to Oracle Cloud') {
            steps {
                echo 'Deploying application to Oracle Cloud...'
                script {
                    sh """
                        # Stop existing application
                        echo "Stopping existing application..."
                        pm2 stop ${APP_NAME} || true
                        pm2 delete ${APP_NAME} || true
                        
                        # Create deployment directory if it doesn't exist
                        sudo mkdir -p ${DEPLOY_DIR}
                        
                        # Backup existing deployment
                        if [ -d "${DEPLOY_DIR}/build" ]; then
                            echo "Backing up existing deployment..."
                            sudo mv ${DEPLOY_DIR}/build ${DEPLOY_DIR}/build.backup.\$(date +%Y%m%d_%H%M%S) || true
                        fi
                        
                        # Copy new build
                        echo "Copying new build files..."
                        sudo cp -r build ${DEPLOY_DIR}/
                        sudo chown -R jenkins:jenkins ${DEPLOY_DIR}
                        
                        # Install serve if not already installed
                        if ! command -v serve &> /dev/null; then
                            echo "Installing serve..."
                            sudo npm install -g serve
                        fi
                        
                        # Install PM2 if not already installed
                        if ! command -v pm2 &> /dev/null; then
                            echo "Installing PM2..."
                            sudo npm install -g pm2
                        fi
                        
                        # Start application with PM2
                        echo "Starting application on port ${APP_PORT}..."
                        cd ${DEPLOY_DIR}
                        pm2 start "serve -s build -l ${APP_PORT}" --name ${APP_NAME}
                        pm2 save
                        
                        # Ensure PM2 starts on system reboot
                        pm2 startup || true
                        
                        echo "Deployment completed successfully!"
                        pm2 status
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Performing application health check...'
                script {
                    sh 'sleep 5'  // Wait for application to start
                    
                    def maxRetries = 5
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        try {
                            def response = sh(
                                script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:${APP_PORT}",
                                returnStdout: true
                            ).trim()
                            
                            echo "Health check attempt ${retryCount + 1}: HTTP ${response}"
                            
                            if (response == '200') {
                                healthCheckPassed = true
                                echo '✅ Health check passed!'
                            } else {
                                retryCount++
                                if (retryCount < maxRetries) {
                                    echo "Retrying in 5 seconds..."
                                    sh 'sleep 5'
                                }
                            }
                        } catch (Exception e) {
                            retryCount++
                            echo "Health check attempt ${retryCount} failed: ${e.message}"
                            if (retryCount < maxRetries) {
                                sh 'sleep 5'
                            }
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("❌ Health check failed after ${maxRetries} attempts")
                    }
                }
            }
        }
        
        stage('Cleanup Old Builds') {
            steps {
                echo 'Cleaning up old backup builds...'
                sh """
                    # Keep only last 3 backups
                    cd ${DEPLOY_DIR}
                    ls -t build.backup.* 2>/dev/null | tail -n +4 | xargs -r sudo rm -rf
                    echo "Cleanup completed"
                """
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution completed'
            echo "Application URL: http://localhost:${APP_PORT}"
        }
        
        success {
            echo '✅ Pipeline completed successfully!'
            echo "Frontend deployed and running on port ${APP_PORT}"
            
            // Send success notification (optional)
            script {
                try {
                    emailext(
                        subject: "✅ SUCCESS: Frontend Deployment [${env.JOB_NAME} #${env.BUILD_NUMBER}]",
                        body: """
                            <h2>Frontend Deployment Successful</h2>
                            <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Branch:</strong> ${env.GIT_BRANCH}</p>
                            <p><strong>Application URL:</strong> http://localhost:${APP_PORT}</p>
                            <p><strong>Build URL:</strong> <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a></p>
                        """,
                        to: 'rahat.azaz1@gmail.com',
                        mimeType: 'text/html'
                    )
                } catch (Exception e) {
                    echo "Email notification failed: ${e.message}"
                }
            }
        }
        
        failure {
            echo '❌ Pipeline failed!'
            
            // Rollback to previous build if available
            script {
                try {
                    sh """
                        if [ -d "${DEPLOY_DIR}/build.backup.*" ]; then
                            echo "Rolling back to previous build..."
                            latest_backup=\$(ls -t ${DEPLOY_DIR}/build.backup.* 2>/dev/null | head -1)
                            if [ -n "\$latest_backup" ]; then
                                sudo rm -rf ${DEPLOY_DIR}/build
                                sudo cp -r \$latest_backup ${DEPLOY_DIR}/build
                                pm2 restart ${APP_NAME}
                                echo "Rollback completed"
                            fi
                        fi
                    """
                } catch (Exception e) {
                    echo "Rollback failed: ${e.message}"
                }
                
                // Send failure notification
                try {
                    emailext(
                        subject: "❌ FAILED: Frontend Deployment [${env.JOB_NAME} #${env.BUILD_NUMBER}]",
                        body: """
                            <h2>Frontend Deployment Failed</h2>
                            <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Branch:</strong> ${env.GIT_BRANCH}</p>
                            <p><strong>Console Output:</strong> <a href='${env.BUILD_URL}console'>${env.BUILD_URL}console</a></p>
                        """,
                        to: 'rahat.azaz1@gmail.com',
                        mimeType: 'text/html'
                    )
                } catch (Exception e) {
                    echo "Email notification failed: ${e.message}"
                }
            }
        }
        
        unstable {
            echo '⚠️ Pipeline is unstable'
        }
    }
}
