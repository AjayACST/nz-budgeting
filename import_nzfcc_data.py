import json
import mariadb

# Load JSON data from a file
with open('nzfcc_categories.json', 'r') as file:
    data = json.load(file)

# Extract unique service names, their corresponding _id, and the group name
unique_entries = []

for item in data:
    if 'groups' in item and 'personal_finance' in item['groups']:
        service_name = item['name']  # The main service name
        service_id = item['_id']  # The service _id
        group_name = item['groups']['personal_finance']['name']  # The group name

        if service_name and service_id and group_name:
            unique_entries.append((service_name, service_id, group_name))  # Store as a tuple

# Connect to MariaDB
try:
    connection = mariadb.connect(
        host='localhost',  # Replace with your host
        user='budget',  # Replace with your database username
        password='12345',  # Replace with your database password
        database='budget'  # Replace with your database name
    )

    cursor = connection.cursor()

    # Insert each unique entry into the database
    for service_name, service_id, group_name in unique_entries:
        try:
            cursor.execute("INSERT INTO nzfcc_groups VALUES (?, ?, ?)",
                           (service_id, service_name, group_name))
        except mariadb.Error as err:
            print(f"Error inserting {service_name}: {err}")
            continue

    # Commit the transaction
    connection.commit()
    print("Unique services and their group names have been inserted into the database.")

except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
finally:
    if connection:
        cursor.close()
        connection.close()
