pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'  // Configure this in Jenkins Global Tool Configuration
    }
    
    environment {
        REACT_APP_API_URL = credentials('react-app-api-url')  // Store as Jenkins credential
        SCANNER_HOME = tool 'sonar-scanner'  // SonarQube scanner
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from SCM...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    echo 'Installing NPM dependencies...'
                    sh 'npm install'
                }
            }
        }
        
        stage('Lint & Code Quality') {
            steps {
                dir('frontend') {
                    echo 'Running ESLint...'
                    sh 'npm run lint || true'  // Continue even if lint fails
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('frontend') {
                    echo 'Running unit tests...'
                    sh 'npm test -- --coverage --watchAll=false || true'
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                dir('frontend') {
                    script {
                        withSonarQubeEnv('SonarQube') {  // Configure in Jenkins
                            sh """
                                ${SCANNER_HOME}/bin/sonar-scanner \
                                -Dsonar.projectKey=school-management-frontend \
                                -Dsonar.projectName='School Management Frontend' \
                                -Dsonar.sources=src \
                                -Dsonar.tests=src \
                                -Dsonar.test.inclusions=**/*.test.tsx,**/*.test.ts \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                            """
                        }
                    }
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        
        stage('Build Application') {
            steps {
                dir('frontend') {
                    echo 'Building React application...'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    script {
                        echo 'Building Docker image...'
                        def dockerImage = docker.build("school-management-frontend:${BUILD_NUMBER}")
                        
                        // Tag as latest
                        sh "docker tag school-management-frontend:${BUILD_NUMBER} school-management-frontend:latest"
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        sh "docker push school-management-frontend:${BUILD_NUMBER}"
                        sh "docker push school-management-frontend:latest"
                    }
                }
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to Development environment...'
                script {
                    // Deploy to dev server
                    sh '''
                        ssh user@dev-server "
                            cd /opt/school-management/frontend &&
                            docker-compose pull &&
                            docker-compose up -d
                        "
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'staging'
            }
            steps {
                input message: 'Deploy to Staging?', ok: 'Deploy'
                echo 'Deploying to Staging environment...'
                script {
                    sh '''
                        ssh user@staging-server "
                            cd /opt/school-management/frontend &&
                            docker-compose pull &&
                            docker-compose up -d
                        "
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                echo 'Deploying to Production environment...'
                script {
                    sh '''
                        ssh user@prod-server "
                            cd /opt/school-management/frontend &&
                            docker-compose pull &&
                            docker-compose up -d
                        "
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Performing health check...'
                    sh 'sleep 10'  // Wait for deployment
                    
                    def response = sh(
                        script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000',
                        returnStdout: true
                    ).trim()
                    
                    if (response != '200') {
                        error("Health check failed with status: ${response}")
                    }
                    echo 'Health check passed!'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        
        success {
            echo 'Pipeline completed successfully!'
            // Send success notification
            emailext(
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    <p>SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                    <p>Check console output at <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a></p>
                """,
                to: 'team@example.com',
                mimeType: 'text/html'
            )
        }
        
        failure {
            echo 'Pipeline failed!'
            // Send failure notification
            emailext(
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    <p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
                    <p>Check console output at <a href='${env.BUILD_URL}'>${env.BUILD_URL}</a></p>
                """,
                to: 'team@example.com',
                mimeType: 'text/html'
            )
        }
        
        unstable {
            echo 'Pipeline is unstable'
        }
    }
}
