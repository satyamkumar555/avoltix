// Usage: node scripts/seed-categories.mjs   (adds starter categories only if none exist; no products are created)
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
if (!(await db.collection("categories").limit(1).get()).empty) { console.log("Categories already exist. Nothing changed."); process.exit(0); }
const c = (id, name, description, order, parentId = null) => ({ id, name, description, order, parentId, published: true });
const list = [
  c("dev-boards", "Development Boards", "Arduino, ESP32, Raspberry Pi and more", 1), c("arduino", "Arduino Boards", "Uno, Nano, Mega", 1, "dev-boards"),
  c("microcontrollers", "Microcontrollers", "ESP32, ESP8266, STM32, PIC", 2), c("sensors", "Sensors and Modules", "Distance, temperature, motion, gas", 3),
  c("ics", "ICs and Semiconductors", "Logic, driver, timer and amplifier ICs", 4), c("passive", "Passive Components", "Resistors, capacitors, inductors", 5),
  c("motors", "Motors and Drivers", "Servo, DC and stepper motors", 6), c("power", "Batteries and Power", "Cells, chargers, supplies", 7),
  c("wires", "Wires and Connectors", "Cables, jumpers, connectors", 8), c("robotics", "Robotics Kits and DIY", "Kits and DIY projects", 9),
  c("printers", "3D Printers", "Printers, parts and filament", 10), c("tools", "Tools and Testing", "Soldering and measurement tools", 11),
];
const batch = db.batch();
for (const { id, ...rest } of list) batch.set(db.collection("categories").doc(id), rest);
await batch.commit();
console.log(`Added ${list.length} categories.`);
