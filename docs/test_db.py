import mysql.connector

try:
    conexion = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",  # tu contraseña si la tienes
        database="utppedidos"  # exacto, mayúsculas
    )
    print("✅ Conexión exitosa.")
except mysql.connector.Error as err:
    print("❌ Error al conectar a MySQL:", err)
