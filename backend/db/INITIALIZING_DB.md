Implemented migration from sqlite -> postgres


#1 Download/install postgresql and psql

#2 Install psycopg3 - https://www.psycopg.org/psycopg3/docs/basic/install.html

update your .env file with your postgres credentials, mine looks something like this:

PG_DATABASE=deductly
PG_USER=aniru
PG_PASSWORD=[redacted]   
PG_HOST=localhost
PG_PORT=5432

DATABASE_URL='postgresql://aniru:[redacted]@localhost:5432/deductly'

the DATABASE_URL variable supercedes the PG variables, but you can keep them in your .env file for reference. connection.py will create a connection string using the PG variables if DATABASE_URL is not set.


I ran out of credits so please ask claude to create all the tables in "schema.py", and then run migrate_skills.py and migrate_questions.py. The app should be fully functional after that.