import mysql.connector

try:
    conexion = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # tu contraseña si la tienes
        database="UTPPEDIDOS"  # exacto, mayúsculas
    )
    print("✅ Conexión exitosa.")
except mysql.connector.Error as err:
    print("❌ Error al conectar a MySQL:", err)
