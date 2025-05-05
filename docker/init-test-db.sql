CREATE USER notimon_test WITH PASSWORD 'notimon_test';
CREATE DATABASE notimon_test;
GRANT ALL PRIVILEGES ON DATABASE notimon_test TO notimon_test;
\c notimon_test;
GRANT ALL ON SCHEMA public TO notimon_test; 