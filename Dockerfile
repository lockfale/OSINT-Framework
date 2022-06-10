FROM httpd:alpine
COPY ./public/ /usr/local/apache2/htdocs/
