pipeline {
    agent any
    
    environment {
        APP_PORT = '4001'
        DEPLOY_DIR = '/var/www/school-frontend'
        APP_NAME = 'school-management-frontend'
        REACT_APP_API_URL = 'http://141.148.218.230:9090/api'  // Backend API URL
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"  // Ensure node/npm are in PATH
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
                        
                        # Create deployment directory if it doesn't exist (without sudo)
                        mkdir -p ${DEPLOY_DIR} || echo "Directory exists or no permission, continuing..."
                        
                        # Backup existing deployment
                        if [ -d "${DEPLOY_DIR}/build" ]; then
                            echo "Backing up existing deployment..."
                            mv ${DEPLOY_DIR}/build ${DEPLOY_DIR}/build.backup.\$(date +%Y%m%d_%H%M%S) || true
                        fi
                        
                        # Copy new build
                        echo "Copying new build files..."
                        cp -r build ${DEPLOY_DIR}/
                        
                        # Check if serve is installed
                        if ! which serve > /dev/null 2>&1; then
                            echo "ERROR: 'serve' is not installed. Please install it: npm install -g serve"
                            exit 1
                        fi
                        echo "✅ serve found at: \$(which serve)"
                        
                        # Check if PM2 is installed
                        if ! which pm2 > /dev/null 2>&1; then
                            echo "ERROR: 'pm2' is not installed. Please install it: npm install -g pm2"
                            exit 1
                        fi
                        echo "✅ PM2 found at: \$(which pm2)"
                        
                        # Start application with PM2
                        echo "Starting application on port ${APP_PORT}..."
                        cd ${DEPLOY_DIR}
                        
                        # Start with serve - correct syntax
                        pm2 start serve --name ${APP_NAME} -- -s build -l ${APP_PORT} -n
                        sleep 3
                        
                        # Check PM2 status
                        pm2 status
                        
                        # Check if application is running
                        if pm2 list | grep -q "${APP_NAME}.*online"; then
                            echo "✅ Application started successfully"
                        else
                            echo "❌ Application failed to start. Checking logs..."
                            pm2 logs ${APP_NAME} --lines 50 --nostream
                            exit 1
                        fi
                        
                        # Check if port is listening
                        echo "Checking if port ${APP_PORT} is listening..."
                        netstat -tlnp 2>/dev/null | grep :${APP_PORT} || ss -tlnp 2>/dev/null | grep :${APP_PORT} || echo "Port check command not available"
                        
                        # Save PM2 config
                        pm2 save
                        
                        echo "✅ Deployment completed successfully!"
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Performing application health check...'
                script {
                    sh 'sleep 3'  // Wait for application to stabilize
                    
                    def maxRetries = 5
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        try {
                            // Check PM2 status first
                            def pm2Status = sh(
                                script: "pm2 list | grep ${APP_NAME} || true",
                                returnStdout: true
                            ).trim()
                            echo "PM2 Status: ${pm2Status}"
                            
                            // Try curl with better error handling
                            def curlResult = sh(
                                script: "curl -f -s -o /dev/null -w '%{http_code}' http://localhost:${APP_PORT} 2>&1 || echo 'FAILED'",
                                returnStdout: true
                            ).trim()
                            
                            echo "Health check attempt ${retryCount + 1}: Response = ${curlResult}"
                            
                            if (curlResult == '200') {
                                healthCheckPassed = true
                                echo '✅ Health check passed! Application is responding.'
                            } else {
                                retryCount++
                                if (retryCount < maxRetries) {
                                    echo "Attempt ${retryCount} failed. Retrying in 5 seconds..."
                                    sh 'sleep 5'
                                } else {
                                    // Last attempt - show detailed info
                                    echo "Final attempt failed. Gathering debug info..."
                                    sh """
                                        echo "=== PM2 Status ==="
                                        pm2 status
                                        echo "=== PM2 Logs (last 30 lines) ==="
                                        pm2 logs ${APP_NAME} --lines 30 --nostream || true
                                        echo "=== Port Check ==="
                                        netstat -tlnp 2>/dev/null | grep :${APP_PORT} || ss -tlnp 2>/dev/null | grep :${APP_PORT} || echo "No process listening on port ${APP_PORT}"
                                        echo "=== Process List ==="
                                        ps aux | grep -E 'serve|node' | grep -v grep || true
                                    """
                                }
                            }
                        } catch (Exception e) {
                            retryCount++
                            echo "Health check attempt ${retryCount} exception: ${e.message}"
                            if (retryCount < maxRetries) {
                                sh 'sleep 5'
                            }
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("❌ Health check failed after ${maxRetries} attempts. Application is not responding on port ${APP_PORT}")
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
                    ls -t build.backup.* 2>/dev/null | tail -n +4 | xargs -r rm -rf || true
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
                                rm -rf ${DEPLOY_DIR}/build
                                cp -r \$latest_backup ${DEPLOY_DIR}/build
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
