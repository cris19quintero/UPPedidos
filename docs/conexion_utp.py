"""
API Flask para Sistema de Pedidos UTP
Integración entre JavaScript y MySQL
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Para manejar sesiones
CORS(app)  # Permitir requests desde JavaScript

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # CAMBIAR POR TU CONTRASEÑA
    'database': 'UTPPEDIDOS',
    'port': 3306
}

def get_db_connection():
    """Crear conexión a la base de datos"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error de conexión: {e}")
        return None
# =================== ENCRITAR LA CONTRASEÑA ===================

def hash_password(password):
    """Hashear contraseña para seguridad"""
    return hashlib.sha256(password.encode()).hexdigest()

# =================== RUTAS DE AUTENTICACIÓN ===================

@app.route('/api/login', methods=['POST'])
def login():
    """Autenticar usuario"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y contraseña requeridos'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # Verificar usuario
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, correo_electronico, contraseña, edificio_habitual
            FROM Usuarios 
            WHERE correo_electronico = %s AND activo = TRUE
        """, (email,))
        
        user = cursor.fetchone()
        
        if user and user['contraseña'] == hash_password(password):
            # Login exitoso
            session['user_id'] = user['id_usuario']
            session['user_email'] = user['correo_electronico']
            
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user['id_usuario'],
                    'nombre': user['nombre'],
                    'apellido': user['apellido'],
                    'email': user['correo_electronico'],
                    'edificio_habitual': user['edificio_habitual']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Credenciales incorrectas'}), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error del servidor: {str(e)}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'message': 'Error de conexión'}), 500
        
        cursor = connection.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id_usuario FROM Usuarios WHERE correo_electronico = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El email ya está registrado'}), 409
        
        # Insertar nuevo usuario
        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido, correo_electronico, contraseña, 
                                facultad, telefono, edificio_habitual)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['nombre'],
            data['apellido'], 
            data['email'],
            hash_password(data['password']),
            data.get('facultad', ''),
            data.get('telefono', ''),
            data.get('edificio_habitual', 1)
        ))
        
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user_id': cursor.lastrowid
        })
    
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# =================== RUTAS DE CAFETERÍAS Y PRODUCTOS ===================

@app.route('/api/cafeterias', methods=['GET'])
def get_cafeterias():
    """Obtener todas las cafeterías"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM Cafeterias WHERE activa = TRUE")
        cafeterias = cursor.fetchall()
        
        return jsonify({'success': True, 'cafeterias': cafeterias})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/productos/<int:cafeteria_id>', methods=['GET'])
def get_productos_cafeteria(cafeteria_id):
    """Obtener productos de una cafetería específica"""
    try:
        horario_id = request.args.get('horario_id', 1)  # Por defecto desayuno
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, c.nombre as categoria_nombre, h.nombre as horario_nombre
            FROM Productos p
            JOIN CategoriasProductos c ON p.id_categoria = c.id_categoria
            JOIN Horarios h ON p.id_horario = h.id_horario
            WHERE p.id_cafeteria = %s AND p.id_horario = %s AND p.activo = TRUE
            ORDER BY p.precio ASC
        """, (cafeteria_id, horario_id))
        
        productos = cursor.fetchall()
        
        return jsonify({'success': True, 'productos': productos})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/horarios', methods=['GET'])
def get_horarios():
    """Obtener horarios disponibles"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM Horarios WHERE activo = TRUE")
        horarios = cursor.fetchall()
        
        return jsonify({'success': True, 'horarios': horarios})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# =================== RUTAS DE CARRITO Y PEDIDOS ===================

@app.route('/api/pedido', methods=['POST'])
def crear_pedido():
    """Crear un nuevo pedido desde el carrito"""
    try:
        data = request.get_json()
        
        # Verificar que el usuario esté logueado
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Calcular total
        total = sum(item['price'] * item['quantity'] for item in data['items'])
        
        # Crear el pedido
        cursor.execute("""
            INSERT INTO Pedidos (id_usuario, id_cafeteria, id_horario, total, notas)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            data['cafeteria_id'],
            data.get('horario_id', 1),
            total,
            data.get('notas', '')
        ))
        
        pedido_id = cursor.lastrowid
        
        # Agregar detalles del pedido
        for item in data['items']:
            cursor.execute("""
                INSERT INTO DetallePedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                pedido_id,
                item['producto_id'],
                item['quantity'],
                item['price'],
                item['price'] * item['quantity']
            ))
        
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Pedido creado exitosamente',
            'pedido_id': pedido_id,
            'total': total
        })
    
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/pedidos', methods=['GET'])
def get_pedidos_usuario():
    """Obtener pedidos del usuario actual"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, c.nombre as cafeteria_nombre, h.nombre as horario_nombre
            FROM Pedidos p
            JOIN Cafeterias c ON p.id_cafeteria = c.id_cafeteria
            JOIN Horarios h ON p.id_horario = h.id_horario
            WHERE p.id_usuario = %s
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))
        
        pedidos = cursor.fetchall()
        
        # Obtener detalles de cada pedido
        for pedido in pedidos:
            cursor.execute("""
                SELECT dp.*, pr.nombre_producto
                FROM DetallePedidos dp
                JOIN Productos pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = %s
            """, (pedido['id_pedido'],))
            
            pedido['detalles'] = cursor.fetchall()
        
        return jsonify({'success': True, 'pedidos': pedidos})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/pedido/<int:pedido_id>/estado', methods=['PUT'])
def actualizar_estado_pedido(pedido_id):
    """Actualizar estado de un pedido"""
    try:
        data = request.get_json()
        nuevo_estado = data.get('estado')
        
        if nuevo_estado not in ['pendiente', 'por_retirar', 'retirado', 'finalizado', 'cancelado', 'expirado']:
            return jsonify({'success': False, 'message': 'Estado inválido'}), 400
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            UPDATE Pedidos 
            SET estado = %s 
            WHERE id_pedido = %s AND id_usuario = %s
        """, (nuevo_estado, pedido_id, session.get('user_id')))
        
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'success': True, 'message': 'Estado actualizado'})
        else:
            return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# =================== RUTA DE ESTADÍSTICAS ===================

@app.route('/api/stats', methods=['GET'])
def get_estadisticas():
    """Obtener estadísticas generales del sistema"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Total de usuarios
        cursor.execute("SELECT COUNT(*) as total FROM Usuarios WHERE activo = TRUE")
        total_usuarios = cursor.fetchone()['total']
        
        # Total de pedidos
        cursor.execute("SELECT COUNT(*) as total FROM Pedidos")
        total_pedidos = cursor.fetchone()['total']
        
        # Total de productos
        cursor.execute("SELECT COUNT(*) as total FROM Productos WHERE activo = TRUE")
        total_productos = cursor.fetchone()['total']
        
        # Cafetería más popular
        cursor.execute("""
            SELECT c.nombre, COUNT(p.id_pedido) as total_pedidos
            FROM Cafeterias c
            LEFT JOIN Pedidos p ON c.id_cafeteria = p.id_cafeteria
            GROUP BY c.id_cafeteria, c.nombre
            ORDER BY total_pedidos DESC
            LIMIT 1
        """)
        cafeteria_popular = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'estadisticas': {
                'total_usuarios': total_usuarios,
                'total_pedidos': total_pedidos,
                'total_productos': total_productos,
                'cafeteria_popular': cafeteria_popular
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# =================== INICIALIZACIÓN ===================

if __name__ == '__main__':
    print("🚀 Iniciando API Flask para Sistema UTP Pedidos")
    print("📡 Servidor disponible en: http://localhost:5000")
    print("📋 Endpoints disponibles:")
    print("   POST /api/login - Autenticar usuario")
    print("   POST /api/register - Registrar usuario")
    print("   GET  /api/cafeterias - Obtener cafeterías")
    print("   GET  /api/productos/<id> - Obtener productos por cafetería")
    print("   GET  /api/horarios - Obtener horarios")
    print("   POST /api/pedido - Crear pedido")
    print("   GET  /api/pedidos - Obtener pedidos del usuario")
    print("   PUT  /api/pedido/<id>/estado - Actualizar estado del pedido")
    print("   GET  /api/stats - Estadísticas del sistema")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)