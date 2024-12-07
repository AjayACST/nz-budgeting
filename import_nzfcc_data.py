import json
import mariadb

# Load JSON data from a file
with open('nzfcc_categories.json', 'r') as file:
    data = json.load(file)

# Extract unique names under groups: personal_finance
unique_names = set()

for item in data:
    if 'groups' in item and 'personal_finance' in item['groups']:
        name = item['groups']['personal_finance'].get('name')
        if name:
            unique_names.add(name)

# Connect to MariaDB
try:
    connection = mariadb.connect(
        host='localhost',  # Replace with your host
        user='budget',  # Replace with your database username
        password='12345',  # Replace with your database password
        database='budget'  # Replace with your database name
    )

    cursor = connection.cursor()

    # Insert each unique name into the database
    for name in unique_names:
        try:
            cursor.execute("INSERT INTO nzfcc_groups (group_name) VALUES (?)", (name,))
        except mariadb.Error as err:
            print(f"Error: {err}")
            continue

    # Commit the transaction
    connection.commit()
    print("Unique names have been inserted into the database.")

except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
finally:
    cursor.close()
    connection.close()
