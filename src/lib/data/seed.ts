import type { Product } from "@/lib/validations/product";
import { rupeesToPaise as r } from "@/lib/money";
import type { Category } from "@/lib/categories";

export type DemoProduct = Omit<Product, "id"> & { specs?: Record<string, string>; featured?: boolean; isNew?: boolean };

// DEMO DATA: illustrative names and prices for local preview only. Replace with real products from the admin panel.
const c = (id: string, name: string, description: string, order: number, parentId: string | null = null): Category => ({ id, name, description, parentId, order, published: true });
export const CATEGORIES: Category[] = [
  c("dev-boards", "Development Boards", "Arduino and compatible boards", 1),
  c("arduino", "Arduino Boards", "Uno, Nano and compatible", 1, "dev-boards"),
  c("microcontrollers", "Microcontrollers", "ESP32, ESP8266 and more", 2),
  c("sensors", "Sensors and Modules", "Distance, temperature, motion", 3),
  c("ics", "ICs and Semiconductors", "Timer, driver and logic ICs", 4),
  c("passive", "Passive Components", "Resistors, capacitors, inductors", 5),
  c("motors", "Motors and Drivers", "Servo, DC and stepper motors", 6),
  c("power", "Batteries and Power", "Cells, chargers, supplies", 7),
  c("tools", "Tools", "Soldering and testing tools", 8),
  c("robotics", "Robotics Kits and DIY", "Build-it-yourself kits", 9),
];

function p(sku: string, name: string, cat: string, price: number, mrp: number, stock: number, short: string,
  extra: Partial<DemoProduct> = {}): DemoProduct {
  return {
    sku, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    shortDescription: short, categoryId: cat, price: r(price), mrp: r(mrp), stock, reserved: 0,
    lowStockThreshold: 5, minOrderQty: 1, status: "published", ...extra,
  };
}

export const SEED_PRODUCTS: DemoProduct[] = [
  p("AVX-DEV-ARD-0001", "Arduino Uno R3 Compatible Board", "arduino", 549, 799, 40, "ATmega328P based board for learning and prototyping.", { featured: true, brand: "Generic", specs: { "Microcontroller": "ATmega328P", "Operating voltage": "5 V" } }),
  p("AVX-DEV-ARD-0002", "Arduino Nano Compatible Board", "arduino", 349, 499, 60, "Compact ATmega328P board for breadboards.", { isNew: true, specs: { "Microcontroller": "ATmega328P", "Operating voltage": "5 V" } }),
  p("AVX-MCU-ESP-0001", "ESP32 DevKit Wi-Fi and Bluetooth Board", "microcontrollers", 499, 699, 35, "Dual-mode wireless board for IoT projects.", { featured: true, isNew: true, specs: { "Wireless": "Wi-Fi and Bluetooth", "Logic level": "3.3 V" } }),
  p("AVX-MCU-ESP-0002", "ESP8266 NodeMCU Board", "microcontrollers", 329, 449, 3, "Low-cost Wi-Fi development board.", { specs: { "Wireless": "Wi-Fi", "Logic level": "3.3 V" } }),
  p("AVX-SEN-ULT-0001", "HC-SR04 Ultrasonic Distance Sensor", "sensors", 89, 149, 120, "Non-contact distance measurement module.", { featured: true, specs: { "Operating voltage": "5 V" } }),
  p("AVX-SEN-TMP-0001", "DHT11 Temperature and Humidity Sensor", "sensors", 99, 160, 80, "Basic digital temperature and humidity module.", { specs: { "Operating voltage": "3.3 V to 5 V" } }),
  p("AVX-IC-TMR-0001", "NE555 Timer IC (DIP-8)", "ics", 15, 25, 300, "Classic timer IC for pulse and oscillator circuits.", { specs: { "Package": "DIP-8" } }),
  p("AVX-IC-DRV-0001", "L293D Motor Driver IC (DIP-16)", "ics", 69, 99, 0, "Dual H-bridge driver for small DC motors.", { specs: { "Package": "DIP-16" } }),
  p("AVX-PAS-RES-0001", "10K Ohm Resistor, Pack of 100", "passive", 49, 79, 200, "Through-hole 1/4 W resistors.", { specs: { "Resistance": "10 kOhm", "Pack size": "100" } }),
  p("AVX-MOT-SRV-0001", "SG90 Micro Servo Motor", "motors", 129, 199, 90, "Small hobby servo for robotics projects."),
  p("AVX-PWR-BAT-0001", "18650 Li-ion Rechargeable Cell", "power", 199, 299, 50, "Rechargeable cell for portable projects.", { specs: { "Nominal voltage": "3.7 V" } }),
  p("AVX-TLS-SLD-0001", "Adjustable Temperature Soldering Iron", "tools", 899, 1299, 15, "Soldering iron for electronics assembly."),
  p("AVX-ROB-KIT-0001", "Obstacle Avoiding Robot DIY Kit", "robotics", 1499, 1999, 12, "Build and program your own robot car.", { featured: true, isNew: true }),
];
