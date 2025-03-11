# Use the official MySQL image as base
FROM mysql:8.0

# Environment variables for MySQL configuration
ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=mydb
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=userpassword

# Expose MySQL default port
EXPOSE 3306

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1
