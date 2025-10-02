# Use an official Nginx runtime as a parent image
FROM nginx:alpine

# Set locale to handle character encoding properly
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static files to the Nginx html directory with proper encoding
COPY . /usr/share/nginx/html/

# Ensure proper permissions and fix any encoding issues

# Make port 80 available to the world outside this container
EXPOSE 80
