# avanzar_10_segundos.py

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
import time

class Avanzar10Segundos(Node):

    def __init__(self):
        super().__init__('avanzar_10_segundos')
        self.publisher_ = self.create_publisher(Twist, '/diffbot_base_controller/cmd_vel_unstamped', 10)
        self.timer = self.create_timer(1.0, self.timer_callback)
        self.start_time = time.time()
        self.run_for_seconds = 10  # Duración en segundos

    def timer_callback(self):
        elapsed_time = time.time() - self.start_time
        if elapsed_time > self.run_for_seconds:
            self.stop_robot()
            self.get_logger().info('Rutina completada: el robot ha avanzado durante 10 segundos.')
            rclpy.shutdown()
        else:
            msg = Twist()
            msg.linear.x = 0.2  # Velocidad en metros por segundo (ajústala según tu robot)
            msg.angular.z = 0.0  # Sin rotación
            self.publisher_.publish(msg)
            self.get_logger().info(f'Avanzando... Tiempo transcurrido: {elapsed_time:.2f} segundos')

    def stop_robot(self):
        msg = Twist()
        msg.linear.x = 0.0
        msg.angular.z = 0.0
        self.publisher_.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    nodo = Avanzar10Segundos()
    rclpy.spin(nodo)
    nodo.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
