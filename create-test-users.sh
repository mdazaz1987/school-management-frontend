#!/bin/bash
BACKEND_URL="http://141.148.218.230:9090"

# Function to register a user
register_user() {
    local firstName=$1
    local lastName=$2
    local email=$3
    local password=$4
    local role=$5
    
    echo "Creating $role user: $email"
    curl -s -X POST ${BACKEND_URL}/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"firstName\": \"$firstName\",
        \"lastName\": \"$lastName\",
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"role\": \"$role\",
        \"schoolId\": \"school123\"
      }"
    echo ""
}

# Create users
register_user "Admin" "User" "admin@school.com" "Admin@123" "ADMIN"
register_user "John" "Teacher" "teacher@school.com" "Teacher@123" "TEACHER"
register_user "Jane" "Student" "student@school.com" "Student@123" "STUDENT"
register_user "Robert" "Parent" "parent@school.com" "Parent@123" "PARENT"

echo "✅ All users created!"
